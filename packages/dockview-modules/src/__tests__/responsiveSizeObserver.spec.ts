import { SizeObserver, SizeObserverClock } from '../responsiveSizeObserver';

/** Deterministic fake clock with manual advance. */
class FakeClock implements SizeObserverClock {
    private seq = 0;
    private readonly timers = new Map<number, { at: number; fn: () => void }>();
    private now = 0;

    setTimeout(handler: () => void, ms: number): unknown {
        const id = ++this.seq;
        this.timers.set(id, { at: this.now + ms, fn: handler });
        return id;
    }

    clearTimeout(handle: unknown): void {
        if (typeof handle === 'number') {
            this.timers.delete(handle);
        }
    }

    /** Advance time, firing any timers whose deadline has passed. */
    advance(ms: number): void {
        this.now += ms;
        for (const [id, t] of [...this.timers.entries()]) {
            if (t.at <= this.now) {
                this.timers.delete(id);
                t.fn();
            }
        }
    }

    get activeTimers(): number {
        return this.timers.size;
    }
}

describe('SizeObserver', () => {
    test('debounces a burst of signals into a single settle', () => {
        const clock = new FakeClock();
        let width = 1000;
        const settled: number[] = [];
        const obs = new SizeObserver(
            () => width,
            (w) => settled.push(w),
            120,
            clock
        );

        // a burst of resize signals (e.g. a drag) arriving faster than the window
        obs.signal();
        clock.advance(50);
        width = 900;
        obs.signal();
        clock.advance(50);
        width = 800;
        obs.signal();

        // nothing fired yet — still inside the settle window
        expect(settled).toEqual([]);

        // let it settle
        clock.advance(120);
        expect(settled).toEqual([800]); // fires once, with the latest width
    });

    test('reads the width lazily at settle time', () => {
        const clock = new FakeClock();
        let width = 1000;
        const settled: number[] = [];
        const obs = new SizeObserver(
            () => width,
            (w) => settled.push(w),
            100,
            clock
        );

        obs.signal();
        width = 640; // changes after the signal but before settle
        clock.advance(100);

        expect(settled).toEqual([640]);
    });

    test('flush resolves a pending signal immediately', () => {
        const clock = new FakeClock();
        const settled: number[] = [];
        const obs = new SizeObserver(
            () => 500,
            (w) => settled.push(w),
            120,
            clock
        );

        obs.signal();
        expect(obs.pending).toBe(true);
        obs.flush();

        expect(settled).toEqual([500]);
        expect(obs.pending).toBe(false);
    });

    test('flush is a no-op when nothing is pending', () => {
        const clock = new FakeClock();
        const settled: number[] = [];
        const obs = new SizeObserver(
            () => 500,
            (w) => settled.push(w),
            120,
            clock
        );

        obs.flush();
        expect(settled).toEqual([]);
    });

    test('dispose cancels a pending settle', () => {
        const clock = new FakeClock();
        const settled: number[] = [];
        const obs = new SizeObserver(
            () => 500,
            (w) => settled.push(w),
            120,
            clock
        );

        obs.signal();
        obs.dispose();
        clock.advance(1000);

        expect(settled).toEqual([]);
        expect(clock.activeTimers).toBe(0);
    });

    test('debounceMs <= 0 resolves synchronously', () => {
        const clock = new FakeClock();
        const settled: number[] = [];
        const obs = new SizeObserver(
            () => 777,
            (w) => settled.push(w),
            0,
            clock
        );

        obs.signal();
        expect(settled).toEqual([777]); // no clock advance needed
        expect(clock.activeTimers).toBe(0);
    });

    test('only the final signal in a rapid burst survives (single timer)', () => {
        const clock = new FakeClock();
        const obs = new SizeObserver(
            () => 100,
            () => {},
            120,
            clock
        );

        obs.signal();
        obs.signal();
        obs.signal();

        // each signal cancels the previous timer — never a backlog
        expect(clock.activeTimers).toBe(1);
    });
});
