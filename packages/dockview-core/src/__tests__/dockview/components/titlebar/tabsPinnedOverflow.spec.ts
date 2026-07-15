// Force every tab to be reported as clipped so `toggleDropdown` treats them as
// overflowing, isolating the pinned-overflow bucket from jsdom's zero-geometry.
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

/** Give a tab element a non-zero layout box so the pinned-overflow width guard
 *  treats it as clipped-but-rendered rather than display:none. */
function giveWidth(tabs: Tabs, id: string, width: number): void {
    const tab = tabs.tabs.find((t) => t.panel.id === id)!;
    tab.element.getBoundingClientRect = () =>
        ({
            width,
            height: 20,
            left: 0,
            top: 0,
            right: width,
            bottom: 20,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }) as DOMRect;
}

describe('tabs: pinned-among-themselves overflow', () => {
    const lastEvent = (
        tabs: Tabs
    ): { tabs: string[]; pinnedTabs: string[] } => {
        const events: { tabs: string[]; pinnedTabs: string[] }[] = [];
        const sub = tabs.onOverflowTabsChange((e) => events.push(e));
        (tabs as any).toggleDropdown({ reset: false });
        sub.dispose();
        return events[events.length - 1];
    };

    test('clipped pinned (excluded) tabs land in pinnedTabs, not tabs', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));
        tabs.openPanel(createMockPanel('c'));

        // a + b are pinned (excluded from the normal overflow set).
        tabs.setOverflowExclude((id) => id === 'a' || id === 'b');
        giveWidth(tabs, 'a', 100);
        giveWidth(tabs, 'b', 100);

        const event = lastEvent(tabs);
        // The unpinned tab overflows normally; the pinned ones are surfaced in
        // the dedicated pinned bucket instead.
        expect(event.tabs).toEqual(['c']);
        expect(event.pinnedTabs).toEqual(['a', 'b']);
        tabs.element.remove();
    });

    test('a zero-width pinned tab (hidden, e.g. separate-row) is not surfaced', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));

        tabs.setOverflowExclude((id) => id === 'a');
        // 'a' keeps jsdom's zero-size box (a display:none main-strip copy).

        const event = lastEvent(tabs);
        expect(event.pinnedTabs).toEqual([]);
        expect(event.tabs).toEqual(['b']);
        tabs.element.remove();
    });

    test('with no exclusion predicate the pinned bucket stays empty', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));
        giveWidth(tabs, 'a', 100);
        giveWidth(tabs, 'b', 100);

        const event = lastEvent(tabs);
        expect(event.pinnedTabs).toEqual([]);
        expect(event.tabs).toEqual(['a', 'b']);
        tabs.element.remove();
    });

    test('a reset clears the pinned bucket', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.setOverflowExclude((id) => id === 'a');
        giveWidth(tabs, 'a', 100);

        const events: { pinnedTabs: string[]; reset: boolean }[] = [];
        const sub = tabs.onOverflowTabsChange((e) => events.push(e));
        (tabs as any).toggleDropdown({ reset: true });
        sub.dispose();

        expect(events[events.length - 1].pinnedTabs).toEqual([]);
        tabs.element.remove();
    });
});
