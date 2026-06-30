import { DockviewComponent, IContentRenderer } from 'dockview-core';
import {
    computePinnedFirstOrder,
    PinnedTabsService,
} from '../pinnedTabsService';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    constructor() {
        this.element.className = 'dv-test-content';
    }
    init(): void {
        // noop
    }
    layout(): void {
        // noop
    }
    dispose(): void {
        // noop
    }
}

/**
 * Pinned tabs (Phase 1 — model + ordering). Pinned tabs render before all
 * unpinned tabs in their group; pin order is stable (pin appends to the pinned
 * block, unpin returns to the start of the unpinned block). Owned by the
 * PinnedTabs module and dormant unless `pinnedTabs.enabled` is set.
 */
describe('pinned tabs — ordering math', () => {
    const isPinnedIn =
        (pinned: string[]) =>
        (id: string): boolean =>
            pinned.includes(id);

    test('pinning one tab moves it to the front', () => {
        expect(
            computePinnedFirstOrder(['a', 'b', 'c'], isPinnedIn(['c']), ['c'])
        ).toEqual(['c', 'a', 'b']);
    });

    test('pinned tabs follow pinnedOrder, not strip order', () => {
        expect(
            computePinnedFirstOrder(
                ['a', 'b', 'c', 'd'],
                isPinnedIn(['b', 'd']),
                ['d', 'b']
            )
        ).toEqual(['d', 'b', 'a', 'c']);
    });

    test('a pinned id missing from pinnedOrder sorts after known ones', () => {
        // `a` is pinned but not in pinnedOrder → ranks last among pinned.
        expect(
            computePinnedFirstOrder(['a', 'b', 'c'], isPinnedIn(['a', 'c']), [
                'c',
            ])
        ).toEqual(['c', 'a', 'b']);
    });

    test('no pinned tabs leaves order untouched', () => {
        expect(
            computePinnedFirstOrder(['a', 'b', 'c'], isPinnedIn([]), [])
        ).toEqual(['a', 'b', 'c']);
    });

    test('unpinned tabs keep their relative order behind the pinned block', () => {
        expect(
            computePinnedFirstOrder(['a', 'b', 'c', 'd'], isPinnedIn(['c']), [
                'c',
            ])
        ).toEqual(['c', 'a', 'b', 'd']);
    });
});

describe('pinned tabs — integration', () => {
    let container: HTMLElement;

    const make = (
        pinnedTabs: DockviewComponent['options']['pinnedTabs']
    ): DockviewComponent => {
        container = document.createElement('div');
        document.body.appendChild(container);
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            pinnedTabs,
        });
        dockview.layout(1000, 1000);
        return dockview;
    };

    afterEach(() => {
        container.remove();
    });

    const threePanels = (dockview: DockviewComponent) => {
        const a = dockview.addPanel({ id: 'a', component: 'default' });
        const b = dockview.addPanel({ id: 'b', component: 'default' });
        const c = dockview.addPanel({ id: 'c', component: 'default' });
        const order = () => a.api.group.model.panels.map((p) => p.id);
        return { a, b, c, order };
    };

    test('pinning reorders the tab so pinned tabs render first', () => {
        const dockview = make({ enabled: true });
        const { c, order } = threePanels(dockview);

        expect(order()).toEqual(['a', 'b', 'c']);

        c.api.setPinned(true);

        expect(c.api.isPinned).toBe(true);
        expect(order()).toEqual(['c', 'a', 'b']);
    });

    test('multiple pinned tabs keep pin order; unpin returns to the unpinned block', () => {
        const dockview = make({ enabled: true });
        const { b, c, order } = threePanels(dockview);

        c.api.setPinned(true);
        b.api.setPinned(true);
        // pinned in pin sequence [c, b], unpinned [a]
        expect(order()).toEqual(['c', 'b', 'a']);

        c.api.setPinned(false);
        // pinned [b]; c re-joins the unpinned block at its front
        expect(c.api.isPinned).toBe(false);
        expect(order()).toEqual(['b', 'c', 'a']);
    });

    test('fires onDidChangePinned (panel) and onDidPanelPinnedChange (component)', () => {
        const dockview = make({ enabled: true });
        const { c } = threePanels(dockview);

        const panelEvents: boolean[] = [];
        const componentEvents: { id: string; isPinned: boolean }[] = [];
        c.api.onDidChangePinned((e) => panelEvents.push(e.isPinned));
        dockview.api.onDidPanelPinnedChange((e) =>
            componentEvents.push({ id: e.panel.id, isPinned: e.isPinned })
        );

        c.api.setPinned(true);
        c.api.setPinned(false);

        expect(panelEvents).toEqual([true, false]);
        expect(componentEvents).toEqual([
            { id: 'c', isPinned: true },
            { id: 'c', isPinned: false },
        ]);
    });

    test('dormant unless enabled: setPinned is a no-op when pinnedTabs is unset', () => {
        const dockview = make(undefined);
        const { c, order } = threePanels(dockview);

        c.api.setPinned(true);

        expect(c.api.isPinned).toBe(false);
        expect(order()).toEqual(['a', 'b', 'c']);
    });

    test('dormant unless enabled: setPinned is a no-op when enabled is false', () => {
        const dockview = make({ enabled: false });
        const { c, order } = threePanels(dockview);

        c.api.setPinned(true);

        expect(c.api.isPinned).toBe(false);
        expect(order()).toEqual(['a', 'b', 'c']);
    });

    test('the active panel survives a pin reorder', () => {
        const dockview = make({ enabled: true });
        const { a, c, order } = threePanels(dockview);

        a.api.setActive();
        expect(a.api.isActive).toBe(true);

        c.api.setPinned(true);

        expect(order()).toEqual(['c', 'a', 'b']);
        expect(a.api.isActive).toBe(true);
    });

    test('pinning feeds the tab strip an overflow-exclusion predicate', () => {
        const dockview = make({ enabled: true });
        const { a, c } = threePanels(dockview);

        const header = a.api.group.model.header;
        const spy = jest.spyOn(header, 'setOverflowExclude');

        c.api.setPinned(true);

        expect(spy).toHaveBeenCalled();
        const predicate = spy.mock.calls[spy.mock.calls.length - 1][0];
        // The pinned tab is excluded from overflow; unpinned tabs are not.
        expect(predicate('c')).toBe(true);
        expect(predicate('a')).toBe(false);

        c.api.setPinned(false);
        const after = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(after('c')).toBe(false);
    });

    test('each group is wired with a clamping drop-index resolver', () => {
        const dockview = make({
            enabled: true,
            togglePinOnCrossBoundaryDrag: false,
        });
        const first = dockview.addPanel({ id: 'first', component: 'default' });
        // Spy on the header prototype before the next group is created so its
        // wiring call is captured.
        const proto = Object.getPrototypeOf(first.api.group.model.header);
        const spy = jest.spyOn(proto, 'setDropIndexResolver');

        const x = dockview.addPanel({
            id: 'x',
            component: 'default',
            position: { direction: 'right' },
        });
        dockview.addPanel({ id: 'y', component: 'default' }); // joins x's group

        expect(spy).toHaveBeenCalled();
        const resolve = spy.mock.calls[spy.mock.calls.length - 1][0] as (
            panelId: string,
            index: number
        ) => number;

        x.api.setPinned(true); // group [x(pinned), y]; boundary for dragging y = 1
        // An unpinned tab cannot land left of the pin boundary.
        expect(resolve('y', 0)).toBe(1);
        // A pinned tab cannot land in the unpinned zone.
        expect(resolve('x', 5)).toBe(0);

        spy.mockRestore();
    });
});

describe('pinned tabs — reorder guard', () => {
    const makeService = (pinnedTabs: unknown): PinnedTabsService => {
        const stub: any = () => ({ dispose() {} });
        return new PinnedTabsService({
            options: { pinnedTabs },
            onDidPanelPinnedChange: stub,
            onDidAddGroup: stub,
            onDidRemoveGroup: stub,
        } as any);
    };

    const grp = (
        panels: { id: string; pinned: boolean; setPinned?: jest.Mock }[]
    ): any => ({
        model: {
            panels: panels.map((p) => ({
                id: p.id,
                api: {
                    isPinned: p.pinned,
                    setPinned: p.setPinned ?? jest.fn(),
                },
            })),
        },
    });

    describe('clamp (togglePinOnCrossBoundaryDrag: false)', () => {
        const svc = makeService({
            enabled: true,
            togglePinOnCrossBoundaryDrag: false,
        });
        const g = grp([
            { id: 'p', pinned: true },
            { id: 'a', pinned: false },
            { id: 'b', pinned: false },
        ]);

        test('an unpinned tab is clamped to the pin boundary', () => {
            expect(svc.resolveDropIndex(g, 'a', 0)).toBe(1);
        });

        test('an unpinned tab inside the unpinned zone is left alone', () => {
            expect(svc.resolveDropIndex(g, 'a', 2)).toBe(2);
        });

        test('a pinned tab is clamped back into the pinned block', () => {
            expect(svc.resolveDropIndex(g, 'p', 2)).toBe(0);
        });

        test('a pinned tab inside the pinned block is left alone', () => {
            expect(svc.resolveDropIndex(g, 'p', 0)).toBe(0);
        });

        test('the boundary excludes the dragged panel (two pinned)', () => {
            const g2 = grp([
                { id: 'p1', pinned: true },
                { id: 'p2', pinned: true },
                { id: 'a', pinned: false },
            ]);
            expect(svc.resolveDropIndex(g2, 'a', 1)).toBe(2);
            expect(svc.resolveDropIndex(g2, 'p1', 2)).toBe(1);
        });

        test('a panel not in the group passes through', () => {
            expect(svc.resolveDropIndex(g, 'missing', 0)).toBe(0);
        });
    });

    test('disabled feature passes the index through unchanged', () => {
        const svc = makeService({ enabled: false });
        const g = grp([
            { id: 'p', pinned: true },
            { id: 'a', pinned: false },
        ]);
        expect(svc.resolveDropIndex(g, 'a', 0)).toBe(0);
    });

    describe('flip (togglePinOnCrossBoundaryDrag: true, default)', () => {
        test('dragging an unpinned tab into the pinned zone pins it', async () => {
            const svc = makeService({ enabled: true });
            const setPinned = jest.fn();
            const g = grp([
                { id: 'p', pinned: true },
                { id: 'a', pinned: false, setPinned },
            ]);

            expect(svc.resolveDropIndex(g, 'a', 0)).toBe(0);
            expect(setPinned).not.toHaveBeenCalled(); // deferred

            await Promise.resolve();
            expect(setPinned).toHaveBeenCalledWith(true);
        });

        test('dragging a pinned tab into the unpinned zone unpins it', async () => {
            const svc = makeService({ enabled: true });
            const setPinned = jest.fn();
            const g = grp([
                { id: 'p', pinned: true, setPinned },
                { id: 'a', pinned: false },
            ]);

            // boundary excluding p = 0; index 1 crosses into the unpinned zone
            expect(svc.resolveDropIndex(g, 'p', 1)).toBe(1);

            await Promise.resolve();
            expect(setPinned).toHaveBeenCalledWith(false);
        });
    });
});
