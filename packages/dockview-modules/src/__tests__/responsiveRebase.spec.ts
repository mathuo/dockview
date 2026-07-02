import { SerializedDockview } from 'dockview-core';
import { rebaseCanonical } from '../responsiveRebase';

/** Build a horizontal layout from a list of groups. */
const layout = (
    groups: { id: string; views: string[]; active?: string }[],
    activeGroup?: string
): SerializedDockview =>
    ({
        grid: {
            root: {
                type: 'branch',
                data: groups.map((g) => ({
                    type: 'leaf',
                    size: 100,
                    data: {
                        id: g.id,
                        views: g.views,
                        activeView: g.active ?? g.views[0],
                    },
                })),
            },
            width: 1000,
            height: 500,
            orientation: 'HORIZONTAL',
        },
        panels: Object.fromEntries(
            groups.flatMap((g) => g.views.map((v) => [v, { id: v }]))
        ),
        activeGroup: activeGroup ?? groups[0]?.id,
    }) as unknown as SerializedDockview;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const leaves = (l: SerializedDockview): any[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walk = (n: any): any[] =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        n.type === 'leaf' ? [n.data] : n.data.flatMap((c: any) => walk(c));
    return walk(l.grid.root);
};
const ids = (l: SerializedDockview): string[] =>
    leaves(l)
        .flatMap((g) => g.views)
        .sort();

describe('rebaseCanonical', () => {
    test('closing a panel while collapsed removes it from canonical', () => {
        const canonical = layout([
            { id: 'g1', views: ['a', 'b'] },
            { id: 'g2', views: ['c'] },
        ]);
        // derived (collapsed) with 'b' closed
        const live = layout([{ id: 'g1', views: ['a', 'c'] }]);

        const { canonical: next } = rebaseCanonical(canonical, live);
        expect(ids(next)).toEqual(['a', 'c']);
        // the surviving groups keep their structure
        expect(leaves(next).find((g) => g.id === 'g1').views).toEqual(['a']);
        expect(leaves(next).find((g) => g.id === 'g2').views).toEqual(['c']);
        expect(next.panels.b).toBeUndefined();
    });

    test('closing the last panel of a group prunes the empty group', () => {
        const canonical = layout([
            { id: 'g1', views: ['a'] },
            { id: 'g2', views: ['b', 'c'] },
        ]);
        const live = layout([{ id: 'g2', views: ['b', 'c'] }]); // 'a' closed

        const { canonical: next } = rebaseCanonical(canonical, live);
        expect(ids(next)).toEqual(['b', 'c']);
        expect(leaves(next)).toHaveLength(1); // g1 pruned, branch collapsed
        expect(leaves(next)[0].id).toBe('g2');
    });

    test('adding a panel while collapsed inserts it into the active canonical group', () => {
        const canonical = layout(
            [
                { id: 'g1', views: ['a'] },
                { id: 'g2', views: ['b'] },
            ],
            'g2'
        );
        const live = layout([{ id: 'g1', views: ['a', 'b', 'x'] }]); // 'x' added

        const { canonical: next } = rebaseCanonical(canonical, live);
        expect(ids(next)).toEqual(['a', 'b', 'x']);
        // inserted into the active group (g2)
        expect(leaves(next).find((g) => g.id === 'g2').views).toContain('x');
        expect(next.panels.x).toBeDefined();
    });

    test('activating a different tab updates the canonical active group + view', () => {
        const canonical = layout(
            [
                { id: 'g1', views: ['a', 'b'], active: 'a' },
                { id: 'g2', views: ['c'] },
            ],
            'g1'
        );
        // collapsed, user activated 'c'
        const live = layout([
            { id: 'g1', views: ['a', 'b', 'c'], active: 'c' },
        ]);

        const { canonical: next } = rebaseCanonical(canonical, live);
        expect(next.activeGroup).toBe('g2');
        expect(leaves(next).find((g) => g.id === 'g2').activeView).toBe('c');
    });

    test('an unchanged panel set is a no-op', () => {
        const canonical = layout([
            { id: 'g1', views: ['a'] },
            { id: 'g2', views: ['b'] },
        ]);
        const live = layout([{ id: 'g1', views: ['a', 'b'] }]); // same panels
        const { canonical: next, conflict } = rebaseCanonical(canonical, live);
        expect(ids(next)).toEqual(['a', 'b']);
        expect(conflict).toBeUndefined();
    });

    test('does not mutate the input canonical', () => {
        const canonical = layout([
            { id: 'g1', views: ['a', 'b'] },
            { id: 'g2', views: ['c'] },
        ]);
        const snapshot = JSON.stringify(canonical);
        rebaseCanonical(canonical, layout([{ id: 'g1', views: ['a'] }]));
        expect(JSON.stringify(canonical)).toBe(snapshot);
    });

    test('reports a conflict when an added panel has no canonical group to land in', () => {
        const empty = {
            grid: {
                root: { type: 'branch', data: [] },
                width: 1000,
                height: 500,
                orientation: 'HORIZONTAL',
            },
            panels: {},
            activeGroup: undefined,
        } as unknown as SerializedDockview;
        const live = layout([{ id: 'g1', views: ['x'] }]);

        const { conflict } = rebaseCanonical(empty, live);
        expect(conflict).toMatch(/no group/);
    });
});
