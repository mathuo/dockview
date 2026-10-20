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
    type DockviewGroupPanel,
    positionToDirection,
} from 'dockview';
import {
    type DragPayload,
    type MovedNotice,
    type MultiWindowTransport,
    payloadPanels,
} from './types';

/**
 * The drag type that marks a dockview drag as one the orchestrator brokers.
 * During `dragover` a browser exposes a drag's types but not its data, so
 * this is what the destination accepts on; the session id is read at the
 * drop.
 */
export const HUB_DRAG_TYPE = 'application/x-dockview-hub';

/**
 * How long after its drag ended a source keeps the record it needs to act
 * on a release. Longer than an orchestrator's own grace period should be,
 * so a late claim is still honoured here.
 */
const LOCAL_SESSION_TTL_MS = 3000;

export type DragKind = DragPayload['kind'];

export interface CrossWindowDndCounters {
    dragsStarted: number;
    dragOversAccepted: number;
    dropsClaimed: number;
    dropsRefused: number;
    releases: number;
}

export interface CrossWindowDndOptions {
    /**
     * Turn an unclaimed drag into a new window, where the orchestrator
     * supports it. Off by default: an HTML5 drag cannot tell a drop on the
     * desktop from a cancelled drag.
     */
    tearOff?: boolean;
    /** Makes the session id a drag carries. Random by default. */
    sessionId?: () => string;
    onLog?(line: string): void;
}

export interface CrossWindowDnd {
    /** This window's label once the transport has answered; `''` before. */
    readonly label: string;
    readonly counters: Readonly<CrossWindowDndCounters>;
    /** Panels moved between any two windows: by a drop, or by undo or redo. */
    onDidMoveAcrossWindows(listener: (notice: MovedNotice) => void): () => void;
    tearOff: boolean;
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
        dropsClaimed: 0,
        dropsRefused: 0,
        releases: 0,
    };
    const log = options.onLog ?? (() => undefined);
    const sessionId = options.sessionId ?? randomSessionId;
    const moveListeners = new Set<(notice: MovedNotice) => void>();
    const local = new Map<string, LocalSession>();
    const teardown: (() => void)[] = [];
    let label = '';
    let disposed = false;

    /** Keep a transport subscription until dispose, even one that answers after it. */
    const subscribe = (subscription: Promise<() => void>) => {
        void subscription.then(
            (unlisten) => {
                if (disposed) {
                    unlisten();
                } else {
                    teardown.push(unlisten);
                }
            },
            (err: unknown) => log(`subscription failed: ${String(err)}`)
        );
    };

    const hub: CrossWindowDnd = {
        get label() {
            return label;
        },
        counters,
        tearOff: options.tearOff ?? false,
        onDidMoveAcrossWindows(listener) {
            moveListeners.add(listener);
            return () => moveListeners.delete(listener);
        },
        dispose() {
            disposed = true;
            for (const fn of teardown.splice(0)) {
                fn();
            }
        },
    };

    const ready = transport.label().then((value) => {
        label = value;
        log(`cross-window drag ready in window ${label}`);
    });

    /**
     * Announce a drag: put the session id on the drag, hand the orchestrator
     * the payload, and remember what to remove if another window takes it.
     * The drag's own end reports back whether anything claimed it.
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
        nativeEvent.dataTransfer.setData(HUB_DRAG_TYPE, session);
        local.set(session, { kind: payload.kind, id });
        counters.dragsStarted += 1;

        // The session id has to be on the drag now, inside `dragstart`; the
        // announcement can wait for this window's label.
        void ready
            .then(() => transport.dragStart(session, label, payload))
            .then(
                () =>
                    log(
                        `drag ${short(session)} announced (${payload.kind} ${id})`
                    ),
                (err: unknown) => log(`dragStart failed: ${String(err)}`)
            );

        const source = nativeEvent.target;
        if (source instanceof HTMLElement) {
            source.addEventListener(
                'dragend',
                (end) => {
                    const dropped = end.dataTransfer?.dropEffect ?? 'none';
                    const tearOff = hub.tearOff && dropped === 'none';
                    void transport
                        .dragEnd(session, tearOff)
                        .catch((err: unknown) =>
                            log(`dragEnd failed: ${String(err)}`)
                        );
                    // The orchestrator keeps the drag claimable for a while
                    // after this, so only conclude it stayed here once a
                    // claim would have shown up as a release.
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
     * claim so one this window cannot take, because it already holds a
     * panel of the same id, is refused without the source letting go of it;
     * only then is the drag claimed, which releases the source.
     */
    const receive = async (session: string, event: DockviewDidDropEvent) => {
        let payload: DragPayload;
        try {
            await ready;
            payload = await transport.peek(session);
            const held = payloadPanels(payload).filter((id) =>
                api.getPanel(id)
            );
            if (held.length > 0) {
                throw new Error(`this window already holds ${held.join(', ')}`);
            }
            await transport.claim(session, label);
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
            counters.dropsClaimed += 1;
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
            .moveRecorded(
                session,
                label,
                'to',
                payloadPanels(payload),
                before,
                api.toJSON()
            )
            .catch((err: unknown) =>
                log(`moveRecorded failed: ${String(err)}`)
            );
    };

    subscribe(
        transport.onRelease((notice) => {
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
            if (notice.reason === 'tear-off') {
                // The new window is the host's to create; a tear-off is not
                // a move the shared history can undo.
                return;
            }
            void transport
                .moveRecorded(
                    notice.session,
                    label,
                    'from',
                    panels,
                    before,
                    api.toJSON()
                )
                .catch((err: unknown) =>
                    log(`moveRecorded failed: ${String(err)}`)
                );
        })
    );

    subscribe(
        transport.onMoved((notice) => {
            for (const listener of moveListeners) {
                listener(notice);
            }
        })
    );

    // A window a tear-off created starts with what was dragged.
    void ready
        .then(() => transport.takePending(label))
        .then((pending) => {
            if (pending) {
                place(api, pending);
                log(`started with torn-off ${pending.kind}`);
            }
        })
        .catch((err: unknown) => log(`takePending failed: ${String(err)}`));

    return hub;
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
        (nativeEvent.dataTransfer?.types.includes(HUB_DRAG_TYPE) ?? false)
    );
}

function readSession(nativeEvent: DragEvent | PointerEvent): string | null {
    if (!hasDataTransfer(nativeEvent)) {
        return null;
    }
    const session = nativeEvent.dataTransfer?.getData(HUB_DRAG_TYPE);
    return session || null;
}

/**
 * Where the drop landed decides how the payload is rebuilt. An edge of a
 * grid group or of the layout becomes a new group there. The centre of a
 * group, its tab bar, or any edge of a floating or edge group (which has no
 * grid neighbours) merges into that group, at the tab index the drop
 * reports for a tab-bar landing. Without a drop event (a tear-off) the
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
