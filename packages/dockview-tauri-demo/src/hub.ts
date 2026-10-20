/**
 * The Tauri transport for the enterprise multi-window install: the shell
 * is the orchestrator, reached through the commands in
 * `src-tauri/src/lib.rs`, and its notices arrive as Tauri events. Outside the
 * shell every call degrades to a no-op or a rejection, so the same build
 * runs in a browser.
 */

import {
    type DockviewApi,
    type DragPayload,
    installMultiWindow,
    type MultiWindow,
    type MultiWindowOptions,
    type MultiWindowTransport,
    type SerializedDockview,
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

/** The bridge's listeners hand back an unlisten function; dockview events hand back a disposable. */
const disposable = (unlisten: Promise<() => void>) =>
    unlisten.then((dispose) => ({ dispose }));

export const tauriTransport: MultiWindowTransport = {
    windowId: windowLabel,

    startDrag: (session, from, payload) =>
        dragStart(session, from, payload.kind, payload),
    peekDrag: (session) => peekDrag(session) as Promise<DragPayload>,
    claimDrag: async (session, to) => {
        await claimDrop(session, to);
    },
    endDrag: dragEnd,
    onDidRelease: (handler) => disposable(onRelease(handler)),
    takePendingDrag: (windowId) =>
        takePendingGroup(windowId) as Promise<DragPayload | null>,
    reportMove: moveRecorded,
    onDidMove: (handler) => disposable(onMoved(handler)),

    loadLayout: (windowId) =>
        initialLayout(windowId) as Promise<SerializedDockview | null>,
    reportLayout: layoutChanged,

    reportLocalStep: historyPush,
    undo,
    redo,
    getHistory: historyInfo,
    onRequestApplyLayout: (handler) =>
        disposable(
            onApplyLayout((layout) => handler(layout as SerializedDockview))
        ),
    onRequestUndo: (handler) => disposable(onUndoRequest(handler)),
    onRequestRedo: (handler) => disposable(onRedoRequest(handler)),
    onDidChangeHistory: (handler) => disposable(onHistoryChanged(handler)),
};

/** The multi-window handle, plus the log the demo's panels and harness read. */
export interface Hub extends MultiWindow {
    onLog(listener: (line: string) => void): () => void;
}

export function installHub(
    api: DockviewApi,
    options: Pick<MultiWindowOptions, 'buildDefaults'>
): Hub {
    const listeners = new Set<(line: string) => void>();
    const multiWindow = installMultiWindow(api, tauriTransport, {
        ...options,
        history: { bindKeys: true },
        onLog: (line) => {
            for (const listener of listeners) {
                listener(line);
            }
        },
    });
    return {
        get windowId() {
            return multiWindow.windowId;
        },
        ready: multiWindow.ready,
        counters: multiWindow.counters,
        get tearOff() {
            return multiWindow.tearOff;
        },
        set tearOff(value: boolean) {
            multiWindow.tearOff = value;
        },
        onDidMoveAcrossWindows: multiWindow.onDidMoveAcrossWindows,
        undo: multiWindow.undo,
        redo: multiWindow.redo,
        get history() {
            return multiWindow.history;
        },
        onDidChangeHistory: multiWindow.onDidChangeHistory,
        dispose: multiWindow.dispose,
        onLog(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
