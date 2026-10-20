/**
 * An orchestrator for windows that share one JavaScript heap: several
 * dockview instances on one page, a test, or a host that runs the
 * orchestrator in the page and bridges windows some other way. It composes
 * the three pure pieces, {@link DragHub}, {@link WorkspaceRegistry} and
 * {@link HistorySequencer}, the way a shell in another process would, and
 * hands each window a {@link MultiWindowTransport}.
 *
 * Every notice is delivered on a later microtask, never inside the call
 * that caused it, so a window's handlers run as they would with a real
 * message bus and nothing is re-entrant.
 */

import type { DockviewIDisposable, SerializedDockview } from 'dockview';
import { DragHub } from './dragHub';
import { HistorySequencer, type HistoryStep } from './historySequencer';
import type {
    DragPayload,
    HistoryInfo,
    MoveEvent,
    MoveRole,
    MultiWindowTransport,
    ReleaseEvent,
} from './types';
import { payloadPanels } from './types';
import {
    type WindowGeometry,
    WorkspaceRegistry,
    type WorkspaceState,
} from './workspaceState';

export interface MemoryOrchestratorOptions {
    /** The workspace to start from, as a previous {@link MemoryOrchestrator.snapshot}. */
    workspace?: WorkspaceState;
    /**
     * How long a drag stays claimable after its source reported it over.
     * The source's `dragend` fires the instant the drop lands in another
     * window, and that window's claim routinely arrives later. Default
     * 1500 ms.
     */
    dragEndGraceMs?: number;
    /** How many steps the shared history keeps. Default 50. */
    historyDepth?: number;
    /**
     * Called when an unclaimed drag ended with `tearOff`: the host opens a
     * window with this windowId and connects it; its cross-window drag then
     * collects the payload with `takePendingDrag`. Without this, a torn-off
     * drag is discarded like any other.
     */
    createWindow?(windowId: string, payload: DragPayload): void;
}

interface Listeners {
    release: Set<(event: ReleaseEvent) => void>;
    apply: Set<(layout: SerializedDockview) => void>;
    undo: Set<() => void>;
    redo: Set<() => void>;
}

export class MemoryOrchestrator {
    private readonly _hub = new DragHub();
    private readonly _workspace: WorkspaceRegistry;
    private readonly _history: HistorySequencer;
    private readonly _windows = new Map<string, Listeners>();
    private readonly _moved = new Set<(event: MoveEvent) => void>();
    private readonly _historyChanged = new Set<(info: HistoryInfo) => void>();
    private readonly _workspaceChanged = new Set<
        (state: WorkspaceState) => void
    >();
    private readonly _options: MemoryOrchestratorOptions;
    private _tearOffs = 0;

    constructor(options: MemoryOrchestratorOptions = {}) {
        this._options = options;
        this._workspace = new WorkspaceRegistry(options.workspace);
        this._history = new HistorySequencer(options.historyDepth);
    }

    /** The windows this orchestrator knows, connected or restored. */
    get windowIds(): string[] {
        return this._workspace.windowIds();
    }

    /** The transport for a window, which the orchestrator knows from now on. */
    connect(windowId: string): MultiWindowTransport {
        this._workspace.ensureWindow(windowId);
        const listeners = this._listeners(windowId);
        const subscribe = <T>(
            set: Set<T>,
            handler: T
        ): Promise<DockviewIDisposable> => {
            set.add(handler);
            return Promise.resolve({
                dispose: () => {
                    set.delete(handler);
                },
            });
        };

        return {
            windowId: () => Promise.resolve(windowId),

            startDrag: (session, from, payload) =>
                settle(() => this._hub.start(session, { from, payload })),
            peekDrag: (session) => settle(() => this._hub.peek(session)),
            claimDrag: (session, to) => settle(() => this._claim(session, to)),
            endDrag: (session, tearOff) =>
                settle(() => this._dragEnd(session, tearOff)),
            onDidRelease: (handler) => subscribe(listeners.release, handler),
            takePendingDrag: (forWindow) =>
                settle(() => this._hub.takePendingDrag(forWindow)),
            reportMove: (session, from, role, panels, before, after) =>
                settle(() =>
                    this._recordMove(session, from, role, panels, before, after)
                ),
            onDidMove: (handler) => subscribe(this._moved, handler),

            loadLayout: (forWindow) =>
                settle(() => this._workspace.loadLayout(forWindow)),
            reportLayout: (forWindow, layout) =>
                settle(() => {
                    this._workspace.setLayout(forWindow, layout);
                    this._workspaceDidChange();
                }),

            reportLocalStep: (forWindow) =>
                settle(() => {
                    this._history.pushLocal(forWindow);
                    this._historyDidChange();
                }),
            undo: () => settle(() => this.undo()),
            redo: () => settle(() => this.redo()),
            getHistory: () => settle(() => this._history.info()),
            onRequestApplyLayout: (handler) =>
                subscribe(listeners.apply, handler),
            onRequestUndo: (handler) => subscribe(listeners.undo, handler),
            onRequestRedo: (handler) => subscribe(listeners.redo, handler),
            onDidChangeHistory: (handler) =>
                subscribe(this._historyChanged, handler),
        };
    }

    /**
     * Forget a window that closed: its listeners, its workspace record and
     * every history entry that involves it.
     */
    disconnect(windowId: string): void {
        this._windows.delete(windowId);
        this._workspace.removeWindow(windowId);
        this._history.forgetWindow(windowId);
        this._workspaceDidChange();
        this._historyDidChange();
    }

    /** Undo, or redo, the most recent step in any window. */
    undo(): void {
        this._carryOut(this._history.undo(), 'undo');
    }

    redo(): void {
        this._carryOut(this._history.redo(), 'redo');
    }

    get history(): HistoryInfo {
        return this._history.info();
    }

    /** The whole workspace, in the shape to persist and pass back as `workspace`. */
    snapshot(): WorkspaceState {
        return this._workspace.snapshot();
    }

    /** Record where the host put a window, for the next start. */
    setGeometry(windowId: string, geometry: WindowGeometry): void {
        this._workspace.setGeometry(windowId, geometry);
        this._workspaceDidChange();
    }

    /** The workspace changed: a layout or frame was reported, or a window left. */
    onDidChangeWorkspace(
        listener: (state: WorkspaceState) => void
    ): DockviewIDisposable {
        this._workspaceChanged.add(listener);
        return {
            dispose: () => {
                this._workspaceChanged.delete(listener);
            },
        };
    }

    onDidChangeHistory(
        listener: (info: HistoryInfo) => void
    ): DockviewIDisposable {
        this._historyChanged.add(listener);
        return {
            dispose: () => {
                this._historyChanged.delete(listener);
            },
        };
    }

    onDidMove(listener: (event: MoveEvent) => void): DockviewIDisposable {
        this._moved.add(listener);
        return {
            dispose: () => {
                this._moved.delete(listener);
            },
        };
    }

    private _claim(session: string, to: string): void {
        const claim = this._hub.claim(session, to);
        const panels = payloadPanels(claim.payload);
        this._workspace.expectMove(panels, claim.release.from, to);
        this._deliver(claim.release.from, 'release', {
            session,
            to,
            reason: 'claim',
        });
        this._broadcast(this._moved, {
            session,
            panels,
            from: claim.release.from,
            to,
            reason: 'drop',
        });
    }

    private _dragEnd(session: string, tearOff: boolean): void {
        if (!this._hub.end(session, tearOff)) {
            return;
        }
        setTimeout(
            () => this._expire(session),
            this._options.dragEndGraceMs ?? 1500
        );
    }

    private _listeners(windowId: string): Listeners {
        let listeners = this._windows.get(windowId);
        if (!listeners) {
            listeners = {
                release: new Set(),
                apply: new Set(),
                undo: new Set(),
                redo: new Set(),
            };
            this._windows.set(windowId, listeners);
        }
        return listeners;
    }

    private _expire(session: string): void {
        const ended = this._hub.expire(session, () => {
            this._tearOffs += 1;
            return `torn-off-${this._tearOffs}`;
        });
        if (ended.outcome !== 'torn-off') {
            return;
        }
        const createWindow = this._options.createWindow;
        if (!createWindow) {
            // Nobody to open a window: the parked payload is dropped.
            this._hub.takePendingDrag(ended.windowId);
            return;
        }
        const payload = this._hub.peekPending(ended.windowId);
        if (!payload) {
            return;
        }
        const panels = payloadPanels(payload);
        const from = ended.release.from;
        // As for a claim: the new window may report the panels before the
        // source reports them gone.
        this._workspace.expectMove(panels, from, ended.windowId);
        createWindow(ended.windowId, payload);
        this._deliver(from, 'release', {
            session,
            to: ended.windowId,
            reason: 'tear-off',
        });
        this._broadcast(this._moved, {
            session,
            panels,
            from,
            to: ended.windowId,
            reason: 'tear-off',
        });
    }

    private _recordMove(
        session: string,
        window: string,
        role: MoveRole,
        panels: string[],
        before: SerializedDockview,
        after: SerializedDockview
    ): void {
        this._history.recordMove(session, panels, role, {
            window,
            before,
            after,
        });
        this._historyDidChange();
    }

    private _carryOut(step: HistoryStep, reason: 'undo' | 'redo'): void {
        for (const action of step.actions) {
            switch (action.type) {
                case 'undo-local':
                    this._deliver(action.window, 'undo', undefined);
                    break;
                case 'redo-local':
                    this._deliver(action.window, 'redo', undefined);
                    break;
                case 'apply-layout':
                    // Stored before it is applied, so the windows' own
                    // reports afterwards never read as duplicates.
                    this._workspace.setLayoutUnchecked(
                        action.window,
                        action.layout
                    );
                    this._deliver(action.window, 'apply', action.layout);
                    break;
            }
        }
        if (step.moved) {
            this._broadcast(this._moved, { ...step.moved, reason });
        }
        this._workspaceDidChange();
        this._historyDidChange();
    }

    private _deliver<K extends keyof Listeners>(
        windowId: string,
        kind: K,
        payload: Listeners[K] extends Set<(arg: infer A) => void> ? A : never
    ): void {
        const listeners = this._windows.get(windowId)?.[kind];
        if (!listeners) {
            return;
        }
        this._broadcast(
            listeners as unknown as Set<(arg: typeof payload) => void>,
            payload
        );
    }

    private _broadcast<T>(listeners: Set<(arg: T) => void>, payload: T): void {
        const snapshot = Array.from(listeners);
        queueMicrotask(() => {
            for (const listener of snapshot) {
                listener(payload);
            }
        });
    }

    private _workspaceDidChange(): void {
        if (this._workspaceChanged.size > 0) {
            const state = this._workspace.snapshot();
            for (const listener of this._workspaceChanged) {
                listener(state);
            }
        }
    }

    private _historyDidChange(): void {
        this._broadcast(this._historyChanged, this._history.info());
    }
}

/**
 * Run a synchronous orchestrator step as a transport call: its result, or
 * the error it throws, arrives as a settled promise, as it would over a
 * message bus.
 */
function settle<T>(step: () => T): Promise<T> {
    try {
        return Promise.resolve(step());
    } catch (err: unknown) {
        return Promise.reject(err);
    }
}
