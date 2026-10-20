import type {
    DockviewApi,
    DockviewGroupPanel,
    GroupPanelPartInitParameters,
    IContentRenderer,
    SerializedDockview,
} from 'dockview';
import {
    broadcastLayout,
    nativeHostInfo,
    onLayoutBroadcast,
    openNativeWindow,
    windowLabel,
    workspaceInfo,
} from './bridge';
import { resolveDndStrategy } from './dnd';
import { button, el, field, LogView, verdict } from './dom';
import { diagnosePopoutUrl, readHostReport } from './host';
import type { Hub } from './hub';
import { describe, probeWindowOpen } from './probes';
import { RELEASE_ORIGIN_URL, simulateReleaseOriginRestore } from './simulate';

abstract class DemoPanel implements IContentRenderer {
    protected readonly root = el('div', { class: 'demo-panel' });
    private readonly teardown: (() => void)[] = [];
    private disposed = false;

    get element(): HTMLElement {
        return this.root;
    }

    abstract init(parameters: GroupPanelPartInitParameters): void;

    /** Runs `fn` on dispose, or straight away if the panel is already gone. */
    protected onDispose(fn: () => void): void {
        if (this.disposed) {
            fn();
            return;
        }
        this.teardown.push(fn);
    }

    dispose(): void {
        this.disposed = true;
        for (const fn of this.teardown.splice(0)) {
            fn();
        }
    }
}

function section(title: string, ...children: (Node | string)[]): HTMLElement {
    return el(
        'section',
        { class: 'demo-section' },
        el('h2', { class: 'demo-heading' }, title),
        ...children
    );
}

/** What the page thinks it is running inside. */
export class HostPanel extends DemoPanel {
    init(parameters: GroupPanelPartInitParameters): void {
        const body = el('div');
        const api = parameters.containerApi;
        const requested = resolveDndStrategy();

        // Live, because the interesting moment is mid-drag: a pointer drag
        // that selects the text it crosses cannot be measured by anything
        // that needs a click to refresh, since the click clears the
        // selection. `peak` keeps the high-water mark for the same reason.
        let peak = 0;
        let shieldSeen = false;
        let overlayEvents = 0;
        let renderedOverlayEvents = 0;
        let selectStarts = 0;
        let selectStartsPrevented = 0;
        const selection = el('div', { class: 'demo-diag' });

        const renderSelection = () => {
            const length = globalThis.getSelection()?.toString().length ?? 0;
            peak = Math.max(peak, length);
            const caps = api.dndCapabilities;
            selection.replaceChildren(
                field(
                    'dnd backend',
                    `${requested} → ${
                        [
                            caps.html5 && 'html5',
                            caps.pointer &&
                                (caps.pointerHandlesMouse
                                    ? 'pointer (incl. mouse)'
                                    : 'pointer (touch/pen)'),
                        ]
                            .filter(Boolean)
                            .join(' + ') || 'none'
                    }`
                ),
                field('drop overlay events', String(overlayEvents)),
                field('selected chars', `${length} (peak ${peak})`),
                field('shield seen active', shieldSeen ? 'yes' : 'no'),
                field(
                    'selectstart seen / blocked',
                    `${selectStarts} / ${selectStartsPrevented}`
                )
            );
        };

        // A drop overlay means the drag reached dockview: on the HTML5 backend
        // that is the page receiving `dragover`, which is what a host can break.
        const overlays = api.onWillShowOverlay(() => {
            overlayEvents += 1;
        });
        this.onDispose(() => overlays.dispose());

        // The shield is a `user-select` applied and released inside one drag, so
        // it is sampled. Rendering the overlay count here too keeps a
        // dragover-rate event off the render path.
        const sample = setInterval(() => {
            const applied =
                document.documentElement.style.getPropertyValue(
                    'user-select'
                ) === 'none';
            if (applied && !shieldSeen) {
                shieldSeen = true;
                renderSelection();
            }
            if (overlayEvents !== renderedOverlayEvents) {
                renderedOverlayEvents = overlayEvents;
                renderSelection();
            }
        }, 50);

        // Capture phase, so it runs before the shield's own handler and can
        // tell whether the event arrived at all separately from whether
        // anything cancelled it. The verdict is read in a task: for an event
        // the browser dispatches, microtasks run between listeners, so a
        // microtask would read `defaultPrevented` before the shield has run.
        const onSelectStart = (event: Event) => {
            selectStarts += 1;
            setTimeout(() => {
                if (event.defaultPrevented) {
                    selectStartsPrevented += 1;
                }
                renderSelection();
            });
        };
        document.addEventListener('selectstart', onSelectStart, true);

        renderSelection();
        document.addEventListener('selectionchange', renderSelection);
        this.onDispose(() => {
            clearInterval(sample);
            document.removeEventListener('selectstart', onSelectStart, true);
            document.removeEventListener('selectionchange', renderSelection);
        });
        const render = () => {
            const report = readHostReport();
            body.replaceChildren(
                field('runtime', report.runtime),
                field('engine', report.engine),
                field('origin', report.origin),
                field('protocol', report.protocol),
                field('secure context', String(report.secureContext)),
                field('user agent', report.userAgent),
                verdict(
                    report.popout.supported,
                    report.popout.supported
                        ? `Popouts allowed here — ${report.popout.reason}.`
                        : `Popouts refused here — ${report.popout.reason}.`
                )
            );
        };

        render();

        this.root.append(
            section(
                'Host environment',
                body,
                selection,
                button('Re-read', render),
                el(
                    'p',
                    { class: 'demo-note' },
                    'Under "tauri dev" the webview loads the Vite dev server over http, so this reads the same as a browser. A release build is where the host and the browser diverge.'
                )
            )
        );
    }
}

/** Whether the popout mechanism itself works in this host. */
export class PopoutPanel extends DemoPanel {
    init(parameters: GroupPanelPartInitParameters): void {
        const log = new LogView();
        const api = parameters.containerApi;
        // read per click: the panel can be dragged into another group, and
        // `api.group` follows it
        const group = () => parameters.api.group;

        this.root.append(
            section(
                'Popout groups',
                el(
                    'p',
                    { class: 'demo-note' },
                    'A popout group opens a second window and moves the group’s DOM into it. That needs a same-origin URL and a script-accessible document.'
                ),
                el(
                    'div',
                    { class: 'demo-buttons' },
                    button('Check the popout URL', () => {
                        const result = diagnosePopoutUrl();
                        log.append(
                            `${result.supported ? 'allowed' : 'refused'}: ${result.url} — ${result.reason}`
                        );
                    }),
                    button('Probe window.open', () => {
                        const result = probeWindowOpen();
                        log.append(`${result.title} — ${result.detail}`);
                    }),
                    button('Pop out this group', () => {
                        popOut(api, group(), log);
                    })
                ),
                el(
                    'p',
                    { class: 'demo-note' },
                    'A popout aimed at another origin is refused. These reproduce that from any origin, by aiming a popout at the origin a macOS or Linux release build serves from.'
                ),
                el(
                    'div',
                    { class: 'demo-buttons' },
                    button('Pop out on a refused origin', () => {
                        popOut(api, group(), log, RELEASE_ORIGIN_URL);
                    }),
                    button('Restore a layout on a refused origin', () => {
                        runRestoreSimulation(log);
                    })
                ),
                log.element
            )
        );
    }
}

/**
 * Runs the saved-layout reproduction and reports whether any group came back
 * registered but unrendered.
 */
function runRestoreSimulation(log: LogView): void {
    log.append('simulating a restore on a refused origin…');

    simulateReleaseOriginRestore().then(
        (result) => {
            for (const step of result.steps) {
                log.append(step);
            }
            log.append(
                `groups=${result.groups} orphaned=${result.orphanedGroups} panels=${result.panels} tabs=${result.visibleTabs}`
            );
            log.append(
                result.orphanedGroups === 0 &&
                    result.visibleTabs === result.panels
                    ? 'every panel came back visible in the grid'
                    : 'a group came back registered but rendering nowhere'
            );
        },
        (err: unknown) => log.append(`simulation failed — ${describe(err)}`)
    );
}

function popOut(
    api: DockviewApi,
    group: DockviewGroupPanel,
    log: LogView,
    popoutUrl?: string
): void {
    api.addPopoutGroup(group, popoutUrl ? { popoutUrl } : undefined).then(
        (opened) => {
            log.append(
                opened
                    ? 'popout group opened'
                    : 'addPopoutGroup resolved false — the host refused the window'
            );
        },
        (err: unknown) => {
            log.append(`addPopoutGroup rejected — ${describe(err)}`);
        }
    );
}

/**
 * Native windows are the isolation boundary: a second Tauri webview runs its
 * own JavaScript context, so nothing can be moved into it from here.
 */
export class NativeWindowPanel extends DemoPanel {
    init(): void {
        const log = new LogView();
        const info = el('div');
        let counter = 0;

        const load = async () => {
            const [label, native] = await Promise.all([
                windowLabel(),
                nativeHostInfo(),
            ]);

            info.replaceChildren(
                field('window label', label),
                ...(native
                    ? [
                          field('tauri', native.tauriVersion),
                          field('webview', native.webviewVersion),
                          field(
                              'platform',
                              `${native.platform} (${native.arch})`
                          ),
                          field(
                              'release origin is http(s)',
                              String(native.httpOrigin)
                          ),
                      ]
                    : [field('shell', 'not running under Tauri')])
            );
        };

        void load().catch((err: unknown) => {
            log.append(`host_info failed — ${describe(err)}`);
        });

        this.root.append(
            section(
                'Native windows',
                info,
                el(
                    'div',
                    { class: 'demo-buttons' },
                    button('Open a second native window', () => {
                        counter += 1;
                        const label = `dock-${Date.now()}-${counter}`;
                        openNativeWindow(label).then(
                            () => log.append(`opened native window ${label}`),
                            (err: unknown) =>
                                log.append(
                                    `could not open ${label} — ${describe(err)}`
                                )
                        );
                    })
                ),
                el(
                    'p',
                    { class: 'demo-note' },
                    'The second window runs a separate webview with its own dockview instance, so no DOM can move between the two. Tabs and groups can still be dragged across: the Cross-window drag panel explains how.'
                ),
                log.element
            )
        );
    }
}

/** Moves layout state, rather than DOM, across the process boundary. */
export class LayoutSyncPanel extends DemoPanel {
    init(parameters: GroupPanelPartInitParameters): void {
        const log = new LogView();
        const api = parameters.containerApi;
        let label = 'browser';

        void windowLabel().then((value) => {
            label = value;
        });

        void onLayoutBroadcast((payload) => {
            if (payload.from === label) {
                return;
            }

            try {
                api.fromJSON(payload.layout as SerializedDockview);
                log.append(`applied layout from ${payload.from}`);
            } catch (err: unknown) {
                log.append(`could not apply layout — ${describe(err)}`);
            }
        }).then((unlisten) => {
            this.onDispose(unlisten);
        });

        this.root.append(
            section(
                'Cross-window layout sync',
                el(
                    'p',
                    { class: 'demo-note' },
                    'Serialized layout travels over Tauri’s event bus, so every native window can converge on the same arrangement without sharing a DOM.'
                ),
                el(
                    'div',
                    { class: 'demo-buttons' },
                    button('Broadcast this layout', () => {
                        broadcastLayout(label, api.toJSON()).then(
                            () => log.append('layout broadcast'),
                            (err: unknown) =>
                                log.append(
                                    `broadcast failed — ${describe(err)}`
                                )
                        );
                    })
                ),
                log.element
            )
        );
    }
}

/**
 * Drag between native windows, brokered by the shell. The OS drag carries a
 * session id; the shell holds the serialized group; the window the drop
 * lands in rebuilds it with `addGroupFromJSON` and the source removes its
 * copy. Only an HTML5 drag can leave a window, so the pointer backend is
 * the first thing to rule out when nothing crosses.
 */
export class HubPanel extends DemoPanel {
    constructor(private readonly hub: () => Hub | undefined) {
        super();
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const log = new LogView();
        const api = parameters.containerApi;
        const status = el('div');
        const tearOff = el('input', { type: 'checkbox' }) as HTMLInputElement;

        const render = () => {
            const hub = this.hub();
            const caps = api.dndCapabilities;
            status.replaceChildren(
                field('window id', hub?.windowId ?? 'not installed'),
                verdict(
                    caps.html5,
                    caps.html5
                        ? 'HTML5 drag active — a drag can leave this window.'
                        : 'Pointer backend only — a drag stops at the window edge. Force ?dnd=html5.'
                ),
                ...(hub
                    ? [
                          field(
                              'drags started',
                              String(hub.counters.dragsStarted)
                          ),
                          field(
                              'drag-overs accepted',
                              String(hub.counters.dragOversAccepted)
                          ),
                          field(
                              'drops claimed',
                              String(hub.counters.dropsClaimed)
                          ),
                          field(
                              'drops refused',
                              String(hub.counters.dropsRefused)
                          ),
                          field('releases', String(hub.counters.releases)),
                      ]
                    : [])
            );
        };

        tearOff.addEventListener('change', () => {
            const hub = this.hub();
            if (hub) {
                hub.tearOff = tearOff.checked;
            }
        });

        const subscribe = () => {
            const hub = this.hub();
            if (!hub) {
                return false;
            }
            tearOff.checked = hub.tearOff;
            this.onDispose(
                hub.onLog((line) => {
                    log.append(line);
                    render();
                })
            );
            return true;
        };

        // The hub is installed right after the instance is created, which
        // is after dockview has asked for this panel.
        if (!subscribe()) {
            const retry = setTimeout(() => {
                subscribe();
                render();
            }, 0);
            this.onDispose(() => clearTimeout(retry));
        }

        render();
        this.onDispose(api.onDidLayoutChange(render).dispose);

        this.root.append(
            section(
                'Cross-window drag',
                el(
                    'p',
                    { class: 'demo-note' },
                    'Open a second native window, then drag a tab or a group header from one window into the other. The drag carries only a session id; the shell holds the serialized group and tells the source to let go once the drop is claimed.'
                ),
                status,
                el(
                    'label',
                    { class: 'demo-field' },
                    tearOff,
                    ' open a new window when a drag ends outside every window (an Escape-cancelled drag looks the same to HTML5, so off by default)'
                ),
                log.element
            )
        );
    }
}

/**
 * What the orchestrator has on record: the file, when it was last written,
 * and every window with its frame and whether it has reported a layout.
 * Read back from the shell rather than from this window, since the point is
 * that the shell is the one that knows.
 */
export class WorkspacePanel extends DemoPanel {
    init(parameters: GroupPanelPartInitParameters): void {
        const api = parameters.containerApi;
        const body = el('div');

        const render = async () => {
            const info = await workspaceInfo();
            if (!info) {
                body.replaceChildren(field('shell', 'not running under Tauri'));
                return;
            }
            body.replaceChildren(
                field('file', info.path),
                field(
                    'last saved',
                    info.lastSaved
                        ? new Date(info.lastSaved).toLocaleTimeString()
                        : 'not yet this run'
                ),
                ...info.windows.map((window) =>
                    field(
                        window.label,
                        `${
                            window.geometry
                                ? `${window.geometry.width}×${window.geometry.height} at ${window.geometry.x},${window.geometry.y}`
                                : 'no geometry yet'
                        } — ${window.hasLayout ? 'layout on record' : 'no layout yet'}`
                    )
                )
            );
        };

        const refresh = () => {
            void render().catch((err: unknown) => {
                body.replaceChildren(
                    field('workspace_info failed', describe(err))
                );
            });
        };

        // The save is debounced in the shell; look a moment after a change.
        let timer: ReturnType<typeof setTimeout> | undefined;
        this.onDispose(
            api.onDidLayoutChange(() => {
                clearTimeout(timer);
                timer = setTimeout(refresh, 1200);
            }).dispose
        );
        this.onDispose(() => clearTimeout(timer));
        refresh();

        this.root.append(
            section(
                'Workspace',
                el(
                    'p',
                    { class: 'demo-note' },
                    'The shell owns one file naming every window, its frame and its dockview layout. Each window receives its layout from the shell at start and reports changes back; close the app and reopen it to see every window return.'
                ),
                body,
                button('Re-read', refresh)
            )
        );
    }
}

/**
 * The one undo history across every window. Each window keeps dockview's
 * own stack for its local steps; the shell orders them with the moves
 * between windows and says which window undoes next. Ctrl+Z anywhere goes
 * to the shell.
 */
export class HistoryPanel extends DemoPanel {
    constructor(private readonly hub: () => Hub | undefined) {
        super();
    }

    init(): void {
        const log = new LogView();
        const status = el('div');

        const render = () => {
            const info = this.hub()?.history;
            status.replaceChildren(
                field('undo steps', String(info?.undoCount ?? 0)),
                field('next undo', info?.nextUndo ?? 'nothing'),
                field('redo steps', String(info?.redoCount ?? 0)),
                field('next redo', info?.nextRedo ?? 'nothing')
            );
        };

        const subscribe = () => {
            const hub = this.hub();
            if (!hub) {
                return false;
            }
            const history = hub.onDidChangeHistory(render);
            this.onDispose(() => history.dispose());
            const moves = hub.onDidMoveAcrossWindows((notice) => {
                log.append(
                    `${notice.reason}: ${notice.panels.join(', ')} ${notice.from} → ${notice.to}`
                );
            });
            this.onDispose(() => moves.dispose());
            return true;
        };

        // Installed right after the instance is created, which is after
        // dockview has asked for this panel.
        if (!subscribe()) {
            const retry = setTimeout(() => {
                subscribe();
                render();
            }, 0);
            this.onDispose(() => clearTimeout(retry));
        }
        render();

        this.root.append(
            section(
                'Undo across windows',
                el(
                    'p',
                    { class: 'demo-note' },
                    'One history for every window. Ctrl+Z here undoes the most recent step wherever it happened, including a tab that crossed to another window.'
                ),
                status,
                el(
                    'div',
                    { class: 'demo-buttons' },
                    button('Undo', () => this.hub()?.undo()),
                    button('Redo', () => this.hub()?.redo())
                ),
                log.element
            )
        );
    }
}

/** Plain content, so the layout has something ordinary to dock around. */
export class ScratchPanel extends DemoPanel {
    init(): void {
        this.root.append(
            section(
                'Scratch panel',
                el(
                    'p',
                    { class: 'demo-note' },
                    'Drag, split and float this panel to exercise the enterprise features the demo pulls in.'
                )
            )
        );
    }
}
