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

/** jsdom has no layout — stub a tab's `offsetLeft` (its natural in-flow x, the
 *  value the sticky offset is derived from). */
function giveOffset(tabs: Tabs, id: string, offsetLeft: number): void {
    const el = tabs.tabs.find((t) => t.panel.id === id)!.element;
    Object.defineProperty(el, 'offsetLeft', {
        configurable: true,
        get: () => offsetLeft,
    });
}

function stickyOffset(tabs: Tabs, id: string): string | undefined {
    const el = tabs.tabs.find((t) => t.panel.id === id)!.element;
    if (!el.classList.contains('dv-tab--pinned-sticky')) {
        return undefined;
    }
    return el.style.getPropertyValue('--dv-pinned-sticky-left');
}

describe('tabs — sticky pinned tabs', () => {
    test('setPinnedSticky freezes pinned tabs at their natural offsets', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));
        tabs.openPanel(createMockPanel('c'));

        // a + b are pinned; give them natural positions (b sits after a, so its
        // offset carries a's width + any theme margins for free).
        tabs.setOverflowExclude((id) => id === 'a' || id === 'b');
        giveOffset(tabs, 'a', 0);
        giveOffset(tabs, 'b', 108);

        tabs.setPinnedSticky(true);

        expect(stickyOffset(tabs, 'a')).toBe('0px');
        expect(stickyOffset(tabs, 'b')).toBe('108px');
        // The unpinned tab is never sticky.
        expect(stickyOffset(tabs, 'c')).toBeUndefined();
        tabs.element.remove();
    });

    test('disabling clears the sticky styling', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.setOverflowExclude((id) => id === 'a');
        giveOffset(tabs, 'a', 0);
        tabs.setPinnedSticky(true);
        expect(stickyOffset(tabs, 'a')).toBe('0px');

        tabs.setPinnedSticky(false);
        expect(stickyOffset(tabs, 'a')).toBeUndefined();
        const el = tabs.tabs.find((t) => t.panel.id === 'a')!.element;
        expect(el.style.getPropertyValue('--dv-pinned-sticky-left')).toBe('');
        tabs.element.remove();
    });

    test('unpinning a tab clears its sticky styling and re-packs the rest', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));
        tabs.setOverflowExclude((id) => id === 'a' || id === 'b');
        giveOffset(tabs, 'a', 0);
        giveOffset(tabs, 'b', 108);
        tabs.setPinnedSticky(true);
        expect(stickyOffset(tabs, 'b')).toBe('108px');

        // 'a' is unpinned and (in the real strip) 'b' shifts left to the front;
        // the predicate change fires a recompute that reads b's new offset.
        giveOffset(tabs, 'b', 0);
        tabs.setOverflowExclude((id) => id === 'b');
        expect(stickyOffset(tabs, 'a')).toBeUndefined();
        expect(stickyOffset(tabs, 'b')).toBe('0px');
        tabs.element.remove();
    });

    test('stays inert while disabled even with excluded tabs', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.setOverflowExclude((id) => id === 'a');
        giveOffset(tabs, 'a', 0);

        // Never enabled — no sticky styling appears.
        expect(stickyOffset(tabs, 'a')).toBeUndefined();
        tabs.element.remove();
    });
});
