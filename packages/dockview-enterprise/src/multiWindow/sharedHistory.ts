/**
 * A window's side of the one undo history across every window.
 *
 * Dockview's own history keeps this window's local steps and knows how to
 * restore them. What it cannot know is the order of those steps against the
 * moves between windows, so the orchestrator sequences: this module reports
 * each local step as it is pushed, forwards undo and redo to the
 * orchestrator, and carries out what comes back, which is either "undo (or
 * redo) your own top step" or "take this layout". Ordering is what keeps it
 * safe: an older local step is only reachable once the move after it has
 * been undone.
 *
 * Needs `layoutHistory` enabled with `clearOnFromJSON: false`, since an
 * applied layout arrives through `fromJSON` and must not wipe the stack.
 */

import type { DockviewApi } from 'dockview';
import type { HistoryInfo, HistoryTransport } from './types';

export interface SharedHistoryOptions {
    /**
     * Route Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (Cmd on macOS) on the document to
     * the orchestrator. Off by default, as dockview's own history binds no
     * key either.
     */
    bindKeys?: boolean;
    onLog?(line: string): void;
}

export interface SharedHistory {
    /** Undo, or redo, the most recent step in any window. */
    undo(): void;
    redo(): void;
    readonly info: HistoryInfo;
    onDidChange(listener: (info: HistoryInfo) => void): () => void;
    dispose(): void;
}

export function installSharedHistory(
    api: DockviewApi,
    transport: HistoryTransport,
    options: SharedHistoryOptions = {}
): SharedHistory {
    const log = options.onLog ?? (() => undefined);
    const teardown: (() => void)[] = [];
    const listeners = new Set<(info: HistoryInfo) => void>();
    let label = '';
    let info: HistoryInfo = {
        undoCount: 0,
        redoCount: 0,
        nextUndo: null,
        nextRedo: null,
    };
    /** >0 while carrying out the orchestrator's instruction, so the local
     *  history changes that causes are not reported back as new steps. */
    let applying = 0;
    let lastUndoCount = 0;

    const setInfo = (next: HistoryInfo) => {
        info = next;
        for (const listener of listeners) {
            listener(info);
        }
    };

    void transport.label().then((value) => {
        label = value;
    });

    // A rise in the local undo count outside an instruction is a step the
    // user made here; the orchestrator needs it in the global order.
    teardown.push(
        api.onDidChangeHistory((event) => {
            const pushed = event.undoCount > lastUndoCount && applying === 0;
            lastUndoCount = event.undoCount;
            if (pushed) {
                void transport
                    .historyPush(label)
                    .catch((err: unknown) =>
                        log(`historyPush failed: ${String(err)}`)
                    );
            }
        }).dispose
    );

    const guarded = (what: string, fn: () => void) => {
        applying += 1;
        try {
            fn();
        } catch (err: unknown) {
            log(`${what} failed: ${String(err)}`);
        } finally {
            applying -= 1;
            lastUndoCount = api.canUndo ? lastUndoCount : 0;
        }
    };

    void transport
        .onApplyLayout((layout) => {
            guarded('apply', () => {
                api.fromJSON(layout, { reuseExistingPanels: true });
                log(`applied a layout with ${api.panels.length} panel(s)`);
            });
        })
        .then((unlisten) => teardown.push(unlisten));
    void transport
        .onUndoRequest(() => {
            guarded('local undo', () => {
                api.undo();
                log('undid a local step');
            });
        })
        .then((unlisten) => teardown.push(unlisten));
    void transport
        .onRedoRequest(() => {
            guarded('local redo', () => {
                api.redo();
                log('redid a local step');
            });
        })
        .then((unlisten) => teardown.push(unlisten));
    void transport
        .onHistoryChanged((next) => setInfo(next))
        .then((unlisten) => teardown.push(unlisten));
    void transport.historyInfo().then((next) => {
        if (next) {
            setInfo(next);
        }
    });

    const undo = () => {
        void transport
            .undo()
            .catch((err: unknown) => log(`undo: ${String(err)}`));
    };
    const redo = () => {
        void transport
            .redo()
            .catch((err: unknown) => log(`redo: ${String(err)}`));
    };

    if (options.bindKeys) {
        const onKeyDown = (event: KeyboardEvent) => {
            const modifier = event.ctrlKey || event.metaKey;
            if (!modifier || event.altKey) {
                return;
            }
            const key = event.key.toLowerCase();
            if (key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            } else if ((key === 'z' && event.shiftKey) || key === 'y') {
                event.preventDefault();
                redo();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        teardown.push(() => document.removeEventListener('keydown', onKeyDown));
    }

    return {
        undo,
        redo,
        get info() {
            return info;
        },
        onDidChange(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        dispose() {
            for (const fn of teardown.splice(0)) {
                fn();
            }
        },
    };
}
