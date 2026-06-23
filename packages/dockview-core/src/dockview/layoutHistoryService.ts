import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Emitter, Event } from '../events';
import {
    DockviewLayoutMutationEvent,
    DockviewLayoutMutationKind,
    DockviewOrigin,
    SerializedDockview,
} from './dockviewComponent';
import { DockviewComponentOptions } from './options';
import { defineModule } from './modules';

/**
 * The narrow surface {@link LayoutHistoryService} needs from the host
 * (`DockviewComponent`). It reads/writes whole-layout snapshots and listens to
 * the mutation-transaction boundary — the only place a *pre-image* can be taken
 * before a mutation runs.
 */
export interface ILayoutHistoryHost {
    readonly options: DockviewComponentOptions;
    toJSON(): SerializedDockview;
    fromJSON(
        data: SerializedDockview,
        options?: { reuseExistingPanels: boolean }
    ): void;
    /** Fires before a structural mutation — used to capture the pre-image. */
    readonly onWillMutateLayout: Event<DockviewLayoutMutationEvent>;
    /** Fires after a structural mutation — used to capture the post-image. */
    readonly onDidMutateLayout: Event<DockviewLayoutMutationEvent>;
}

export interface LayoutHistoryChangeEvent {
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly undoCount: number;
    readonly redoCount: number;
    readonly lastEntry?: {
        kind: DockviewLayoutMutationKind;
        origin: DockviewOrigin;
    };
}

/** A never-firing history-change event — the fallback when the module is absent
 *  (so `api.onDidChangeHistory` is always a valid, subscribable event). */
export const NO_LAYOUT_HISTORY_CHANGES: Event<
    LayoutHistoryChangeEvent
> = () => ({
    dispose: () => {
        // noop — nothing ever fires
    },
});

export interface ILayoutHistoryService extends IDisposable {
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly onDidChangeHistory: Event<LayoutHistoryChangeEvent>;
    undo(): void;
    redo(): void;
    /** Drop both stacks (e.g. on document switch). */
    clear(): void;
}

interface HistoryEntry {
    readonly kind: DockviewLayoutMutationKind;
    readonly origin: DockviewOrigin;
    /** Pre-image — what undo restores. */
    readonly before: SerializedDockview;
    /** Post-image — what redo restores. */
    readonly after: SerializedDockview;
    readonly timestamp: number;
}

const DEFAULT_DEPTH = 25;

/** Discrete mutations that produce one undo step each. */
const DISCRETE: ReadonlySet<DockviewLayoutMutationKind> = new Set([
    'add',
    'remove',
    'move',
    'float',
    'popout',
    'maximize',
    'tab-group',
]);

/** Bulk transactions that replace the whole layout — they clear history rather
 *  than recording (undoing *across* a full restore resurrects a foreign layout). */
const BULK: ReadonlySet<DockviewLayoutMutationKind> = new Set([
    'load',
    'clear',
]);

function resolveOptions(options: DockviewComponentOptions): {
    enabled: boolean;
    depth: number;
    undoableProgrammaticMutations: boolean;
    clearOnFromJSON: boolean;
} {
    const o = options.layoutHistory;
    return {
        enabled: o?.enabled ?? false,
        depth: o?.depth ?? DEFAULT_DEPTH,
        undoableProgrammaticMutations:
            o?.undoableProgrammaticMutations ?? false,
        clearOnFromJSON: o?.clearOnFromJSON ?? true,
    };
}

/**
 * Undo / redo for layout mutations. Snapshot strategy: each recorded mutation
 * keeps a full `toJSON()` pre-image (`before`) and post-image (`after`); undo
 * restores `before` via `fromJSON(.., { reuseExistingPanels: true })`, redo
 * restores `after`. Opt-in via `layoutHistory.enabled`.
 *
 * Phase B: single-window, discrete mutations (close/move/float/popout/add/
 * maximize/tab-group). Resize coalescing, cross-window async re-open and the
 * fine-grained `clearOnFromJSON` seam-timing are later phases; here a bulk
 * `load`/`clear` simply clears the stacks (the common, correct default).
 */
export class LayoutHistoryService
    extends CompositeDisposable
    implements ILayoutHistoryService
{
    private readonly _host: ILayoutHistoryHost;
    private readonly _undo: HistoryEntry[] = [];
    private readonly _redo: HistoryEntry[] = [];
    /** Pre-image captured on `onWillMutateLayout`, consumed on `onDidMutateLayout`. */
    private _pendingBefore: SerializedDockview | undefined;
    /** True while an undo/redo apply is running, so the recorder ignores the
     *  mutation events the apply itself fires (re-entrancy). */
    private _applying = false;

    private readonly _onDidChangeHistory =
        new Emitter<LayoutHistoryChangeEvent>();
    readonly onDidChangeHistory: Event<LayoutHistoryChangeEvent> =
        this._onDidChangeHistory.event;

    constructor(host: ILayoutHistoryHost) {
        super();
        this._host = host;

        this.addDisposables(
            this._onDidChangeHistory,
            host.onWillMutateLayout((e) => this._onWill(e)),
            host.onDidMutateLayout((e) => this._onDid(e))
        );
    }

    private get _opts() {
        // Read live so `updateOptions({ layoutHistory })` applies without rebuild.
        return resolveOptions(this._host.options);
    }

    get canUndo(): boolean {
        return this._undo.length > 0;
    }

    get canRedo(): boolean {
        return this._redo.length > 0;
    }

    private _records(e: DockviewLayoutMutationEvent): boolean {
        const opts = this._opts;
        if (!opts.enabled || this._applying) {
            return false;
        }
        if (!DISCRETE.has(e.kind)) {
            return false;
        }
        // A programmatic (`api.*`) mutation is the app's own state management;
        // by default it doesn't pollute the user's Ctrl+Z stack.
        return e.origin === 'user' || opts.undoableProgrammaticMutations;
    }

    private _onWill(e: DockviewLayoutMutationEvent): void {
        if (this._applying) {
            return;
        }
        // A bulk restore/clear blows away the stacks (see class doc); nothing to
        // pre-image.
        if (BULK.has(e.kind)) {
            return;
        }
        // Capture the pre-image only when this mutation will actually be
        // recorded — avoids a wasted toJSON() on ignored mutations.
        this._pendingBefore = this._records(e)
            ? this._host.toJSON()
            : undefined;
    }

    private _onDid(e: DockviewLayoutMutationEvent): void {
        if (this._applying) {
            return;
        }
        if (BULK.has(e.kind)) {
            if (this._opts.enabled && this._opts.clearOnFromJSON) {
                this.clear();
            }
            this._pendingBefore = undefined;
            return;
        }
        const before = this._pendingBefore;
        this._pendingBefore = undefined;
        if (!before || !this._records(e)) {
            return;
        }
        this._undo.push({
            kind: e.kind,
            origin: e.origin,
            before,
            after: this._host.toJSON(),
            timestamp: Date.now(),
        });
        // A fresh mutation invalidates the redo future.
        this._redo.length = 0;
        // Bounded ring — drop the oldest beyond the depth limit.
        const depth = Math.max(1, this._opts.depth);
        while (this._undo.length > depth) {
            this._undo.shift();
        }
        this._fire();
    }

    undo(): void {
        const entry = this._undo.pop();
        if (!entry) {
            return;
        }
        this._apply(entry.before);
        this._redo.push(entry);
        this._fire();
    }

    redo(): void {
        const entry = this._redo.pop();
        if (!entry) {
            return;
        }
        this._apply(entry.after);
        this._undo.push(entry);
        this._fire();
    }

    /**
     * Restore a snapshot. `reuseExistingPanels` is mandatory — without it every
     * undo disposes and recreates every renderer (content flash, lost focus).
     * The re-entrancy flag stops the mutations this fires from re-recording.
     */
    private _apply(snapshot: SerializedDockview): void {
        this._applying = true;
        try {
            this._host.fromJSON(snapshot, { reuseExistingPanels: true });
        } finally {
            this._applying = false;
        }
    }

    clear(): void {
        const had = this._undo.length > 0 || this._redo.length > 0;
        this._undo.length = 0;
        this._redo.length = 0;
        this._pendingBefore = undefined;
        if (had) {
            this._fire();
        }
    }

    private _fire(): void {
        const last = this._undo[this._undo.length - 1];
        this._onDidChangeHistory.fire({
            canUndo: this.canUndo,
            canRedo: this.canRedo,
            undoCount: this._undo.length,
            redoCount: this._redo.length,
            lastEntry: last
                ? { kind: last.kind, origin: last.origin }
                : undefined,
        });
    }
}

export const LayoutHistoryModule = defineModule<
    'layoutHistoryService',
    ILayoutHistoryHost
>({
    name: 'LayoutHistory',
    serviceKey: 'layoutHistoryService',
    create: (host) => new LayoutHistoryService(host),
});
