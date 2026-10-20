/**
 * The Tauri transport for {@link installCrossWindowDnd}: the shell is the
 * hub, reached through the commands in `src-tauri/src/lib.rs`, and the
 * release notice arrives as a Tauri event. Outside the shell every call
 * degrades to a no-op or a rejection, so the same build runs in a browser.
 */

import type {
    DockviewApi,
    SerializedDockview,
    SerializedDockviewGroup,
} from 'dockview';
import {
    claimDrop,
    dragEnd,
    dragStart,
    historyInfo,
    historyPush,
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
import {
    type HistoryTransport,
    installHistory,
    type WindowHistory,
} from './history';
import {
    type CrossWindowDnd,
    type DragTransport,
    installCrossWindowDnd,
} from './crossWindowDnd';

export type { CrossWindowDnd as Hub } from './crossWindowDnd';
export { randomId } from './crossWindowDnd';

export const tauriTransport: DragTransport = {
    label: windowLabel,
    dragStart,
    peek: (session) => peekDrag(session) as Promise<SerializedDockviewGroup>,
    claim: async (session, to) => {
        await claimDrop(session, to);
    },
    dragEnd,
    onRelease,
    takePending: (label) =>
        takePendingGroup(label) as Promise<SerializedDockviewGroup | null>,
    moveRecorded,
    onMoved,
};

export const tauriHistoryTransport: HistoryTransport = {
    label: windowLabel,
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

export function installHub(api: DockviewApi): CrossWindowDnd {
    return installCrossWindowDnd(api, tauriTransport);
}

export function installSharedHistory(
    api: DockviewApi,
    onLog?: (line: string) => void
): WindowHistory {
    return installHistory(api, tauriHistoryTransport, { onLog });
}
