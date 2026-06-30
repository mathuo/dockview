import { DockviewComponent, IContentRenderer } from 'dockview-core';
import { computePinnedFirstOrder } from '../pinnedTabsService';

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
});
