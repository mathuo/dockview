import { SerializedDockview } from 'dockview-core';
import { deriveLayout, diffLayouts } from '../responsiveReflowEngine';

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

        test('rules do not change the identity output in Phase 2', () => {
            const canonical = make();
            const derived = deriveLayout(canonical, [
                { kind: 'collapseToTabs' },
                { kind: 'restack' },
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
