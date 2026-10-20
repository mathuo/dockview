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
import type { HistoryInfo, MovedNotice, MoveRole } from './types';

export const HISTORY_DEPTH = 50;

export interface MoveHalf {
    window: string;
    before: SerializedDockview;
    after: SerializedDockview;
}

type Entry =
    | { type: 'local'; window: string }
    | {
          type: 'move';
          session: string;
          panels: string[];
          from?: MoveHalf;
          to?: MoveHalf;
      };

export type HistoryAction =
    | { type: 'undo-local'; window: string }
    | { type: 'redo-local'; window: string }
    | { type: 'apply-layout'; window: string; layout: SerializedDockview };

export interface HistoryStep {
    actions: HistoryAction[];
    moved?: Omit<MovedNotice, 'reason'>;
}

export class HistorySequencer {
    private readonly undoStack: Entry[] = [];
    private readonly redoStack: Entry[] = [];

    constructor(private readonly depth = HISTORY_DEPTH) {}

    pushLocal(window: string): void {
        this.undoStack.push({ type: 'local', window });
        this.redoStack.length = 0;
        this.trim();
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
        const existing = this.undoStack.find(
            (entry) => entry.type === 'move' && entry.session === session
        );
        if (existing && existing.type === 'move') {
            existing[role] = half;
            return;
        }
        this.undoStack.push({
            type: 'move',
            session,
            panels: [...panels],
            [role]: half,
        });
        this.redoStack.length = 0;
        this.trim();
    }

    /** Throws when there is nothing to undo or the top move is incomplete. */
    undo(): HistoryStep {
        const entry = this.undoStack[this.undoStack.length - 1];
        if (!entry) {
            throw new Error('nothing to undo');
        }
        let step: HistoryStep;
        if (entry.type === 'local') {
            step = { actions: [{ type: 'undo-local', window: entry.window }] };
        } else {
            const { from, to } = complete(entry);
            step = {
                actions: [
                    {
                        type: 'apply-layout',
                        window: to.window,
                        layout: to.before,
                    },
                    {
                        type: 'apply-layout',
                        window: from.window,
                        layout: from.before,
                    },
                ],
                moved: {
                    session: entry.session,
                    panels: entry.panels,
                    from: to.window,
                    to: from.window,
                },
            };
        }
        this.undoStack.pop();
        this.redoStack.push(entry);
        return step;
    }

    redo(): HistoryStep {
        const entry = this.redoStack[this.redoStack.length - 1];
        if (!entry) {
            throw new Error('nothing to redo');
        }
        let step: HistoryStep;
        if (entry.type === 'local') {
            step = { actions: [{ type: 'redo-local', window: entry.window }] };
        } else {
            const { from, to } = complete(entry);
            step = {
                actions: [
                    {
                        type: 'apply-layout',
                        window: from.window,
                        layout: from.after,
                    },
                    {
                        type: 'apply-layout',
                        window: to.window,
                        layout: to.after,
                    },
                ],
                moved: {
                    session: entry.session,
                    panels: entry.panels,
                    from: from.window,
                    to: to.window,
                },
            };
        }
        this.redoStack.pop();
        this.undoStack.push(entry);
        return step;
    }

    info(): HistoryInfo {
        const nextUndo = this.undoStack[this.undoStack.length - 1];
        const nextRedo = this.redoStack[this.redoStack.length - 1];
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            nextUndo: nextUndo ? describe(nextUndo) : null,
            nextRedo: nextRedo ? describe(nextRedo) : null,
        };
    }

    /** Drop every entry that involves a window that is gone. */
    forgetWindow(window: string): void {
        const involves = (entry: Entry) =>
            entry.type === 'local'
                ? entry.window === window
                : entry.from?.window === window || entry.to?.window === window;
        for (const stack of [this.undoStack, this.redoStack]) {
            const kept = stack.filter((entry) => !involves(entry));
            stack.splice(0, stack.length, ...kept);
        }
    }

    private trim(): void {
        while (this.undoStack.length > this.depth) {
            this.undoStack.shift();
        }
    }
}

function complete(entry: Extract<Entry, { type: 'move' }>): {
    from: MoveHalf;
    to: MoveHalf;
} {
    if (!entry.from || !entry.to) {
        throw new Error(`move ${entry.session} is still being recorded`);
    }
    return { from: entry.from, to: entry.to };
}

function describe(entry: Entry): string {
    if (entry.type === 'local') {
        return `step in ${entry.window}`;
    }
    return `move of ${entry.panels.join(', ')} from ${entry.from?.window ?? '?'} to ${entry.to?.window ?? '?'}`;
}
