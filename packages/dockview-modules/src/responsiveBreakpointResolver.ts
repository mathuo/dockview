import { ResponsiveBreakpoint } from 'dockview-core';

interface NormalizedBreakpoint {
    name: string;
    maxWidth: number;
    /** Collapse into this breakpoint once width drops to/below here (<= maxWidth). */
    enterAt: number;
    /** Expand out of this breakpoint once width climbs to/above here (>= enterAt). */
    exitAt: number;
}

/**
 * Pure, stateful-input resolver mapping a container width to the active
 * breakpoint, with hysteresis to prevent oscillation.
 *
 * The active breakpoint is the narrowest one whose band the width sits inside.
 * Each breakpoint owns a dead band `[enterAt, exitAt]` around its `maxWidth`
 * boundary: you *collapse* into a narrower breakpoint at `<= enterAt` but only
 * *expand* back out once the width climbs to `>= exitAt`. The gap between them
 * absorbs the width delta a reflow itself introduces, so a collapse can never
 * bounce straight back — the layout-shift feedback loop that plagues single
 * threshold reflow (see `responsive-layout.md` §4.6).
 *
 * It holds no mutable state: the caller passes the previously-active breakpoint
 * name each call, which is what makes the hysteresis direction-aware.
 */
export class BreakpointResolver {
    /** Normalized breakpoints, ordered narrowest -> widest. */
    private readonly breakpoints: NormalizedBreakpoint[];

    constructor(breakpoints: ResponsiveBreakpoint[]) {
        this.breakpoints = breakpoints
            .map((bp) => {
                const enterAt = bp.enterAt ?? bp.maxWidth;
                const exitAt = bp.exitAt ?? bp.maxWidth;
                return {
                    name: bp.name,
                    maxWidth: bp.maxWidth,
                    // enterAt can't exceed the boundary; exitAt can't precede enterAt
                    enterAt: Math.min(enterAt, bp.maxWidth),
                    exitAt: Math.max(exitAt, Math.min(enterAt, bp.maxWidth)),
                };
            })
            .sort((a, b) => a.maxWidth - b.maxWidth);
    }

    /** Configured breakpoint names, narrowest first. */
    get names(): string[] {
        return this.breakpoints.map((b) => b.name);
    }

    /**
     * Resolve the active breakpoint for `width`, honouring hysteresis relative
     * to `currentName` (the previously-active breakpoint, if any). Returns
     * `undefined` only when no breakpoints are configured.
     */
    resolve(width: number, currentName?: string): string | undefined {
        const bps = this.breakpoints;
        if (bps.length === 0) {
            return undefined;
        }

        // Start from the current breakpoint; fall back to the widest for an
        // unknown/undefined name (first run or a stale name).
        let idx = bps.findIndex((b) => b.name === currentName);
        if (idx === -1) {
            idx = bps.length - 1;
        }

        // Expand: leave the current (narrower) breakpoint once the width climbs
        // to/above its exit threshold. The widest breakpoint's exitAt is its
        // (typically Infinite) maxWidth, so this never runs past the end.
        while (idx < bps.length - 1 && width >= bps[idx].exitAt) {
            idx++;
        }

        // Collapse: enter a narrower breakpoint once the width drops to/below
        // its enter threshold.
        while (idx > 0 && width <= bps[idx - 1].enterAt) {
            idx--;
        }

        return bps[idx].name;
    }
}
