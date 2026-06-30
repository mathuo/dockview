// Force every tab to be reported as clipped so `toggleDropdown` would, by
// default, push them all into the overflow set — isolating the effect of the
// overflow-exclusion predicate from jsdom's zero-geometry.
jest.mock('../../../../dom', () => {
    const actual = jest.requireActual('../../../../dom');
    return {
        ...actual,
        isChildEntirelyVisibleWithinParent: jest.fn(() => false),
    };
});

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

describe('tabs — overflow exclusion seam', () => {
    const overflowIds = (tabs: Tabs): string[] => {
        const events: { tabs: string[] }[] = [];
        const sub = tabs.onOverflowTabsChange((e) => events.push(e));
        (tabs as any).toggleDropdown({ reset: false });
        sub.dispose();
        return events[events.length - 1]?.tabs ?? [];
    };

    test('with no predicate every clipped tab is in the overflow set', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));
        tabs.openPanel(createMockPanel('c'));

        expect(overflowIds(tabs)).toEqual(['a', 'b', 'c']);
        tabs.element.remove();
    });

    test('excluded panels never enter the overflow set', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));
        tabs.openPanel(createMockPanel('c'));

        tabs.setOverflowExclude((id) => id === 'b');

        expect(overflowIds(tabs)).toEqual(['a', 'c']);
        tabs.element.remove();
    });

    test('setOverflowExclude recomputes immediately while observing', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));

        const events: { tabs: string[] }[] = [];
        tabs.onOverflowTabsChange((e) => events.push(e));

        tabs.setOverflowExclude((id) => id === 'a');

        // The setter itself fired a recompute (no manual toggleDropdown).
        expect(events[events.length - 1].tabs).toEqual(['b']);
        tabs.element.remove();
    });

    test('resetting the predicate restores default behaviour', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));

        tabs.setOverflowExclude((id) => id === 'a');
        tabs.setOverflowExclude(() => false);

        expect(overflowIds(tabs)).toEqual(['a', 'b']);
        tabs.element.remove();
    });
});
