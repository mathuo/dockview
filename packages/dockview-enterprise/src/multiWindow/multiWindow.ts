/**
 * The one install for a window of a multi-window layout. It composes the
 * cross-window drag, the workspace and the shared history over the public
 * api, behind one transport to the orchestrator, and returns one handle for
 * the few things that only exist across windows. Everything else about the
 * instance keeps working as before.
 */

import type { DockviewApi } from 'dockview';
import {
    type CrossWindowDnd,
    type CrossWindowDndCounters,
    installCrossWindowDnd,
} from './crossWindowDnd';
import { installSharedHistory, type SharedHistory } from './sharedHistory';
import type {
    HistoryInfo,
    MovedNotice,
    MultiWindowTransport,
    Unsubscribe,
} from './types';
import { installWindowWorkspace } from './windowWorkspace';

export interface MultiWindowOptions {
    /**
     * Builds the window's default layout when the orchestrator has none for
     * it. Without the workspace (`workspace: false`) it is never called.
     */
    buildDefaults?(label: string): void;
    /**
     * Restore this window's layout from the orchestrator at start and report
     * every change back. Default true.
     */
    workspace?: boolean;
    /** How long after a change the layout is reported. Default 300 ms. */
    debounceMs?: number;
    /**
     * One undo across windows, sequenced by the orchestrator. Default on,
     * with no key bound; `{ bindKeys: true }` routes Ctrl+Z / Ctrl+Shift+Z /
     * Ctrl+Y (Cmd on macOS) on the document to it. `false` keeps undo local
     * to each window.
     */
    history?: boolean | { bindKeys?: boolean };
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

export interface MultiWindow {
    /** This window's label once the transport has answered; `''` before. */
    readonly label: string;
    /** Resolves once the window holds its initial layout, restored or default. */
    readonly ready: Promise<{ label: string; restored: boolean }>;
    readonly counters: Readonly<CrossWindowDndCounters>;
    /** See {@link MultiWindowOptions.tearOff}. */
    tearOff: boolean;
    /** Panels moved between any two windows: by a drop, or by undo or redo. */
    onDidMoveAcrossWindows(
        listener: (notice: MovedNotice) => void
    ): Unsubscribe;
    /**
     * Undo, or redo, the most recent step in any window. With
     * `history: false` these fall back to this window's own history.
     */
    undo(): void;
    redo(): void;
    /** The shared history's state; all zeros with `history: false`. */
    readonly history: HistoryInfo;
    onDidChangeHistory(listener: (info: HistoryInfo) => void): Unsubscribe;
    dispose(): void;
}

export function installMultiWindow(
    api: DockviewApi,
    transport: MultiWindowTransport,
    options: MultiWindowOptions = {}
): MultiWindow {
    // One label lookup for every part.
    const label = transport.label();
    const shared: MultiWindowTransport = { ...transport, label: () => label };
    const onLog = options.onLog;

    const dnd: CrossWindowDnd = installCrossWindowDnd(api, shared, {
        tearOff: options.tearOff,
        sessionId: options.sessionId,
        onLog,
    });

    const workspace =
        options.workspace === false
            ? undefined
            : installWindowWorkspace(api, shared, {
                  buildDefaults: options.buildDefaults,
                  debounceMs: options.debounceMs,
                  onLog,
              });
    const ready =
        workspace?.ready ??
        label.then((value) => ({ label: value, restored: false }));

    const history: SharedHistory | undefined =
        options.history === false
            ? undefined
            : installSharedHistory(api, shared, {
                  bindKeys:
                      typeof options.history === 'object'
                          ? options.history.bindKeys
                          : false,
                  onLog,
              });

    const none: HistoryInfo = {
        undoCount: 0,
        redoCount: 0,
        nextUndo: null,
        nextRedo: null,
    };

    return {
        get label() {
            return dnd.label;
        },
        ready,
        counters: dnd.counters,
        get tearOff() {
            return dnd.tearOff;
        },
        set tearOff(value: boolean) {
            dnd.tearOff = value;
        },
        onDidMoveAcrossWindows: (listener) =>
            dnd.onDidMoveAcrossWindows(listener),
        undo: () => (history ? history.undo() : api.undo()),
        redo: () => (history ? history.redo() : api.redo()),
        get history() {
            return history?.info ?? none;
        },
        onDidChangeHistory: (listener) =>
            history ? history.onDidChange(listener) : () => undefined,
        dispose() {
            history?.dispose();
            workspace?.dispose();
            dnd.dispose();
        },
    };
}
