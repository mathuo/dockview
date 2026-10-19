/**
 * Cross-window drag and drop through the shell.
 *
 * Every native window runs its own dockview instance in its own JavaScript
 * context, so nothing can be moved between them as DOM. What can cross is an
 * OS drag session, and only an HTML5 drag rides one. The hub uses that: the
 * drag's `DataTransfer` carries a session id and nothing else, the shell
 * holds the serialized group for that session, and the window the drop lands
 * in rebuilds the group from it with `addGroupFromJSON`. The source window is
 * then told to remove its copy. No window owns another; the shell is the only
 * party that knows which drag is in flight.
 */

import {
    type AddPanelOptions,
    type DockviewApi,
    type DockviewDidDropEvent,
    type DockviewGroupPanel,
    type GroupviewPanelState,
    type IDockviewPanel,
    type SerializedDockviewGroup,
    positionToDirection,
} from 'dockview';
import {
    type DragKind,
    claimDrop,
    dragEnd,
    dragStart,
    onRelease,
    peekDrag,
    takePendingGroup,
    windowLabel,
} from './bridge';
import { isTauri } from './host';

/**
 * The drag type that marks a dockview drag as one the hub brokers. During
 * `dragover` a browser exposes a drag's types but not its data, so this is
 * what the destination accepts on; the session id is read at the drop.
 */
export const HUB_DRAG_TYPE = 'application/x-dockview-hub';

/**
 * A random id for groups, panels and drag sessions. `randomUUID` is only
 * defined in a secure context, which a custom-scheme origin such as
 * `tauri://localhost` need not be, so fall back to raw random bytes.
 */
export function randomId(): string {
    const crypto = globalThis.crypto;
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
        byte.toString(16).padStart(2, '0')
    ).join('');
}

export interface HubCounters {
    dragsStarted: number;
    dragOversAccepted: number;
    dropsClaimed: number;
    dropsRefused: number;
    releases: number;
    tearOffs: number;
}

export interface Hub {
    /** This window's label; `browser` outside the shell. */
    readonly label: string;
    readonly counters: Readonly<HubCounters>;
    /** Turn an unclaimed drag into a new window. Off by default: HTML5 cannot tell a drop on the desktop from a cancelled drag. */
    tearOff: boolean;
    onLog(listener: (line: string) => void): () => void;
    dispose(): void;
}

/** What the source window remembers about a drag, to act on its release. */
interface LocalSession {
    kind: DragKind;
    /** The panel id (`panel`) or group id (`group`) to remove on release. */
    id: string;
}

export function installHub(api: DockviewApi): Hub {
    const counters: HubCounters = {
        dragsStarted: 0,
        dragOversAccepted: 0,
        dropsClaimed: 0,
        dropsRefused: 0,
        releases: 0,
        tearOffs: 0,
    };
    const listeners = new Set<(line: string) => void>();
    const log = (line: string) => {
        for (const listener of listeners) {
            listener(line);
        }
    };
    const local = new Map<string, LocalSession>();
    const teardown: (() => void)[] = [];
    let label = 'browser';

    const hub: Hub = {
        get label() {
            return label;
        },
        counters,
        tearOff: false,
        onLog(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        dispose() {
            for (const fn of teardown.splice(0)) {
                fn();
            }
        },
    };

    /**
     * Announce a drag: put the session id on the drag, hand the shell the
     * serialized group, and remember what to remove if another window takes
     * it. The drag's own end reports back whether anything claimed it.
     */
    const announce = (
        nativeEvent: DragEvent | PointerEvent,
        kind: DragKind,
        id: string,
        envelope: SerializedDockviewGroup
    ) => {
        if (!(nativeEvent instanceof DragEvent) || !nativeEvent.dataTransfer) {
            // A pointer-backend drag cannot leave the window.
            return;
        }

        const session = randomId();
        nativeEvent.dataTransfer.setData(HUB_DRAG_TYPE, session);
        local.set(session, { kind, id });
        counters.dragsStarted += 1;

        void dragStart(session, label, kind, envelope).then(
            () => log(`drag ${session.slice(0, 8)} announced (${kind} ${id})`),
            (err: unknown) => log(`drag_start failed — ${String(err)}`)
        );

        const source = nativeEvent.target;
        if (source instanceof HTMLElement) {
            source.addEventListener(
                'dragend',
                (end) => {
                    const dropped = end.dataTransfer?.dropEffect ?? 'none';
                    // A session another window claimed has already been
                    // released from `local`; what is left is unclaimed.
                    const tearOff = hub.tearOff && dropped === 'none';
                    void dragEnd(session, tearOff).then(
                        (opened) => {
                            if (opened) {
                                counters.tearOffs += 1;
                                log(
                                    `drag ${session.slice(0, 8)} torn off into ${opened}`
                                );
                            } else if (local.has(session)) {
                                local.delete(session);
                                log(
                                    `drag ${session.slice(0, 8)} ended here (${dropped})`
                                );
                            }
                        },
                        (err: unknown) =>
                            log(`drag_end failed — ${String(err)}`)
                    );
                },
                { once: true }
            );
        }
    };

    teardown.push(
        api.onWillDragPanel((event) => {
            announce(
                event.nativeEvent,
                'panel',
                event.panel.id,
                serializePanelAsGroup(event.panel)
            );
        }).dispose,
        api.onWillDragGroup((event) => {
            announce(
                event.nativeEvent,
                'group',
                event.group.id,
                api.serializeGroup(event.group)
            );
        }).dispose,
        // dockview treats a drag it did not start as external and asks; a
        // hub drag is accepted so the normal drop overlay and compass show.
        api.onUnhandledDragOver((event) => {
            if (isHubDrag(event.nativeEvent)) {
                counters.dragOversAccepted += 1;
                event.accept();
            }
        }).dispose,
        api.onDidDrop((event) => {
            const session = readSession(event.nativeEvent);
            if (!session) {
                return;
            }
            if (local.has(session)) {
                // Our own drag, landing on a target dockview left to us;
                // nothing to move between windows.
                return;
            }
            void receive(session, event);
        }).dispose
    );

    /**
     * Rebuild the group where the drop landed. The envelope is read before
     * the claim so a group this window cannot take, because it already
     * holds a panel of the same id, is refused without the source letting
     * go of it; only then is the drag claimed, which releases the source.
     */
    const receive = async (session: string, event: DockviewDidDropEvent) => {
        let envelope: SerializedDockviewGroup;
        try {
            envelope = (await peekDrag(session)) as SerializedDockviewGroup;
            const held = envelope.group.views.filter((id) => api.getPanel(id));
            if (held.length > 0) {
                throw new Error(`this window already holds ${held.join(', ')}`);
            }
            await claimDrop(session, label);
        } catch (err: unknown) {
            counters.dropsRefused += 1;
            log(`drop ${session.slice(0, 8)} refused — ${String(err)}`);
            return;
        }

        try {
            place(api, envelope, event);
            counters.dropsClaimed += 1;
            log(
                `drop ${session.slice(0, 8)} placed ${envelope.group.views.length} panel(s) ${describePlacement(event)}`
            );
        } catch (err: unknown) {
            counters.dropsRefused += 1;
            log(
                `drop ${session.slice(0, 8)} could not be placed — ${String(err)}`
            );
        }
    };

    void windowLabel().then((value) => {
        label = value;
        log(`hub ready in window ${label}`);
    });

    void onRelease((notice) => {
        const session = local.get(notice.session);
        local.delete(notice.session);
        if (!session) {
            return;
        }
        counters.releases += 1;
        release(api, session);
        log(`released ${session.kind} ${session.id} to ${notice.to}`);
    }).then((unlisten) => teardown.push(unlisten));

    // A window a tear-off created starts with the group that was dragged.
    if (isTauri()) {
        void windowLabel()
            .then((value) => takePendingGroup(value))
            .then((pending) => {
                if (pending) {
                    const group = api.addGroupFromJSON(
                        pending as SerializedDockviewGroup
                    );
                    log(`started with torn-off group ${group.id}`);
                }
            })
            .catch((err: unknown) =>
                log(`take_pending_group failed — ${String(err)}`)
            );
    }

    return hub;
}

function isHubDrag(nativeEvent: DragEvent | PointerEvent): boolean {
    return (
        nativeEvent instanceof DragEvent &&
        (nativeEvent.dataTransfer?.types.includes(HUB_DRAG_TYPE) ?? false)
    );
}

function readSession(nativeEvent: DragEvent | PointerEvent): string | null {
    if (!(nativeEvent instanceof DragEvent)) {
        return null;
    }
    const session = nativeEvent.dataTransfer?.getData(HUB_DRAG_TYPE);
    return session ? session : null;
}

/** One tab as a one-panel group, the shape `addGroupFromJSON` takes. */
function serializePanelAsGroup(panel: IDockviewPanel): SerializedDockviewGroup {
    return {
        group: { id: randomId(), views: [panel.id], activeView: panel.id },
        panels: { [panel.id]: panel.toJSON() },
    };
}

/**
 * Where the drop landed decides how the group is rebuilt. An edge of a grid
 * group or of the layout becomes a new group there. The centre of a group,
 * its tab bar, or any edge of a floating or edge group (which has no grid
 * neighbours) merges the panels into that group, since a group cannot be
 * placed "within" another.
 */
function place(
    api: DockviewApi,
    envelope: SerializedDockviewGroup,
    event: DockviewDidDropEvent
): void {
    const target = event.group as DockviewGroupPanel | undefined;

    if (!target) {
        api.addGroupFromJSON(envelope, {
            direction: positionToDirection(event.position),
        });
        return;
    }

    if (event.position !== 'center' && target.api.location.type === 'grid') {
        api.addGroupFromJSON(envelope, {
            referenceGroup: target,
            direction: positionToDirection(event.position),
        });
        return;
    }

    // A tab-bar drop names the tab it landed on; insert before it.
    const at = event.panel ? target.panels.indexOf(event.panel) : -1;
    envelope.group.views.forEach((id, offset) => {
        const state = envelope.panels[id];
        api.addPanel({
            ...panelOptions(state),
            position: {
                referenceGroup: target,
                ...(at >= 0 ? { index: at + offset } : {}),
            },
            inactive: id !== envelope.group.activeView,
        });
    });
}

type PanelBase = Pick<
    AddPanelOptions,
    | 'id'
    | 'component'
    | 'tabComponent'
    | 'title'
    | 'params'
    | 'renderer'
    | 'minimumWidth'
    | 'minimumHeight'
    | 'maximumWidth'
    | 'maximumHeight'
>;

function panelOptions(state: GroupviewPanelState): PanelBase {
    return {
        id: state.id,
        component: state.contentComponent ?? 'unknown',
        tabComponent: state.tabComponent,
        title: state.title,
        params: state.params,
        renderer: state.renderer,
        minimumWidth: state.minimumWidth,
        minimumHeight: state.minimumHeight,
        maximumWidth: state.maximumWidth,
        maximumHeight: state.maximumHeight,
    };
}

/** The source window's half of a completed move. */
function release(api: DockviewApi, session: LocalSession): void {
    if (session.kind === 'panel') {
        const panel = api.getPanel(session.id);
        if (panel) {
            api.removePanel(panel);
        }
        return;
    }
    const group = api.getGroup(session.id);
    if (group) {
        api.removeGroup(group);
    }
}

function describePlacement(event: DockviewDidDropEvent): string {
    if (!event.group) {
        return `at the layout's ${event.position} edge`;
    }
    if (event.position === 'center') {
        return event.panel
            ? `into group ${event.group.id} before ${event.panel.id}`
            : `into group ${event.group.id}`;
    }
    return `${event.position} of group ${event.group.id}`;
}
