/**
 * Cross-window drag and drop as an interceptor over dockview's public drag
 * hooks. Install it once per instance and ordinary tab and group drags keep
 * working as before; the only addition is that a drag can now land in
 * another window's dockview.
 *
 * Every native window runs its own dockview in its own JavaScript context,
 * so nothing can move between them as DOM. What can cross is an OS drag
 * session, and only an HTML5 drag rides one. The drag's `DataTransfer`
 * carries a session id and nothing else; the orchestrator outside every
 * window holds what the drag carries; the window the drop lands in rebuilds
 * it with `addPanelFromJSON` or `addGroupFromJSON`, and the source is told
 * to remove its copy. No window owns another.
 *
 * Nothing here knows how to reach the orchestrator. That is the
 * {@link MultiWindowTransport} the host supplies.
 */

import {
    type Direction,
    type DockviewApi,
    type DockviewDidDropEvent,
    type DockviewEvent,
    type DockviewGroupPanel,
    type DockviewIDisposable,
    positionToDirection,
} from 'dockview';
import {
    type DragPayload,
    type MoveEvent,
    type MultiWindowTransport,
    payloadPanels,
} from './types';

/**
 * The drag type that marks a dockview drag as one the orchestrator brokers.
 * During `dragover` a browser exposes a drag's types but not its data, so
 * this is what the destination accepts on; the session id is read at the
 * drop.
 */
export const MULTI_WINDOW_DRAG_TYPE = 'application/x-dockview-multi-window';

/**
 * How long after its drag ended a source keeps the record it needs to act
 * on a release. Longer than an orchestrator's own grace period should be,
 * so a late accept is still honoured here.
 */
const LOCAL_SESSION_TTL_MS = 3000;

export type DragKind = DragPayload['kind'];

export interface CrossWindowDndCounters {
    dragsStarted: number;
    dragOversAccepted: number;
    dropsAccepted: number;
    dropsRefused: number;
    releases: number;
}

export interface CrossWindowDndOptions {
    /**
     * Turn an unaccepted drag into a new window, where the orchestrator
     * supports it. Off by default: an HTML5 drag cannot tell a drop on the
     * desktop from a cancelled drag.
     */
    detach?: boolean;
    /** Makes the session id a drag carries. Random by default. */
    sessionId?: () => string;
    onLog?(line: string): void;
}

export interface CrossWindowDnd {
    /** This window's windowId once the transport has answered; `''` before. */
    readonly windowId: string;
    readonly counters: Readonly<CrossWindowDndCounters>;
    /** Panels moved between any two windows: by a drop, or by undo or redo. */
    onDidMoveAcrossWindows: DockviewEvent<MoveEvent>;
    detach: boolean;
    dispose(): void;
}

/** What the source window remembers about a drag, to act on its release. */
interface LocalSession {
    kind: DragKind;
    /** The panel id (`panel`) or group id (`group`) to remove on release. */
    id: string;
}

/**
 * A random id for drag sessions. `randomUUID` is only defined in a secure
 * context, which a custom-scheme origin such as `tauri://localhost` need not
 * be, so fall back to raw random bytes.
 */
export function randomSessionId(): string {
    const crypto = globalThis.crypto;
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
        byte.toString(16).padStart(2, '0')
    ).join('');
}

export function installCrossWindowDnd(
    api: DockviewApi,
    transport: MultiWindowTransport,
    options: CrossWindowDndOptions = {}
): CrossWindowDnd {
    const counters: CrossWindowDndCounters = {
        dragsStarted: 0,
        dragOversAccepted: 0,
        dropsAccepted: 0,
        dropsRefused: 0,
        releases: 0,
    };
    const log = options.onLog ?? (() => undefined);
    const sessionId = options.sessionId ?? randomSessionId;
    const moveListeners = new Set<(event: MoveEvent) => void>();
    const local = new Map<string, LocalSession>();
    const teardown: (() => void)[] = [];
    let windowId = '';
    let disposed = false;

    /** Keep a transport subscription until dispose, even one that answers after it. */
    const subscribe = (subscription: Promise<DockviewIDisposable>) => {
        void subscription.then(
            (subscription) => {
                if (disposed) {
                    subscription.dispose();
                } else {
                    teardown.push(() => subscription.dispose());
                }
            },
            (err: unknown) => log(`subscription failed: ${String(err)}`)
        );
    };

    const dnd: CrossWindowDnd = {
        get windowId() {
            return windowId;
        },
        counters,
        detach: options.detach ?? false,
        onDidMoveAcrossWindows(listener) {
            moveListeners.add(listener);
            return {
                dispose: () => {
                    moveListeners.delete(listener);
                },
            };
        },
        dispose() {
            disposed = true;
            for (const fn of teardown.splice(0)) {
                fn();
            }
        },
    };

    const ready = transport.windowId().then((value) => {
        windowId = value;
        log(`cross-window drag ready in window ${windowId}`);
    });

    /**
     * Announce a drag: put the session id on the drag, hand the orchestrator
     * the payload, and remember what to remove if another window takes it.
     * The drag's own end reports back whether anything accepted it.
     */
    const announce = (
        nativeEvent: DragEvent | PointerEvent,
        id: string,
        payload: DragPayload
    ) => {
        if (!hasDataTransfer(nativeEvent) || !nativeEvent.dataTransfer) {
            // A pointer-backend drag cannot leave the window.
            return;
        }

        const session = sessionId();
        nativeEvent.dataTransfer.setData(MULTI_WINDOW_DRAG_TYPE, session);
        local.set(session, { kind: payload.kind, id });
        counters.dragsStarted += 1;

        // The session id has to be on the drag now, inside `dragstart`; the
        // announcement can wait for this window's windowId.
        void ready
            .then(() => transport.startDrag(session, windowId, payload))
            .then(
                () =>
                    log(
                        `drag ${short(session)} announced (${payload.kind} ${id})`
                    ),
                (err: unknown) => log(`startDrag failed: ${String(err)}`)
            );

        const source = nativeEvent.target;
        if (source instanceof HTMLElement) {
            source.addEventListener(
                'dragend',
                (end) => {
                    const dropped = end.dataTransfer?.dropEffect ?? 'none';
                    const detach = dnd.detach && dropped === 'none';
                    void transport
                        .endDrag(session, detach)
                        .catch((err: unknown) =>
                            log(`endDrag failed: ${String(err)}`)
                        );
                    // The orchestrator keeps the drag acceptable for a while
                    // after this, so only conclude it stayed here once a
                    // accept would have shown up as a release.
                    setTimeout(() => {
                        if (local.delete(session)) {
                            log(
                                `drag ${short(session)} stayed here (${dropped})`
                            );
                        }
                    }, LOCAL_SESSION_TTL_MS);
                },
                { once: true }
            );
        }
    };

    teardown.push(
        api.onWillDragPanel((event) => {
            announce(event.nativeEvent, event.panel.id, {
                kind: 'panel',
                panel: event.panel.toJSON(),
            });
        }).dispose,
        api.onWillDragGroup((event) => {
            announce(event.nativeEvent, event.group.id, {
                kind: 'group',
                group: api.serializeGroup(event.group),
            });
        }).dispose,
        // dockview treats a drag it did not start as external and asks; a
        // brokered drag is accepted so the normal drop overlay shows.
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
     * Rebuild the payload where the drop landed. It is read before the
     * accept so one this window cannot take, because it already holds a
     * panel of the same id, is refused without the source letting go of it;
     * only then is the drag accepted, which releases the source.
     */
    const receive = async (session: string, event: DockviewDidDropEvent) => {
        let payload: DragPayload;
        try {
            await ready;
            payload = await transport.peekDrag(session);
            const held = payloadPanels(payload).filter((id) =>
                api.getPanel(id)
            );
            if (held.length > 0) {
                throw new Error(`this window already holds ${held.join(', ')}`);
            }
            await transport.acceptDrag(session, windowId);
        } catch (err: unknown) {
            counters.dropsRefused += 1;
            log(`drop ${short(session)} refused: ${String(err)}`);
            return;
        }

        // The source has let go by now. Whatever happens here, this half of
        // the move is recorded, so a shared undo can restore the source's
        // layout even when the panels could not be placed.
        const before = api.toJSON();
        try {
            place(api, payload, event);
            counters.dropsAccepted += 1;
            log(
                `drop ${short(session)} placed ${payloadPanels(payload).length} panel(s) ${describePlacement(event)}`
            );
        } catch (err: unknown) {
            counters.dropsRefused += 1;
            log(
                `drop ${short(session)} could not be placed: ${String(err)}; undo restores it to the source`
            );
        }
        void transport
            .reportMove(
                session,
                windowId,
                'to',
                payloadPanels(payload),
                before,
                api.toJSON()
            )
            .catch((err: unknown) => log(`reportMove failed: ${String(err)}`));
    };

    subscribe(
        transport.onDidRelease((notice) => {
            const session = local.get(notice.session);
            local.delete(notice.session);
            if (!session) {
                return;
            }
            counters.releases += 1;
            const before = api.toJSON();
            const panels = releasedPanels(api, session);
            release(api, session);
            log(`released ${session.kind} ${session.id} to ${notice.to}`);
            if (notice.reason === 'detach') {
                // The new window is the host's to create; a detach is not
                // a move the shared history can undo.
                return;
            }
            void transport
                .reportMove(
                    notice.session,
                    windowId,
                    'from',
                    panels,
                    before,
                    api.toJSON()
                )
                .catch((err: unknown) =>
                    log(`reportMove failed: ${String(err)}`)
                );
        })
    );

    subscribe(
        transport.onDidMove((notice) => {
            for (const listener of moveListeners) {
                listener(notice);
            }
        })
    );

    // A window a detach created starts with what was dragged.
    void ready
        .then(() => transport.takeDetachedDrag(windowId))
        .then((pending) => {
            if (pending) {
                place(api, pending);
                log(`started with detached ${pending.kind}`);
            }
        })
        .catch((err: unknown) =>
            log(`takeDetachedDrag failed: ${String(err)}`)
        );

    return dnd;
}

function short(session: string): string {
    return session.slice(0, 8);
}

/**
 * Narrow a drag-related native event to one with a `dataTransfer`. A
 * property check rather than `instanceof DragEvent`, which some
 * environments (jsdom among them) do not define.
 */
function hasDataTransfer(
    nativeEvent: DragEvent | PointerEvent
): nativeEvent is DragEvent {
    return 'dataTransfer' in nativeEvent;
}

function isHubDrag(nativeEvent: DragEvent | PointerEvent): boolean {
    return (
        hasDataTransfer(nativeEvent) &&
        (nativeEvent.dataTransfer?.types.includes(MULTI_WINDOW_DRAG_TYPE) ??
            false)
    );
}

function readSession(nativeEvent: DragEvent | PointerEvent): string | null {
    if (!hasDataTransfer(nativeEvent)) {
        return null;
    }
    const session = nativeEvent.dataTransfer?.getData(MULTI_WINDOW_DRAG_TYPE);
    return session || null;
}

/**
 * Where the drop landed decides how the payload is rebuilt. An edge of a
 * grid group or of the layout becomes a new group there. The centre of a
 * group, its tab bar, or any edge of a floating or edge group (which has no
 * grid neighbours) merges into that group, at the tab index the drop
 * reports for a tab-bar landing. Without a drop event (a detach) the
 * payload is appended to the layout.
 */
function place(
    api: DockviewApi,
    payload: DragPayload,
    event?: DockviewDidDropEvent
): void {
    const target = event?.group as DockviewGroupPanel | undefined;

    if (!event) {
        if (payload.kind === 'panel') {
            api.addPanelFromJSON(payload.panel);
        } else {
            api.addGroupFromJSON(payload.group);
        }
        return;
    }

    if (!target) {
        const direction = positionToDirection(event.position) as Exclude<
            Direction,
            'within'
        >;
        if (payload.kind === 'panel') {
            api.addPanelFromJSON(payload.panel, { position: { direction } });
        } else {
            api.addGroupFromJSON(payload.group, { direction });
        }
        return;
    }

    if (event.position !== 'center' && target.api.location.type === 'grid') {
        const direction = positionToDirection(event.position);
        if (payload.kind === 'panel') {
            api.addPanelFromJSON(payload.panel, {
                position: { referenceGroup: target, direction },
            });
        } else {
            api.addGroupFromJSON(payload.group, {
                referenceGroup: target,
                direction,
            });
        }
        return;
    }

    if (payload.kind === 'panel') {
        api.addPanelFromJSON(payload.panel, {
            position: { referenceGroup: target, index: event.index },
        });
    } else {
        api.addGroupFromJSON(payload.group, {
            referenceGroup: target,
            direction: 'within',
            index: event.index,
        });
    }
}

/** The panel ids a release will take out of this window. */
function releasedPanels(api: DockviewApi, session: LocalSession): string[] {
    if (session.kind === 'panel') {
        return [session.id];
    }
    return api.getGroup(session.id)?.panels.map((panel) => panel.id) ?? [];
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
        return event.index === undefined
            ? `into group ${event.group.id}`
            : `into group ${event.group.id} at tab ${event.index}`;
    }
    return `${event.position} of group ${event.group.id}`;
}
