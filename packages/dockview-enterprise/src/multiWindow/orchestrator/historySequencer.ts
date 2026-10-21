/**
 * The one ordered history across windows. Each window keeps its own undo
 * stack for its local steps; this sequences them against the moves between
 * windows. An entry is either a marker, "a step in window X", or a move,
 * which carries each window's layout before and after. Undoing a marker
 * asks that window to undo its own top step; undoing a move applies both
 * pre-move layouts, destination first so no two windows hold the panels at
 * once. Ordering is what makes it safe: an older local step is only
 * reachable after the move that followed it has been undone.
 */

import type { SerializedDockview } from 'dockview';
import type {
    HistoryInfo,
    HistoryRequest,
    HistoryStepInfo,
    MoveEvent,
    MoveRole,
} from '../transport';

export const DEFAULT_HISTORY_DEPTH = 50;

/** One window's side of a move. */
export interface MoveHalf {
    readonly window: string;
    readonly before: SerializedDockview;
    readonly after: SerializedDockview;
}

type HistoryEntry =
    | { readonly type: 'local'; readonly window: string }
    | {
          readonly type: 'move';
          readonly session: string;
          readonly panels: string[];
          from?: MoveHalf;
          to?: MoveHalf;
      };

type MoveEntry = Extract<HistoryEntry, { type: 'move' }>;

/** A request for one window, in the order the windows must carry them out. */
export interface HistoryAction {
    readonly window: string;
    readonly request: HistoryRequest;
}

export interface HistoryStep {
    readonly actions: HistoryAction[];
    readonly moved?: Omit<MoveEvent, 'reason'>;
}

export class HistorySequencer {
    private readonly _undo: HistoryEntry[] = [];
    private readonly _redo: HistoryEntry[] = [];
    private readonly _depth: number;

    constructor(depth = DEFAULT_HISTORY_DEPTH) {
        this._depth = depth;
    }

    pushLocal(window: string): void {
        this._push({ type: 'local', window });
    }

    /**
     * A window's half of a move. The two halves arrive in either order; the
     * first opens the entry, the second completes it. A half for a session
     * already on the stack updates it in place.
     */
    recordMove(
        session: string,
        panels: string[],
        role: MoveRole,
        half: MoveHalf
    ): void {
        const existing = this._undo.find(
            (entry): entry is MoveEntry =>
                entry.type === 'move' && entry.session === session
        );
        if (existing) {
            existing[role] = half;
            return;
        }
        this._push({
            type: 'move',
            session,
            panels: [...panels],
            [role]: half,
        });
    }

    /** Throws when there is nothing to undo or the top move is incomplete. */
    undo(): HistoryStep {
        const entry = this._undo[this._undo.length - 1];
        if (!entry) {
            throw new Error('nothing to undo');
        }
        let step: HistoryStep;
        if (entry.type === 'local') {
            step = {
                actions: [{ window: entry.window, request: { type: 'undo' } }],
            };
        } else {
            const { from, to } = complete(entry);
            step = {
                actions: [
                    apply(to.window, to.before),
                    apply(from.window, from.before),
                ],
                moved: {
                    session: entry.session,
                    panels: entry.panels,
                    from: to.window,
                    to: from.window,
                },
            };
        }
        this._undo.pop();
        this._redo.push(entry);
        return step;
    }

    /** Throws when there is nothing to redo. */
    redo(): HistoryStep {
        const entry = this._redo[this._redo.length - 1];
        if (!entry) {
            throw new Error('nothing to redo');
        }
        let step: HistoryStep;
        if (entry.type === 'local') {
            step = {
                actions: [{ window: entry.window, request: { type: 'redo' } }],
            };
        } else {
            const { from, to } = complete(entry);
            step = {
                actions: [
                    apply(from.window, from.after),
                    apply(to.window, to.after),
                ],
                moved: {
                    session: entry.session,
                    panels: entry.panels,
                    from: from.window,
                    to: to.window,
                },
            };
        }
        this._redo.pop();
        this._undo.push(entry);
        return step;
    }

    info(): HistoryInfo {
        const nextUndo = this._undo[this._undo.length - 1];
        const nextRedo = this._redo[this._redo.length - 1];
        return {
            canUndo: nextUndo !== undefined,
            canRedo: nextRedo !== undefined,
            undoCount: this._undo.length,
            redoCount: this._redo.length,
            ...(nextUndo && { nextUndo: summarize(nextUndo) }),
            ...(nextRedo && { nextRedo: summarize(nextRedo) }),
        };
    }

    /**
     * Drop every entry that involves a window, and every move still missing
     * a half, which may have been that window's and could then never
     * complete. A dropped move takes everything beyond it with it: the other
     * window's earlier steps restore layouts from before the move, which are
     * only safe once the move itself has been undone.
     */
    forgetWindow(window: string): void {
        const involves = (entry: HistoryEntry) =>
            entry.type === 'local'
                ? entry.window === window
                : !entry.from ||
                  !entry.to ||
                  entry.from.window === window ||
                  entry.to.window === window;
        // Both stacks hold the entry furthest from the present first.
        for (const stack of [this._undo, this._redo]) {
            let cut = -1;
            stack.forEach((entry, index) => {
                if (entry.type === 'move' && involves(entry)) {
                    cut = index;
                }
            });
            const kept = stack.filter(
                (entry, index) => index > cut && !involves(entry)
            );
            stack.splice(0, stack.length, ...kept);
        }
    }

    private _push(entry: HistoryEntry): void {
        this._undo.push(entry);
        this._redo.length = 0;
        while (this._undo.length > this._depth) {
            this._undo.shift();
        }
    }
}

function apply(window: string, layout: SerializedDockview): HistoryAction {
    return { window, request: { type: 'apply-layout', layout } };
}

function complete(entry: MoveEntry): { from: MoveHalf; to: MoveHalf } {
    if (!entry.from || !entry.to) {
        throw new Error(`move ${entry.session} is still being recorded`);
    }
    return { from: entry.from, to: entry.to };
}

function summarize(entry: HistoryEntry): HistoryStepInfo {
    if (entry.type === 'local') {
        return { type: 'local', windowId: entry.window };
    }
    return {
        type: 'move',
        panels: entry.panels,
        ...(entry.from && { from: entry.from.window }),
        ...(entry.to && { to: entry.to.window }),
    };
}
