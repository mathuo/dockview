/**
 * Cross-window drag and drop as an interceptor over dockview's public drag
 * hooks. Register it once per instance and ordinary tab and group drags
 * keep working as before; the only addition is that a drag can now land in
 * another window's dockview.
 *
 * Every native window runs its own dockview instance in its own JavaScript
 * context, so nothing can be moved between them as DOM. What can cross is an
 * OS drag session, and only an HTML5 drag rides one. The drag's
 * `DataTransfer` carries a session id and nothing else; a hub outside every
 * window holds the serialized group for that session; the window the drop
 * lands in rebuilds the group with `addGroupFromJSON`, and the source is
 * told to remove its copy. No window owns another.
 *
 * Nothing here knows how to reach the hub. That is the {@link DragTransport}
 * the host supplies: Tauri IPC in this demo, but an Electron main process
 * or a `BroadcastChannel` would fit the same seven calls.
 */

import {
    type DockviewApi,
    type DockviewDidDropEvent,
    type DockviewGroupPanel,
    type IDockviewPanel,
    type SerializedDockview,
    type SerializedDockviewGroup,
    positionToDirection,
} from 'dockview';

export type DragKind = 'panel' | 'group';

export interface ReleaseNotice {
    session: string;
    /** The window label that took the group. */
    to: string;
}

/**
 * How a window reaches the hub. Every call is asynchronous because the hub
 * is in another process; the interceptor never relies on a result arriving
 * inside the drag event that triggered the call.
 */
export interface DragTransport {
    /** This window's identity, as the hub and other windows name it. */
    label(): Promise<string>;
    /** Announce a drag, handing the hub the serialized group. */
    dragStart(
        session: string,
        from: string,
        kind: DragKind,
        envelope: SerializedDockviewGroup
    ): Promise<void>;
    /** Read a drag's group without claiming it. Rejects if not in flight. */
    peek(session: string): Promise<SerializedDockviewGroup>;
    /** Claim a drop. Rejects if another window claimed it first. */
    claim(session: string, to: string): Promise<void>;
    /**
     * Report a drag over. The hub keeps it claimable for a grace period,
     * since the destination's claim may arrive after this. With `tearOff`,
     * an unclaimed drag then becomes a new window holding the group, which
     * the source learns of through `onRelease`.
     */
    dragEnd(session: string, tearOff: boolean): Promise<void>;
    /** Delivered to the source window once another window took its group. */
    onRelease(handler: (notice: ReleaseNotice) => void): Promise<() => void>;
    /** A window created by a tear-off collects the group waiting for it. */
    takePending(label: string): Promise<SerializedDockviewGroup | null>;
    /**
     * This window's half of a completed move, for the shared undo history:
     * its layout just before and just after it gave up, or took, the group.
     */
    moveRecorded(
        session: string,
        label: string,
        role: 'from' | 'to',
        panels: string[],
        before: SerializedDockview,
        after: SerializedDockview
    ): Promise<void>;
    /** Broadcast after panels moved between any two windows. */
    onMoved(handler: (notice: MovedNotice) => void): Promise<() => void>;
}

export interface MovedNotice {
    session: string;
    panels: string[];
    from: string;
    to: string;
    /** A drop, or the undo or redo of one. */
    reason: 'drop' | 'undo' | 'redo';
}

/**
 * The drag type that marks a dockview drag as one the hub brokers. During
 * `dragover` a browser exposes a drag's types but not its data, so this is
 * what the destination accepts on; the session id is read at the drop.
 */
export const HUB_DRAG_TYPE = 'application/x-dockview-hub';

/**
 * How long after its drag ended a source keeps the record it needs to act on
 * a release. Longer than the hub's own grace period, so a late claim is
 * still honoured here.
 */
const LOCAL_SESSION_TTL_MS = 3000;

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

export interface CrossWindowDnd {
    /** This window's label; `browser` outside the shell. */
    readonly label: string;
    readonly counters: Readonly<HubCounters>;
    /** Panels moved between any two windows: by a drop, or by undo or redo. */
    onDidMoveAcrossWindows(listener: (notice: MovedNotice) => void): () => void;
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

export function installCrossWindowDnd(
    api: DockviewApi,
    transport: DragTransport
): CrossWindowDnd {
    const counters: HubCounters = {
        dragsStarted: 0,
        dragOversAccepted: 0,
        dropsClaimed: 0,
        dropsRefused: 0,
        releases: 0,
        tearOffs: 0,
    };
    const listeners = new Set<(line: string) => void>();
    const moveListeners = new Set<(notice: MovedNotice) => void>();
    const log = (line: string) => {
        for (const listener of listeners) {
            listener(line);
        }
    };
    const local = new Map<string, LocalSession>();
    const teardown: (() => void)[] = [];
    let label = 'browser';

    const hub: CrossWindowDnd = {
        get label() {
            return label;
        },
        counters,
        tearOff: false,
        onLog(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        onDidMoveAcrossWindows(listener) {
            moveListeners.add(listener);
            return () => moveListeners.delete(listener);
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

        void transport.dragStart(session, label, kind, envelope).then(
            () => log(`drag ${session.slice(0, 8)} announced (${kind} ${id})`),
            (err: unknown) => log(`drag_start failed — ${String(err)}`)
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
                            log(`dragEnd failed — ${String(err)}`)
                        );
                    // The hub keeps the drag claimable for a while after
                    // this, so only conclude it stayed here once a claim
                    // would have shown up as a release.
                    setTimeout(() => {
                        if (local.delete(session)) {
                            log(
                                `drag ${session.slice(0, 8)} stayed here (${dropped})`
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
            envelope = await transport.peek(session);
            const held = envelope.group.views.filter((id) => api.getPanel(id));
            if (held.length > 0) {
                throw new Error(`this window already holds ${held.join(', ')}`);
            }
            await transport.claim(session, label);
        } catch (err: unknown) {
            counters.dropsRefused += 1;
            log(`drop ${session.slice(0, 8)} refused — ${String(err)}`);
            return;
        }

        try {
            const before = api.toJSON();
            place(api, envelope, event);
            counters.dropsClaimed += 1;
            void transport
                .moveRecorded(
                    session,
                    label,
                    'to',
                    envelope.group.views,
                    before,
                    api.toJSON()
                )
                .catch((err: unknown) =>
                    log(`moveRecorded failed — ${String(err)}`)
                );
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

    void transport.label().then((value) => {
        label = value;
        log(`hub ready in window ${label}`);
    });

    void transport
        .onRelease((notice) => {
            const session = local.get(notice.session);
            local.delete(notice.session);
            if (!session) {
                return;
            }
            counters.releases += 1;
            if (notice.to.startsWith('dock-torn-')) {
                counters.tearOffs += 1;
            }
            const before = api.toJSON();
            const panels = releasedPanels(api, session);
            release(api, session);
            log(`released ${session.kind} ${session.id} to ${notice.to}`);
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
                    log(`moveRecorded failed — ${String(err)}`)
                );
        })
        .then((unlisten) => teardown.push(unlisten));

    void transport
        .onMoved((notice) => {
            for (const listener of moveListeners) {
                listener(notice);
            }
        })
        .then((unlisten) => teardown.push(unlisten));

    // A window a tear-off created starts with the group that was dragged.
    void transport
        .label()
        .then((value) => transport.takePending(value))
        .then((pending) => {
            if (pending) {
                const group = api.addGroupFromJSON(pending);
                log(`started with torn-off group ${group.id}`);
            }
        })
        .catch((err: unknown) => log(`takePending failed — ${String(err)}`));

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
 * neighbours) merges the panels into that group, at the tab index the drop
 * reports for a tab-bar landing.
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

    api.addGroupFromJSON(envelope, {
        referenceGroup: target,
        direction: 'within',
        index: event.index,
    });
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
