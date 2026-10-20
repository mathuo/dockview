/**
 * The contract between a window's dockview and the orchestrator that sits
 * outside every window: a handful of asynchronous calls, since the
 * orchestrator is in another process (a Tauri or Electron shell), another
 * page (a `BroadcastChannel`), or, for tests and single-page layouts, the
 * in-memory one this package ships.
 *
 * A transport belongs to one window, so no call names the window it comes
 * from: the orchestrator knows that from the transport it handed out, or,
 * in a shell, from the window the call arrived on.
 */

import type {
    DockviewCompositeDisposable,
    DockviewIDisposable,
    GroupviewPanelState,
    SerializedDockview,
    SerializedDockviewGroup,
} from 'dockview';

/**
 * How long an orchestrator keeps a drag acceptable after its source
 * reported it over. The source's `dragend` fires the instant the drop lands
 * in another window, and that window's accept routinely arrives later. An
 * orchestrator may choose its own period, but the windows assume it is no
 * longer than this.
 */
export const DRAG_END_GRACE_MS = 1500;

/**
 * What a drag carries: one tab as its `toJSON()` state, or one group as
 * `serializeGroup` output. The orchestrator stores it without reading it,
 * save for the panel ids, which are `panel.id` or `group.group.views`.
 */
export type DragPayload =
    | { kind: 'panel'; panel: GroupviewPanelState }
    | { kind: 'group'; group: SerializedDockviewGroup };

/** Delivered to the source window once another window took its drag. */
export interface ReleaseEvent {
    readonly session: string;
    /** The window that took the payload. */
    readonly to: string;
    /**
     * An accept by a window the drop landed in, or a detach into a window
     * the orchestrator opened for an unaccepted drag. Only an accept is a
     * move the shared history records: the detached window is the host's to
     * create, and its creation is not undone.
     */
    readonly reason: 'drop' | 'detach';
}

/** Broadcast after panels moved between any two windows. */
export interface MoveEvent {
    readonly session: string;
    readonly panels: string[];
    readonly from: string;
    readonly to: string;
    /** A drop, a detach into a new window, or the undo or redo of a drop. */
    readonly reason: 'drop' | 'detach' | 'undo' | 'redo';
}

/** Which half of a move a window reports. */
export type MoveRole = 'from' | 'to';

/** The step an undo or redo would take next. */
export type HistoryStepInfo =
    | { readonly type: 'local'; readonly windowId: string }
    | {
          readonly type: 'move';
          readonly panels: string[];
          /** Unset until that window has reported its half of the move. */
          readonly from?: string;
          readonly to?: string;
      };

/** The shared history's state, shaped like dockview's own `LayoutHistoryChangeEvent`. */
export interface HistoryInfo {
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly undoCount: number;
    readonly redoCount: number;
    readonly nextUndo?: HistoryStepInfo;
    readonly nextRedo?: HistoryStepInfo;
}

/** What the orchestrator asks of one window to carry out an undo or redo. */
export type HistoryRequest =
    /** Undo, or redo, this window's own top step. */
    | { readonly type: 'undo' }
    | { readonly type: 'redo' }
    /** Replace this window's layout: one side of a move being undone or redone. */
    | { readonly type: 'apply-layout'; readonly layout: SerializedDockview };

/**
 * How a window reaches the orchestrator. One object, in three parts: the
 * drags, the workspace, and the shared history. Subscriptions resolve to a
 * disposable, since most message buses register a listener asynchronously.
 */
export interface MultiWindowTransport {
    /** This window's id, as the orchestrator and other windows name it. */
    readonly windowId: string;

    // Drags.

    /** Announce a drag, handing the orchestrator what it carries. */
    startDrag(session: string, payload: DragPayload): Promise<void>;
    /** Read a drag's payload without accepting it. Rejects if not in flight. */
    peekDrag(session: string): Promise<DragPayload>;
    /** Accept a drop. Rejects if another window accepted it first. */
    acceptDrag(session: string): Promise<void>;
    /**
     * Report a drag over. The orchestrator keeps it acceptable for a grace
     * period ({@link DRAG_END_GRACE_MS}), since the destination's accept may
     * arrive after this. With `detach`, an unaccepted drag may then become a
     * new window holding the payload, which the source learns of through
     * `onDidRelease`.
     */
    endDrag(session: string, detach: boolean): Promise<void>;
    onDidRelease(
        listener: (event: ReleaseEvent) => void
    ): Promise<DockviewIDisposable>;
    /** A window created by a detach collects the payload waiting for it. */
    takeDetachedDrag(): Promise<DragPayload | null>;
    /**
     * This window's half of a completed move, for the shared undo history:
     * its layout just before and just after it gave up, or took, the panels.
     */
    reportMove(
        session: string,
        role: MoveRole,
        panels: string[],
        before: SerializedDockview,
        after: SerializedDockview
    ): Promise<void>;
    onDidMove(
        listener: (event: MoveEvent) => void
    ): Promise<DockviewIDisposable>;

    // The workspace.

    /** The layout to start with, or null to build the window's defaults. */
    loadLayout(): Promise<SerializedDockview | null>;
    /** Report the layout. Rejects if it names a panel another window holds. */
    reportLayout(layout: SerializedDockview): Promise<void>;

    // The shared history.

    /** This window recorded a step of its own. */
    reportLocalStep(): Promise<void>;
    /** Undo, or redo, the most recent step in any window. */
    undo(): Promise<void>;
    redo(): Promise<void>;
    getHistory(): Promise<HistoryInfo>;
    onDidRequestHistory(
        listener: (request: HistoryRequest) => void
    ): Promise<DockviewIDisposable>;
    onDidChangeHistory(
        listener: (info: HistoryInfo) => void
    ): Promise<DockviewIDisposable>;
}

/** The panel ids a payload moves. */
export function payloadPanels(payload: DragPayload): string[] {
    return payload.kind === 'panel'
        ? [payload.panel.id]
        : payload.group.group.views;
}

/**
 * Keep a transport subscription for as long as `owner` lives, including one
 * that resolves after `owner` was disposed, which is dropped at once.
 */
export function retainSubscription(
    owner: DockviewCompositeDisposable,
    subscription: Promise<DockviewIDisposable>
): void {
    subscription.then(
        (disposable) => {
            if (owner.isDisposed) {
                disposable.dispose();
            } else {
                owner.addDisposables(disposable);
            }
        },
        (err: unknown) => {
            console.error('dockview: multi-window subscription failed.', err);
        }
    );
}
