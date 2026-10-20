/**
 * The Tauri transport for the enterprise multi-window interceptors: the
 * shell is the orchestrator, reached through the commands in
 * `src-tauri/src/lib.rs`, and its notices arrive as Tauri events. Outside the
 * shell every call degrades to a no-op or a rejection, so the same build
 * runs in a browser.
 */

import {
    type CrossWindowDnd,
    type DockviewApi,
    type DragPayload,
    installCrossWindowDnd,
    installSharedHistory,
    installWindowWorkspace,
    type MultiWindowTransport,
    type SerializedDockview,
    type SharedHistory,
    type WindowWorkspace,
    type WindowWorkspaceOptions,
} from 'dockview-enterprise';
import {
    claimDrop,
    dragEnd,
    dragStart,
    historyInfo,
    historyPush,
    initialLayout,
    layoutChanged,
    moveRecorded,
    onApplyLayout,
    onHistoryChanged,
    onMoved,
    onRedoRequest,
    onRelease,
    onUndoRequest,
    peekDrag,
    redo,
    takePendingGroup,
    undo,
    windowLabel,
} from './bridge';

export { randomSessionId as randomId } from 'dockview-enterprise';

export const tauriTransport: MultiWindowTransport = {
    label: windowLabel,

    dragStart: (session, from, payload) =>
        dragStart(session, from, payload.kind, payload),
    peek: (session) => peekDrag(session) as Promise<DragPayload>,
    claim: async (session, to) => {
        await claimDrop(session, to);
    },
    dragEnd,
    onRelease,
    takePending: (label) =>
        takePendingGroup(label) as Promise<DragPayload | null>,
    moveRecorded,
    onMoved,

    initialLayout: (label) =>
        initialLayout(label) as Promise<SerializedDockview | null>,
    layoutChanged,

    historyPush,
    undo,
    redo,
    historyInfo,
    onApplyLayout: (handler) =>
        onApplyLayout((layout) => handler(layout as SerializedDockview)),
    onUndoRequest,
    onRedoRequest,
    onHistoryChanged,
};

/** The cross-window drag, plus the log the demo's panels and harness read. */
export interface Hub extends CrossWindowDnd {
    onLog(listener: (line: string) => void): () => void;
}

export function installHub(api: DockviewApi): Hub {
    const listeners = new Set<(line: string) => void>();
    const dnd = installCrossWindowDnd(api, tauriTransport, {
        onLog: (line) => {
            for (const listener of listeners) {
                listener(line);
            }
        },
    });
    return {
        get label() {
            return dnd.label;
        },
        counters: dnd.counters,
        get tearOff() {
            return dnd.tearOff;
        },
        set tearOff(value: boolean) {
            dnd.tearOff = value;
        },
        onDidMoveAcrossWindows: dnd.onDidMoveAcrossWindows,
        dispose: dnd.dispose,
        onLog(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}

export function installHistory(
    api: DockviewApi,
    onLog?: (line: string) => void
): SharedHistory {
    return installSharedHistory(api, tauriTransport, { onLog, bindKeys: true });
}

export function installWorkspace(
    api: DockviewApi,
    options: WindowWorkspaceOptions
): WindowWorkspace {
    return installWindowWorkspace(api, tauriTransport, options);
}
