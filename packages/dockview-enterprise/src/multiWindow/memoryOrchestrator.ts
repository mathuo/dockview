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

import type { SerializedDockview } from 'dockview';
import { DragHub } from './dragHub';
import { HistorySequencer, type HistoryStep } from './historySequencer';
import type {
    DragPayload,
    HistoryInfo,
    MovedNotice,
    MoveRole,
    MultiWindowTransport,
    ReleaseNotice,
    Unsubscribe,
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
     * window with this label and connects it; its cross-window drag then
     * collects the payload with `takePending`. Without this, a torn-off
     * drag is discarded like any other.
     */
    createWindow?(label: string, payload: DragPayload): void;
}

interface Listeners {
    release: Set<(notice: ReleaseNotice) => void>;
    apply: Set<(layout: SerializedDockview) => void>;
    undo: Set<() => void>;
    redo: Set<() => void>;
}

export class MemoryOrchestrator {
    private readonly _hub = new DragHub();
    private readonly _workspace: WorkspaceRegistry;
    private readonly _history: HistorySequencer;
    private readonly _windows = new Map<string, Listeners>();
    private readonly _moved = new Set<(notice: MovedNotice) => void>();
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
    get labels(): string[] {
        return this._workspace.labels();
    }

    /** The transport for a window, which the orchestrator knows from now on. */
    connect(label: string): MultiWindowTransport {
        this._workspace.ensureWindow(label);
        const listeners = this._listeners(label);
        const subscribe = <T>(
            set: Set<T>,
            handler: T
        ): Promise<Unsubscribe> => {
            set.add(handler);
            return Promise.resolve(() => {
                set.delete(handler);
            });
        };

        return {
            label: () => Promise.resolve(label),

            dragStart: (session, from, payload) =>
                settle(() => this._hub.start(session, { from, payload })),
            peek: (session) => settle(() => this._hub.peek(session)),
            claim: (session, to) => settle(() => this._claim(session, to)),
            dragEnd: (session, tearOff) =>
                settle(() => this._dragEnd(session, tearOff)),
            onRelease: (handler) => subscribe(listeners.release, handler),
            takePending: (forLabel) =>
                settle(() => this._hub.takePending(forLabel)),
            moveRecorded: (session, from, role, panels, before, after) =>
                settle(() =>
                    this._recordMove(session, from, role, panels, before, after)
                ),
            onMoved: (handler) => subscribe(this._moved, handler),

            initialLayout: (forLabel) =>
                settle(() => this._workspace.initialLayout(forLabel)),
            layoutChanged: (forLabel, layout) =>
                settle(() => {
                    this._workspace.setLayout(forLabel, layout);
                    this._workspaceDidChange();
                }),

            historyPush: (forLabel) =>
                settle(() => {
                    this._history.pushLocal(forLabel);
                    this._historyDidChange();
                }),
            undo: () => settle(() => this.undo()),
            redo: () => settle(() => this.redo()),
            historyInfo: () => settle(() => this._history.info()),
            onApplyLayout: (handler) => subscribe(listeners.apply, handler),
            onUndoRequest: (handler) => subscribe(listeners.undo, handler),
            onRedoRequest: (handler) => subscribe(listeners.redo, handler),
            onHistoryChanged: (handler) =>
                subscribe(this._historyChanged, handler),
        };
    }

    /**
     * Forget a window that closed: its listeners, its workspace record and
     * every history entry that involves it.
     */
    disconnect(label: string): void {
        this._windows.delete(label);
        this._workspace.removeWindow(label);
        this._history.forgetWindow(label);
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

    get historyInfo(): HistoryInfo {
        return this._history.info();
    }

    /** The whole workspace, in the shape to persist and pass back as `workspace`. */
    snapshot(): WorkspaceState {
        return this._workspace.snapshot();
    }

    /** Record where the host put a window, for the next start. */
    setGeometry(label: string, geometry: WindowGeometry): void {
        this._workspace.setGeometry(label, geometry);
        this._workspaceDidChange();
    }

    /** The workspace changed: a layout or frame was reported, or a window left. */
    onDidChangeWorkspace(
        listener: (state: WorkspaceState) => void
    ): Unsubscribe {
        this._workspaceChanged.add(listener);
        return () => {
            this._workspaceChanged.delete(listener);
        };
    }

    onDidChangeHistory(listener: (info: HistoryInfo) => void): Unsubscribe {
        this._historyChanged.add(listener);
        return () => {
            this._historyChanged.delete(listener);
        };
    }

    onDidMove(listener: (notice: MovedNotice) => void): Unsubscribe {
        this._moved.add(listener);
        return () => {
            this._moved.delete(listener);
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

    private _listeners(label: string): Listeners {
        let listeners = this._windows.get(label);
        if (!listeners) {
            listeners = {
                release: new Set(),
                apply: new Set(),
                undo: new Set(),
                redo: new Set(),
            };
            this._windows.set(label, listeners);
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
            this._hub.takePending(ended.label);
            return;
        }
        const payload = this._hub.peekPending(ended.label);
        if (!payload) {
            return;
        }
        const panels = payloadPanels(payload);
        const from = ended.release.from;
        // As for a claim: the new window may report the panels before the
        // source reports them gone.
        this._workspace.expectMove(panels, from, ended.label);
        createWindow(ended.label, payload);
        this._deliver(from, 'release', {
            session,
            to: ended.label,
            reason: 'tear-off',
        });
        this._broadcast(this._moved, {
            session,
            panels,
            from,
            to: ended.label,
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
        label: string,
        kind: K,
        payload: Listeners[K] extends Set<(arg: infer A) => void> ? A : never
    ): void {
        const listeners = this._windows.get(label)?.[kind];
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
