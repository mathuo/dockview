/**
 * Thin wrapper over the Tauri IPC surface. Every entry point is lazy and
 * degrades to a no-op in a plain browser so the same build can be compared
 * side by side in Chrome and in the desktop shell.
 */

import { isTauri } from './host';

export const LAYOUT_EVENT = 'dockview:layout';

export interface NativeHostInfo {
    tauriVersion: string;
    webviewVersion: string;
    platform: string;
    arch: string;
    /**
     * Whether the running platform serves the app over `http(s)` in release
     * builds. Where it does not, dockview's popout guard rejects the URL.
     */
    httpOrigin: boolean;
}

export interface LayoutBroadcast {
    from: string;
    layout: unknown;
}

export async function windowLabel(): Promise<string> {
    if (!isTauri()) {
        return 'browser';
    }
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    return getCurrentWindow().label;
}

export async function nativeHostInfo(): Promise<NativeHostInfo | null> {
    if (!isTauri()) {
        return null;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<NativeHostInfo>('host_info');
}

/**
 * Asks Rust to build a second native window running this same app. The new
 * webview is a separate context — it shares no JavaScript heap with this one,
 * which is exactly the isolation dockview's DOM-moving popouts cannot cross.
 */
export async function openNativeWindow(label: string): Promise<void> {
    if (!isTauri()) {
        throw new Error('native windows require the Tauri shell');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_dock_window', { label });
}

export async function broadcastLayout(
    from: string,
    layout: unknown
): Promise<void> {
    if (!isTauri()) {
        throw new Error('broadcasting requires the Tauri shell');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('broadcast_layout', { from, layout });
}

export async function onLayoutBroadcast(
    handler: (payload: LayoutBroadcast) => void
): Promise<() => void> {
    if (!isTauri()) {
        return () => {
            /* nothing subscribed */
        };
    }
    const { listen } = await import('@tauri-apps/api/event');
    return listen<LayoutBroadcast>(LAYOUT_EVENT, (event) =>
        handler(event.payload)
    );
}

/** The label the shell injects into every window it creates for `window.open`. */
function nativePopoutLabel(win: Window): string | undefined {
    return (win as { __DOCKVIEW_POPOUT_LABEL__?: string })
        .__DOCKVIEW_POPOUT_LABEL__;
}

/**
 * Destroys the native window behind a `window.open` handle. wry's macOS UI
 * delegate has no `webViewDidClose:`, so `handle.close()` is a no-op there and
 * the opener asks the shell instead. The label is injected as the popout
 * document loads, so a handle closed straight after opening is polled for
 * it briefly. No-op outside Tauri, and once the window is gone.
 */
export async function closeNativePopout(win: Window): Promise<void> {
    if (!isTauri()) {
        return;
    }
    let label: string | undefined;
    for (let attempt = 0; attempt < 10 && !label; attempt += 1) {
        label = nativePopoutLabel(win);
        if (!label) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    if (!label) {
        return;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('close_popout', { label });
}

/*
 * The hub: one drag in flight at a time, brokered by the shell so a group can
 * cross from one native window's dockview to another's. The shell holds the
 * serialized group; the OS drag carries only the session id.
 */

export const RELEASE_EVENT = 'dockview:release';

import type { DragKind, ReleaseNotice } from './crossWindowDnd';

/** The source window announces a drag, handing the shell the serialized group. */
export async function dragStart(
    session: string,
    from: string,
    kind: DragKind,
    envelope: unknown
): Promise<void> {
    if (!isTauri()) {
        return;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('drag_start', { session, from, kind, envelope });
}

/** The destination window reads a drag's serialized group without claiming it. */
export async function peekDrag(session: string): Promise<unknown> {
    if (!isTauri()) {
        throw new Error('reading a drag requires the Tauri shell');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<unknown>('peek_drag', { session });
}

/**
 * The destination window claims a drop. Resolves to the serialized group;
 * rejects when another window claimed it first or the shell never saw it.
 */
export async function claimDrop(session: string, to: string): Promise<unknown> {
    if (!isTauri()) {
        throw new Error('claiming a drop requires the Tauri shell');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<unknown>('claim_drop', { session, to });
}

/**
 * The source window reports its drag over. The shell keeps the drag
 * claimable for a grace period first; with `tearOff`, an unclaimed drag
 * then becomes a new window holding the group, which the source learns
 * through the release event.
 */
export async function dragEnd(
    session: string,
    tearOff: boolean
): Promise<void> {
    if (!isTauri()) {
        return;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('drag_end', { session, tearOff });
}

/** Delivered to the source window once another window has taken its group. */
export async function onRelease(
    handler: (notice: ReleaseNotice) => void
): Promise<() => void> {
    if (!isTauri()) {
        return () => {
            /* nothing subscribed */
        };
    }
    const { getCurrentWebviewWindow } = await import(
        '@tauri-apps/api/webviewWindow'
    );
    const current = getCurrentWebviewWindow();
    return current.listen<ReleaseNotice & { from: string }>(
        RELEASE_EVENT,
        (event) => {
            if (event.payload.from === current.label) {
                handler(event.payload);
            }
        }
    );
}

/** A window created by a tear-off collects the group waiting for it. */
export async function takePendingGroup(label: string): Promise<unknown | null> {
    if (!isTauri()) {
        return null;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<unknown | null>('take_pending_group', { label });
}

/**
 * The measurement harness: a JSON line on the shell's stdout, read by
 * `scripts/measure-cross-window-drag.py`. No-op outside the shell.
 */
export async function autotestReport(
    kind: string,
    payload: unknown
): Promise<void> {
    if (!isTauri()) {
        return;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('autotest_report', {
        label: await windowLabel(),
        kind,
        payload,
    });
}

/*
 * The workspace: the shell owns the file that says which windows exist and
 * what each holds. A window receives its layout from the shell at start and
 * reports changes back; it never touches storage itself.
 */

export interface WorkspaceWindowInfo {
    label: string;
    geometry: { x: number; y: number; width: number; height: number } | null;
    hasLayout: boolean;
}

export interface WorkspaceInfo {
    path: string;
    /** Milliseconds since the Unix epoch, or null if never written this run. */
    lastSaved: number | null;
    windows: WorkspaceWindowInfo[];
}

/** The layout this window should start with, or null to build the defaults. */
export async function initialLayout(label: string): Promise<unknown | null> {
    if (!isTauri()) {
        return null;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<unknown | null>('initial_layout', { label });
}

/** Reports this window's layout. Rejects if it names a panel another window holds. */
export async function layoutChanged(
    label: string,
    layout: unknown
): Promise<void> {
    if (!isTauri()) {
        return;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('layout_changed', { label, layout });
}

export async function workspaceInfo(): Promise<WorkspaceInfo | null> {
    if (!isTauri()) {
        return null;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<WorkspaceInfo>('workspace_info');
}

/*
 * One undo history across every window. Each window keeps dockview's own
 * stack for its local steps; the shell sequences them with the moves between
 * windows, and tells a window when to undo or redo its own top step or to
 * take a layout the shell holds.
 */

export interface HistoryInfo {
    undoCount: number;
    redoCount: number;
    nextUndo: string | null;
    nextRedo: string | null;
}

export interface MovedNotice {
    session: string;
    panels: string[];
    from: string;
    to: string;
    reason: 'drop' | 'undo' | 'redo';
}

async function invokeOrIgnore(
    command: string,
    args?: Record<string, unknown>
): Promise<void> {
    if (!isTauri()) {
        return;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke(command, args);
}

async function listenOrIgnore<T>(
    event: string,
    handler: (payload: T) => void
): Promise<() => void> {
    if (!isTauri()) {
        return () => {
            /* nothing subscribed */
        };
    }
    const { listen } = await import('@tauri-apps/api/event');
    return listen<T>(event, (e) => handler(e.payload));
}

/**
 * An event the shell addresses to one window. A listener registered for
 * "any" target hears events emitted to every window, so this registers on
 * this window's own target and, belt and braces, drops payloads naming
 * another window.
 */
async function listenToThisWindow<T extends { window: string }>(
    event: string,
    handler: (payload: T) => void
): Promise<() => void> {
    if (!isTauri()) {
        return () => {
            /* nothing subscribed */
        };
    }
    const { getCurrentWebviewWindow } = await import(
        '@tauri-apps/api/webviewWindow'
    );
    const current = getCurrentWebviewWindow();
    return current.listen<T>(event, (e) => {
        if (e.payload.window === current.label) {
            handler(e.payload);
        }
    });
}

/** This window recorded a step in its own history. */
export const historyPush = (label: string) =>
    invokeOrIgnore('history_push', { label });

/** This window's half of a move: its layout before and after. */
export const moveRecorded = (
    session: string,
    label: string,
    role: 'from' | 'to',
    panels: string[],
    before: unknown,
    after: unknown
) =>
    invokeOrIgnore('move_recorded', {
        session,
        label,
        role,
        panels,
        before,
        after,
    });

export const undo = () => invokeOrIgnore('undo');
export const redo = () => invokeOrIgnore('redo');

export async function historyInfo(): Promise<HistoryInfo | null> {
    if (!isTauri()) {
        return null;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<HistoryInfo>('history_info');
}

export const onApplyLayout = (handler: (layout: unknown) => void) =>
    listenToThisWindow<{ window: string; layout: unknown }>(
        'dockview:apply',
        (payload) => handler(payload.layout)
    );
export const onUndoRequest = (handler: () => void) =>
    listenToThisWindow<{ window: string }>('dockview:undo-request', () =>
        handler()
    );
export const onRedoRequest = (handler: () => void) =>
    listenToThisWindow<{ window: string }>('dockview:redo-request', () =>
        handler()
    );
export const onHistoryChanged = (handler: (info: HistoryInfo) => void) =>
    listenOrIgnore<HistoryInfo>('dockview:history', handler);
export const onMoved = (handler: (notice: MovedNotice) => void) =>
    listenOrIgnore<MovedNotice>('dockview:moved', handler);
