import { DockviewIDisposable as IDisposable } from 'dockview-core';

/**
 * Minimal clock seam so the debounce is deterministic under test. Defaults to
 * the host `globalThis` timers in production.
 */
export interface SizeObserverClock {
    setTimeout(handler: () => void, ms: number): unknown;
    clearTimeout(handle: unknown): void;
}

/**
 * Debounces the component's raw size signal (`onDidLayoutChange`, already
 * rAF-batched and integer-rounded upstream) so a breakpoint is only resolved
 * once a drag-resize *settles*. Continuous dragging therefore never reflows
 * mid-drag — only on settle — which is the first line of defence against the
 * layout-shift feedback loop (`responsive-layout.md` §4.6).
 *
 * Holds no size state of its own: it reads the current width lazily at settle
 * time via `getWidth`, so it always acts on the latest measurement.
 */
export class SizeObserver implements IDisposable {
    private handle: unknown = undefined;

    constructor(
        private readonly getWidth: () => number,
        private readonly onSettled: (width: number) => void,
        private readonly debounceMs: number,
        private readonly clock: SizeObserverClock = globalThis as SizeObserverClock
    ) {}

    /** Feed a raw size signal; restarts the settle timer. */
    signal(): void {
        if (this.debounceMs <= 0) {
            // no debounce configured — resolve synchronously
            this.cancel();
            this.onSettled(this.getWidth());
            return;
        }
        this.clock.clearTimeout(this.handle);
        this.handle = this.clock.setTimeout(() => {
            this.handle = undefined;
            this.onSettled(this.getWidth());
        }, this.debounceMs);
    }

    /** Resolve any pending signal immediately (e.g. on an explicit reflow). */
    flush(): void {
        if (this.handle !== undefined) {
            this.cancel();
            this.onSettled(this.getWidth());
        }
    }

    /** Whether a debounced signal is waiting to settle. */
    get pending(): boolean {
        return this.handle !== undefined;
    }

    private cancel(): void {
        if (this.handle !== undefined) {
            this.clock.clearTimeout(this.handle);
            this.handle = undefined;
        }
    }

    dispose(): void {
        this.cancel();
    }
}
