import {
    Tabs,
    computeStickyOffsets,
} from '../../../../dockview/components/titlebar/tabs';
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

/** jsdom has no layout — stub each tab's measured width. */
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

function stickyOffset(tabs: Tabs, id: string): string | undefined {
    const tab = tabs.tabs.find((t) => t.panel.id === id)!;
    const el = tab.element;
    if (!el.classList.contains('dv-tab--pinned-sticky')) {
        return undefined;
    }
    return el.style.getPropertyValue('--dv-pinned-sticky-left');
}

describe('computeStickyOffsets', () => {
    test('cumulative left offsets over the pinned widths', () => {
        expect(computeStickyOffsets([])).toEqual([]);
        expect(computeStickyOffsets([100])).toEqual([0]);
        expect(computeStickyOffsets([100, 80, 60])).toEqual([0, 100, 180]);
    });
});

describe('tabs — sticky pinned tabs', () => {
    test('setPinnedSticky freezes pinned tabs at cumulative offsets', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.openPanel(createMockPanel('b'));
        tabs.openPanel(createMockPanel('c'));

        // a + b are pinned; give them measurable widths.
        tabs.setOverflowExclude((id) => id === 'a' || id === 'b');
        giveWidth(tabs, 'a', 100);
        giveWidth(tabs, 'b', 80);

        tabs.setPinnedSticky(true);

        expect(stickyOffset(tabs, 'a')).toBe('0px');
        expect(stickyOffset(tabs, 'b')).toBe('100px');
        // The unpinned tab is never sticky.
        expect(stickyOffset(tabs, 'c')).toBeUndefined();
        tabs.element.remove();
    });

    test('disabling clears the sticky styling', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.setOverflowExclude((id) => id === 'a');
        giveWidth(tabs, 'a', 100);
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
        giveWidth(tabs, 'a', 100);
        giveWidth(tabs, 'b', 80);
        tabs.setPinnedSticky(true);
        expect(stickyOffset(tabs, 'b')).toBe('100px');

        // 'a' is unpinned — the predicate change fires a recompute, so 'b'
        // becomes the first (and only) pinned tab at offset 0.
        tabs.setOverflowExclude((id) => id === 'b');
        expect(stickyOffset(tabs, 'a')).toBeUndefined();
        expect(stickyOffset(tabs, 'b')).toBe('0px');
        tabs.element.remove();
    });

    test('stays inert while disabled even with excluded tabs', () => {
        const tabs = createTabs();
        tabs.openPanel(createMockPanel('a'));
        tabs.setOverflowExclude((id) => id === 'a');
        giveWidth(tabs, 'a', 100);

        // Never enabled — no sticky styling appears.
        expect(stickyOffset(tabs, 'a')).toBeUndefined();
        tabs.element.remove();
    });
});
