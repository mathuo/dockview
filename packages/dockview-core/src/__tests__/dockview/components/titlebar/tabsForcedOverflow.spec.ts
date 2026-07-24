import { Tabs } from '../../../../dockview/components/titlebar/tabs';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { IDockviewPanel } from '../../../../dockview/dockviewPanel';
import { ITabRenderer } from '../../../../dockview/types';
import { IDockviewPanelModel } from '../../../../dockview/dockviewPanelModel';

function createMockPanel(id: string): IDockviewPanel {
    const tabRenderer: ITabRenderer = {
        element: document.createElement('div'),
        init: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn(),
    };
    return fromPartial<IDockviewPanel>({
        id,
        view: fromPartial<IDockviewPanelModel>({ tab: tabRenderer }),
    });
}

function createTabs(): Tabs {
    const accessor = fromPartial<DockviewComponent>({
        id: 'test-accessor-id',
        options: {},
        onDidOptionsChange: jest.fn().mockReturnValue({ dispose: jest.fn() }),
    });
    const group = fromPartial<DockviewGroupPanel>({
        id: 'test-group-id',
        locked: false,
        model: fromPartial({
            canDisplayOverlay: jest.fn().mockReturnValue(true),
            getTabGroupForPanel: jest.fn().mockReturnValue(null),
            getTabGroups: jest.fn().mockReturnValue([]),
        }),
    });
    return new Tabs(group, accessor, { showTabsOverflowControl: true });
}

/**
 * The forced-overflow seam the `MultiRowTabsModule` consumes: it pushes the
 * surplus rows (beyond `overflow.maxRows`) into the dropdown even though nothing
 * clips horizontally in wrap mode. jsdom has zero geometry, so
 * `isChildEntirelyVisibleWithinParent` reports every tab as fully visible, so
 * the default overflow set is empty here, isolating the forcing predicate.
 */
describe('tabs: forced overflow seam', () => {
    const fire = (
        tabs: Tabs,
        reset: boolean
    ): { tabs: string[]; reset: boolean } => {
        const events: { tabs: string[]; reset: boolean }[] = [];
        const sub = tabs.onOverflowTabsChange((e) => events.push(e));
        (tabs as any).toggleDropdown({ reset });
        sub.dispose();
        return events[events.length - 1];
    };

    test('nothing is in the overflow set when nothing clips and nothing is forced', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));

        expect(fire(tabs, false).tabs).toEqual([]);
        tabs.element.remove();
    });

    test('a forced panel enters the overflow set even though nothing clips', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));
        tabs.openPanel(createMockPanel('c'));

        tabs.setForcedOverflow((id) => id === 'b' || id === 'c');

        expect(fire(tabs, false).tabs).toEqual(['b', 'c']);
        tabs.element.remove();
    });

    test('setForcedOverflow recomputes immediately while observing', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));

        const events: { tabs: string[] }[] = [];
        tabs.onOverflowTabsChange((e) => events.push(e));

        tabs.setForcedOverflow((id) => id === 'a');

        // The setter itself fired a recompute (no manual toggleDropdown).
        expect(events[events.length - 1].tabs).toEqual(['a']);
        tabs.element.remove();
    });

    test('forced tabs survive a reset (wrap mode never reports horizontal clip)', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));

        tabs.setForcedOverflow((id) => id === 'b');

        // The `OverflowObserver` reports no overflow in wrap mode and asks for a
        // reset, but the forced set must still be surfaced (as a non-reset fire).
        const event = fire(tabs, true);
        expect(event.tabs).toEqual(['b']);
        expect(event.reset).toBe(false);
        tabs.element.remove();
    });

    test('a plain reset with nothing forced still clears the dropdown', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));

        const event = fire(tabs, true);
        expect(event.tabs).toEqual([]);
        expect(event.reset).toBe(true);
        tabs.element.remove();
    });

    test('exclusion wins over forcing (a pinned surplus tab is not forced out)', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));

        tabs.setOverflowExclude((id) => id === 'b');
        tabs.setForcedOverflow((id) => id === 'b');

        expect(fire(tabs, false).tabs).toEqual([]);
        tabs.element.remove();
    });

    test('clearing the forced predicate restores the empty overflow set', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));

        tabs.setForcedOverflow((id) => id === 'a');
        tabs.setForcedOverflow(() => false);

        expect(fire(tabs, false).tabs).toEqual([]);
        tabs.element.remove();
    });
});
