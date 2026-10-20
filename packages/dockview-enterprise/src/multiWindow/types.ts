/**
 * The contract between a window's dockview and the orchestrator that sits
 * outside every window: a handful of asynchronous calls, since the
 * orchestrator is in another process (a Tauri or Electron shell), another
 * page (a `BroadcastChannel`), or, for tests and single-page layouts, the
 * in-memory one this package ships.
 *
 * Every call is asynchronous, and nothing an interceptor does relies on a
 * result arriving inside the DOM event that triggered the call.
 */

import type {
    GroupviewPanelState,
    SerializedDockview,
    SerializedDockviewGroup,
} from 'dockview';

/**
 * What a drag carries: one tab as its `toJSON()` state, or one group as
 * `serializeGroup` output. The orchestrator stores it without reading it,
 * save for the panel ids ({@link payloadPanels}).
 */
export type DragPayload =
    | { kind: 'panel'; panel: GroupviewPanelState }
    | { kind: 'group'; group: SerializedDockviewGroup };

/** The panel ids a payload moves. */
export function payloadPanels(payload: DragPayload): string[] {
    return payload.kind === 'panel'
        ? [payload.panel.id]
        : payload.group.group.views;
}

export type Unsubscribe = () => void;

/** Delivered to the source window once another window took its drag. */
export interface ReleaseNotice {
    session: string;
    /** The window label that took the payload. */
    to: string;
    /**
     * A claim by a window the drop landed in, or a tear-off into a window
     * the orchestrator opened for an unclaimed drag. Only a claim is a move
     * the shared history records: the torn-off window is the host's to
     * create, and its creation is not undone.
     */
    reason: 'claim' | 'tear-off';
}

/** Broadcast after panels moved between any two windows. */
export interface MovedNotice {
    session: string;
    panels: string[];
    from: string;
    to: string;
    /** A drop, a tear-off into a new window, or the undo or redo of a drop. */
    reason: 'drop' | 'tear-off' | 'undo' | 'redo';
}

/** Which half of a move a window reports. */
export type MoveRole = 'from' | 'to';

export interface HistoryInfo {
    undoCount: number;
    redoCount: number;
    /** A description of the step `undo` would take, or null. */
    nextUndo: string | null;
    nextRedo: string | null;
}

/**
 * How a window reaches the orchestrator. One object, in three parts: the
 * drag hub, the workspace, and the shared history.
 */
export interface MultiWindowTransport {
    /** This window's identity, as the orchestrator and other windows name it. */
    label(): Promise<string>;

    // Drags.

    /** Announce a drag, handing the orchestrator what it carries. */
    dragStart(
        session: string,
        from: string,
        payload: DragPayload
    ): Promise<void>;
    /** Read a drag's payload without claiming it. Rejects if not in flight. */
    peek(session: string): Promise<DragPayload>;
    /** Claim a drop. Rejects if another window claimed it first. */
    claim(session: string, to: string): Promise<void>;
    /**
     * Report a drag over. The orchestrator keeps it claimable for a grace
     * period, since the destination's claim may arrive after this. With
     * `tearOff`, an unclaimed drag may then become a new window holding the
     * payload, which the source learns of through `onRelease`.
     */
    dragEnd(session: string, tearOff: boolean): Promise<void>;
    /** Delivered to the source window once another window took its drag. */
    onRelease(handler: (notice: ReleaseNotice) => void): Promise<Unsubscribe>;
    /** A window created by a tear-off collects the payload waiting for it. */
    takePending(label: string): Promise<DragPayload | null>;
    /**
     * This window's half of a completed move, for the shared undo history:
     * its layout just before and just after it gave up, or took, the panels.
     */
    moveRecorded(
        session: string,
        label: string,
        role: MoveRole,
        panels: string[],
        before: SerializedDockview,
        after: SerializedDockview
    ): Promise<void>;
    /** Broadcast after panels moved between any two windows. */
    onMoved(handler: (notice: MovedNotice) => void): Promise<Unsubscribe>;

    // The workspace.

    /** The layout to start with, or null to build the window's defaults. */
    initialLayout(label: string): Promise<SerializedDockview | null>;
    /** Report the layout. Rejects if it names a panel another window holds. */
    layoutChanged(label: string, layout: SerializedDockview): Promise<void>;

    // The shared history.

    /** This window recorded a step of its own. */
    historyPush(label: string): Promise<void>;
    /** Undo, or redo, the most recent step anywhere. */
    undo(): Promise<void>;
    redo(): Promise<void>;
    historyInfo(): Promise<HistoryInfo | null>;
    /** The orchestrator replaces this window's layout. */
    onApplyLayout(
        handler: (layout: SerializedDockview) => void
    ): Promise<Unsubscribe>;
    /** The orchestrator asks this window to undo, or redo, its own top step. */
    onUndoRequest(handler: () => void): Promise<Unsubscribe>;
    onRedoRequest(handler: () => void): Promise<Unsubscribe>;
    onHistoryChanged(
        handler: (info: HistoryInfo) => void
    ): Promise<Unsubscribe>;
}
