import { BreakpointResolver } from '../responsiveBreakpointResolver';
import { ResponsiveBreakpoint } from 'dockview-core';

describe('BreakpointResolver', () => {
    // widest -> narrowest, as a user would author them
    const BREAKPOINTS: ResponsiveBreakpoint[] = [
        { name: 'lg', maxWidth: Infinity },
        { name: 'md', maxWidth: 1000, exitAt: 1080 },
        { name: 'sm', maxWidth: 640, exitAt: 720 },
    ];

    describe('natural resolution (first run, no current breakpoint)', () => {
        const resolver = new BreakpointResolver(BREAKPOINTS);

        test.each([
            [1500, 'lg'],
            [1001, 'lg'],
            [1000, 'md'],
            [800, 'md'],
            [641, 'md'],
            [640, 'sm'],
            [300, 'sm'],
        ])('width %ipx -> %s', (width, expected) => {
            expect(resolver.resolve(width)).toBe(expected);
        });

        test('exposes names narrowest-first', () => {
            expect(resolver.names).toEqual(['sm', 'md', 'lg']);
        });
    });

    describe('hysteresis', () => {
        const resolver = new BreakpointResolver(BREAKPOINTS);

        test('collapses at enterAt (= maxWidth by default)', () => {
            // coming from md, drop to 640 -> collapses to sm
            expect(resolver.resolve(640, 'md')).toBe('sm');
            // 641 stays md
            expect(resolver.resolve(641, 'md')).toBe('md');
        });

        test('does not expand until exitAt (hysteresis dead band)', () => {
            // in sm, growing back through the dead band [640, 720]
            expect(resolver.resolve(650, 'sm')).toBe('sm');
            expect(resolver.resolve(700, 'sm')).toBe('sm');
            expect(resolver.resolve(719, 'sm')).toBe('sm');
            // only expands at exitAt
            expect(resolver.resolve(720, 'sm')).toBe('md');
        });

        test('the dead band is direction-dependent (sticky to current)', () => {
            // width 700 is inside sm's dead band [640,720]
            expect(resolver.resolve(700, 'sm')).toBe('sm'); // stays collapsed
            expect(resolver.resolve(700, 'md')).toBe('md'); // stays expanded
        });

        test('md has its own dead band [1000, 1080]', () => {
            expect(resolver.resolve(1000, 'lg')).toBe('md'); // collapse lg->md at 1000
            expect(resolver.resolve(1050, 'md')).toBe('md'); // stick in the band
            expect(resolver.resolve(1080, 'md')).toBe('lg'); // expand at exitAt
        });
    });

    describe('multi-level jumps', () => {
        const resolver = new BreakpointResolver(BREAKPOINTS);

        test('collapses across two breakpoints in one step (lg -> sm)', () => {
            expect(resolver.resolve(400, 'lg')).toBe('sm');
        });

        test('expands across two breakpoints in one step (sm -> lg)', () => {
            expect(resolver.resolve(2000, 'sm')).toBe('lg');
        });
    });

    describe('anti-thrash: a reflow-induced width jitter never oscillates', () => {
        const resolver = new BreakpointResolver(BREAKPOINTS);

        test('a small width bounce inside the dead band cannot flip the breakpoint', () => {
            // The container shrinks to 640 and collapses to sm. Collapsing tabs a
            // group, which can nudge the *measured* width back up by a few px.
            // Hysteresis must absorb that so it does not immediately re-expand.
            let bp = resolver.resolve(640, 'md');
            expect(bp).toBe('sm');

            // reflow nudges the measurement up by 40px (still < the 80px band)
            bp = resolver.resolve(680, bp);
            expect(bp).toBe('sm'); // did NOT bounce back to md

            // and settling anywhere in the band stays put
            for (const w of [641, 700, 715, 660]) {
                bp = resolver.resolve(w, bp);
                expect(bp).toBe('sm');
            }
        });

        test('a continuous resize sweep crosses each boundary exactly once per direction', () => {
            const visited: string[] = [];
            let bp: string | undefined;

            // sweep down 1200 -> 300 then back up 300 -> 1200 in 10px steps
            const widths: number[] = [];
            for (let w = 1200; w >= 300; w -= 10) widths.push(w);
            for (let w = 300; w <= 1200; w += 10) widths.push(w);

            for (const w of widths) {
                const next = resolver.resolve(w, bp);
                if (next !== bp) {
                    visited.push(next as string);
                }
                bp = next;
            }

            // Down (lg->md->sm) then up (sm->md->lg): each boundary crossed once
            // per direction, no repeats — i.e. no strobing at any threshold.
            expect(visited).toEqual(['lg', 'md', 'sm', 'md', 'lg']);
        });
    });

    describe('edge cases', () => {
        test('empty breakpoint set resolves to undefined', () => {
            const resolver = new BreakpointResolver([]);
            expect(resolver.resolve(800)).toBeUndefined();
        });

        test('single breakpoint always resolves to itself', () => {
            const resolver = new BreakpointResolver([
                { name: 'only', maxWidth: Infinity },
            ]);
            expect(resolver.resolve(50, 'only')).toBe('only');
            expect(resolver.resolve(5000)).toBe('only');
        });

        test('unordered input is normalized (author order does not matter)', () => {
            const resolver = new BreakpointResolver([
                { name: 'sm', maxWidth: 640 },
                { name: 'lg', maxWidth: Infinity },
                { name: 'md', maxWidth: 1000 },
            ]);
            expect(resolver.resolve(800)).toBe('md');
            expect(resolver.names).toEqual(['sm', 'md', 'lg']);
        });

        test('a stale current name falls back to natural resolution', () => {
            const resolver = new BreakpointResolver(BREAKPOINTS);
            expect(resolver.resolve(800, 'does-not-exist')).toBe('md');
        });

        test('width beyond the widest maxWidth maps to the widest', () => {
            const resolver = new BreakpointResolver([
                { name: 'sm', maxWidth: 640 },
                { name: 'wide', maxWidth: 1200 },
            ]);
            expect(resolver.resolve(99999, 'sm')).toBe('wide');
        });
    });
});
