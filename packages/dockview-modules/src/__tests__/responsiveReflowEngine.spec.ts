import { LayoutPriority, SerializedDockview } from 'dockview-core';
import {
    computeGroupPriority,
    deriveLayout,
    diffLayouts,
} from '../responsiveReflowEngine';

/**
 * `[g1(a,b) | g2(c) | g3(d)]` side by side, active group = g1.
 * Priorities are passed in so tests can vary them.
 */
const makeMulti = (
    priorities: {
        g1?: LayoutPriority;
        g2?: LayoutPriority;
        g3?: LayoutPriority;
    } = {},
    activeGroup = 'g1'
): SerializedDockview =>
    ({
        grid: {
            root: {
                type: 'branch',
                data: [
                    {
                        type: 'leaf',
                        size: 300,
                        data: {
                            id: 'g1',
                            views: ['a', 'b'],
                            activeView: 'a',
                            priority: priorities.g1,
                        },
                    },
                    {
                        type: 'leaf',
                        size: 400,
                        data: {
                            id: 'g2',
                            views: ['c'],
                            activeView: 'c',
                            priority: priorities.g2,
                        },
                    },
                    {
                        type: 'leaf',
                        size: 300,
                        data: {
                            id: 'g3',
                            views: ['d'],
                            activeView: 'd',
                            priority: priorities.g3,
                        },
                    },
                ],
            },
            width: 1000,
            height: 500,
            orientation: 'HORIZONTAL',
        },
        panels: {
            a: { id: 'a' },
            b: { id: 'b' },
            c: { id: 'c' },
            d: { id: 'd' },
        },
        activeGroup,
    }) as unknown as SerializedDockview;

const COLLAPSE = [{ kind: 'collapseToTabs' as const }];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rootData = (l: SerializedDockview): any => (l.grid.root as any).data;

const make = (): SerializedDockview =>
    ({
        grid: {
            root: {
                type: 'branch',
                data: [
                    {
                        type: 'leaf',
                        data: { views: ['a'], id: '1' },
                        size: 500,
                    },
                    {
                        type: 'leaf',
                        data: { views: ['b'], id: '2' },
                        size: 500,
                    },
                ],
            },
            width: 1000,
            height: 500,
            orientation: 'HORIZONTAL',
        },
        panels: {
            a: { id: 'a', contentComponent: 'x' },
            b: { id: 'b', contentComponent: 'y' },
        },
        activeGroup: '1',
    }) as unknown as SerializedDockview;

describe('reflow engine (Phase 2 — identity)', () => {
    describe('deriveLayout', () => {
        test('identity: the derived layout is byte-identical to canonical', () => {
            const canonical = make();
            const derived = deriveLayout(canonical, []);
            expect(derived).toEqual(canonical);
        });

        test('returns an independent clone (mutating derived leaves canonical intact)', () => {
            const canonical = make();
            const derived = deriveLayout(canonical, []);

            expect(derived).not.toBe(canonical);
            (derived.grid as { width: number }).width = 1;
            delete derived.panels.a;

            expect(canonical.grid.width).toBe(1000);
            expect(canonical.panels.a).toBeDefined();
        });

        test('rules other than collapseToTabs are identity for now (restack/hide land later)', () => {
            const canonical = make();
            const derived = deriveLayout(canonical, [
                { kind: 'restack' },
                { kind: 'hide' },
            ]);
            expect(derived).toEqual(canonical);
        });
    });

    describe('diffLayouts', () => {
        test('identical layouts produce zero ops (the idempotence guard)', () => {
            const live = make();
            const target = deriveLayout(live, []);
            expect(diffLayouts(live, target)).toEqual([]);
        });

        test('a grid difference is detected', () => {
            const live = make();
            const target = make();
            (target.grid as { width: number }).width = 640;
            expect(diffLayouts(live, target)).toEqual([{ kind: 'replace' }]);
        });

        test('a panels difference is detected', () => {
            const live = make();
            const target = make();
            target.panels.a = { id: 'a', contentComponent: 'changed' } as never;
            expect(diffLayouts(live, target)).toEqual([{ kind: 'replace' }]);
        });

        test('floating/popout differences are ignored (out of reflow scope)', () => {
            const live = make();
            const target = make();
            (target as { floatingGroups: unknown[] }).floatingGroups = [
                { id: 'f' },
            ];
            expect(diffLayouts(live, target)).toEqual([]);
        });
    });
});

describe('reflow engine — Phase 3 (CollapsePass)', () => {
    describe('computeGroupPriority', () => {
        test('Fill outranks High outranks Normal outranks Low', () => {
            const p = (v?: LayoutPriority) =>
                computeGroupPriority({ priority: v }, false);
            expect(p(LayoutPriority.Fill)).toBeGreaterThan(
                p(LayoutPriority.High)
            );
            expect(p(LayoutPriority.High)).toBeGreaterThan(
                p(LayoutPriority.Normal)
            );
            expect(p(LayoutPriority.Normal)).toBeGreaterThan(
                p(LayoutPriority.Low)
            );
            expect(p(undefined)).toBe(p(LayoutPriority.Normal));
        });

        test('the active group gets a tie-break bonus over an equal-priority peer', () => {
            expect(computeGroupPriority({}, true)).toBeGreaterThan(
                computeGroupPriority({}, false)
            );
            // ...but the bonus never lifts Normal above High
            expect(computeGroupPriority({}, true)).toBeLessThan(
                computeGroupPriority({ priority: LayoutPriority.High }, false)
            );
        });
    });

    describe('collapseToTabs', () => {
        test('folds side-by-side groups into a single tabbed group', () => {
            const derived = deriveLayout(makeMulti(), COLLAPSE);
            expect(derived.grid.root.type).toBe('leaf');
            expect(rootData(derived).views).toHaveLength(4);
        });

        test('orders tabs by priority (Fill first), document order breaking ties', () => {
            // g2 = Fill, g1/g3 = Normal; active = g1 (bonus lifts it over g3)
            const derived = deriveLayout(
                makeMulti({ g2: LayoutPriority.Fill }),
                COLLAPSE
            );
            // g2(c) first (Fill), then g1(a,b) (Normal+active), then g3(d)
            expect(rootData(derived).views).toEqual(['c', 'a', 'b', 'd']);
        });

        test('the highest-priority group is the host (its id survives)', () => {
            const derived = deriveLayout(
                makeMulti({ g2: LayoutPriority.Fill }),
                COLLAPSE
            );
            expect(rootData(derived).id).toBe('g2');
            expect(derived.activeGroup).toBe('g2');
        });

        test('keeps the user on the globally-active panel', () => {
            // active group g1, active panel 'a' — even though g2(Fill) is host
            const derived = deriveLayout(
                makeMulti({ g2: LayoutPriority.Fill }, 'g1'),
                COLLAPSE
            );
            expect(rootData(derived).activeView).toBe('a');
        });

        test('a single-group layout is unchanged (nothing to fold)', () => {
            const single = {
                grid: {
                    root: {
                        type: 'leaf',
                        data: { id: 'only', views: ['a'], activeView: 'a' },
                    },
                    width: 800,
                    height: 500,
                    orientation: 'HORIZONTAL',
                },
                panels: { a: { id: 'a' } },
                activeGroup: 'only',
            } as unknown as SerializedDockview;
            expect(deriveLayout(single, COLLAPSE)).toEqual(single);
        });

        test('does not mutate canonical', () => {
            const canonical = makeMulti({ g2: LayoutPriority.Fill });
            const snapshot = JSON.stringify(canonical);
            deriveLayout(canonical, COLLAPSE);
            expect(JSON.stringify(canonical)).toBe(snapshot);
        });

        test('reversible: widening (identity) after a collapse reproduces canonical byte-for-byte', () => {
            const canonical = makeMulti({ g2: LayoutPriority.Fill });
            // collapse (narrow)…
            deriveLayout(canonical, COLLAPSE);
            // …then widen (no rule = identity) re-derives canonical exactly
            const widened = deriveLayout(canonical, []);
            expect(widened).toEqual(canonical);
        });

        test('panels record is carried through untouched', () => {
            const canonical = makeMulti();
            const derived = deriveLayout(canonical, COLLAPSE);
            expect(derived.panels).toEqual(canonical.panels);
        });
    });
});
