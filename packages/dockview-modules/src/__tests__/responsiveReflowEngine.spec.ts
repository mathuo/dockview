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

// the single merged group inside the collapsed root (a branch with one leaf)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collapsedGroup = (l: SerializedDockview): any =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l.grid.root as any).data[0].data;

// every leaf node (with `visible` + `data`) in the grid tree
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const leafNodes = (l: SerializedDockview): any[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walk = (n: any): any[] =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        n.type === 'leaf' ? [n] : n.data.flatMap((c: any) => walk(c));
    return walk(l.grid.root);
};

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

        test('an empty rule chain is the identity', () => {
            const canonical = make();
            expect(deriveLayout(canonical, [])).toEqual(canonical);
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
            // the root stays a branch (dockview requires it) with one leaf
            expect(derived.grid.root.type).toBe('branch');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((derived.grid.root as any).data).toHaveLength(1);
            expect(collapsedGroup(derived).views).toHaveLength(4);
        });

        test('orders tabs by priority (Fill first), document order breaking ties', () => {
            // g2 = Fill, g1/g3 = Normal; active = g1 (bonus lifts it over g3)
            const derived = deriveLayout(
                makeMulti({ g2: LayoutPriority.Fill }),
                COLLAPSE
            );
            // g2(c) first (Fill), then g1(a,b) (Normal+active), then g3(d)
            expect(collapsedGroup(derived).views).toEqual(['c', 'a', 'b', 'd']);
        });

        test('the highest-priority group is the host (its id survives)', () => {
            const derived = deriveLayout(
                makeMulti({ g2: LayoutPriority.Fill }),
                COLLAPSE
            );
            expect(collapsedGroup(derived).id).toBe('g2');
            expect(derived.activeGroup).toBe('g2');
        });

        test('keeps the user on the globally-active panel', () => {
            // active group g1, active panel 'a' — even though g2(Fill) is host
            const derived = deriveLayout(
                makeMulti({ g2: LayoutPriority.Fill }, 'g1'),
                COLLAPSE
            );
            expect(collapsedGroup(derived).activeView).toBe('a');
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

        test('floating groups pass through the transform (out of reflow scope)', () => {
            const canonical = makeMulti();
            (canonical as { floatingGroups: unknown[] }).floatingGroups = [
                { id: 'f1' },
            ];
            const derived = deriveLayout(canonical, COLLAPSE);
            expect(
                (derived as { floatingGroups: unknown[] }).floatingGroups
            ).toEqual([{ id: 'f1' }]);
        });
    });
});

describe('reflow engine — Phase 5 (RestackPass + HidePass)', () => {
    describe('restack', () => {
        test('flips the primary axis', () => {
            const derived = deriveLayout(makeMulti(), [{ kind: 'restack' }]);
            expect(derived.grid.orientation).toBe('VERTICAL');
        });

        test('is reversible and non-mutating', () => {
            const canonical = makeMulti();
            const snapshot = JSON.stringify(canonical);
            deriveLayout(canonical, [{ kind: 'restack' }]);
            expect(JSON.stringify(canonical)).toBe(snapshot); // untouched
            expect(deriveLayout(canonical, [])).toEqual(canonical); // widen = identity
        });
    });

    describe('hide', () => {
        test('parks Low-priority groups (visible:false), leaves the rest', () => {
            const derived = deriveLayout(
                makeMulti({ g3: LayoutPriority.Low }),
                [{ kind: 'hide' }]
            );
            const nodes = leafNodes(derived);
            expect(nodes.find((n) => n.data.id === 'g3').visible).toBe(false);
            // untouched groups keep their (undefined => visible) state
            expect(
                nodes.find((n) => n.data.id === 'g1').visible
            ).toBeUndefined();
            expect(
                nodes.find((n) => n.data.id === 'g2').visible
            ).toBeUndefined();
        });

        test('never hides the highest-priority group (layout never left empty)', () => {
            const derived = deriveLayout(
                makeMulti(
                    {
                        g1: LayoutPriority.Low,
                        g2: LayoutPriority.Low,
                        g3: LayoutPriority.Low,
                    },
                    'g1'
                ),
                [{ kind: 'hide' }]
            );
            const visible = leafNodes(derived).filter(
                (n) => n.visible !== false
            );
            expect(visible).toHaveLength(1); // the active/top group survives
            expect(visible[0].data.id).toBe('g1');
        });

        test('does not park anything when no group is Low', () => {
            const derived = deriveLayout(makeMulti(), [{ kind: 'hide' }]);
            expect(leafNodes(derived).every((n) => n.visible !== false)).toBe(
                true
            );
        });
    });

    describe('rule chains', () => {
        test('apply in array order (restack then collapseToTabs)', () => {
            const derived = deriveLayout(makeMulti(), [
                { kind: 'restack' },
                { kind: 'collapseToTabs' },
            ]);
            expect(derived.grid.orientation).toBe('VERTICAL'); // restacked
            expect(collapsedGroup(derived).views).toHaveLength(4); // collapsed
        });
    });
});
