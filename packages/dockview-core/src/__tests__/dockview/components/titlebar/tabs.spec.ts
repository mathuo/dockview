import { Tabs } from '../../../../dockview/components/titlebar/tabs';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import {
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../../dnd/dataTransfer';
import { IDockviewPanel } from '../../../../dockview/dockviewPanel';
import { ITabRenderer } from '../../../../dockview/types';
import { IDockviewPanelModel } from '../../../../dockview/dockviewPanelModel';
import { fireEvent } from '@testing-library/dom';
import { createOffsetDragOverEvent } from '../../../__test_utils__/utils';
import { TabDropIndexEvent } from '../../../../dockview/components/titlebar/tabsContainer';

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

function createTabsForDropTest() {
    const accessor = fromPartial<DockviewComponent>({
        id: 'test-accessor-id',
        options: {}, // tabAnimation: undefined = default (no smooth animation)
        onDidOptionsChange: jest.fn().mockReturnValue({ dispose: jest.fn() }),
    });
    const group = fromPartial<DockviewGroupPanel>({
        id: 'test-group-id',
        locked: false,
        model: fromPartial({
            canDisplayOverlay: jest.fn().mockReturnValue(true),
            dropTargetContainer: undefined,
        }),
    });
    const tabs = new Tabs(group, accessor, { showTabsOverflowControl: false });
    return { tabs, accessor, group };
}

function getTabElements(tabs: Tabs): HTMLElement[] {
    return (tabs as any)._tabs.map((t: any) => t.value.element);
}

/**
 * Simulates dragging over one half of a tab, then dropping.
 * Returns the index fired on tabs.onDrop, or undefined if no overlay was shown.
 *
 * The tab elements are mocked to 80×30px. With activationSize=50%, the
 * midpoint is at x=40, so clientX=20 → 'left', clientX=60 → 'right'.
 */
function simulateDropOnTab(
    tabs: Tabs,
    targetTabIndex: number,
    side: 'left' | 'right'
): number | undefined {
    const elements = getTabElements(tabs);
    const targetEl = elements[targetTabIndex];

    jest.spyOn(targetEl, 'offsetWidth', 'get').mockReturnValue(80);
    jest.spyOn(targetEl, 'offsetHeight', 'get').mockReturnValue(30);

    const drops: TabDropIndexEvent[] = [];
    tabs.onDrop((e) => drops.push(e));

    fireEvent.dragEnter(targetEl);
    fireEvent(
        targetEl,
        createOffsetDragOverEvent({
            clientX: side === 'left' ? 20 : 60,
            clientY: 0,
        })
    );

    const dropzone = targetEl.querySelector('.dv-drop-target-dropzone');
    if (!dropzone) {
        return undefined;
    }

    fireEvent.drop(dropzone);
    return drops.length > 0 ? drops[0].index : undefined;
}

describe('tabs', () => {
    describe('disableCustomScrollbars', () => {
        test('enabled by default', () => {
            const cut = new Tabs(
                fromPartial<DockviewGroupPanel>({}),
                fromPartial<DockviewComponent>({
                    options: {},
                }),
                {
                    showTabsOverflowControl: true,
                }
            );

            expect(
                cut.element.querySelectorAll(
                    '.dv-scrollable > .dv-tabs-container'
                ).length
            ).toBe(1);
        });

        test('enabled when disabled flag is false', () => {
            const cut = new Tabs(
                fromPartial<DockviewGroupPanel>({}),
                fromPartial<DockviewComponent>({
                    options: {
                        scrollbars: 'custom',
                    },
                }),
                {
                    showTabsOverflowControl: true,
                }
            );

            expect(
                cut.element.querySelectorAll(
                    '.dv-scrollable > .dv-tabs-container'
                ).length
            ).toBe(1);
        });

        test('disabled when disabled flag is true', () => {
            const cut = new Tabs(
                fromPartial<DockviewGroupPanel>({}),
                fromPartial<DockviewComponent>({
                    options: {
                        scrollbars: 'native',
                    },
                }),
                {
                    showTabsOverflowControl: true,
                }
            );

            expect(
                cut.element.querySelectorAll(
                    '.dv-scrollable > .dv-tabs-container'
                ).length
            ).toBe(0);
        });
    });

    describe('updateDragAndDropState', () => {
        test('that updateDragAndDropState calls updateDragAndDropState on all tabs', () => {
            const cut = new Tabs(
                fromPartial<DockviewGroupPanel>({}),
                fromPartial<DockviewComponent>({
                    options: {},
                }),
                {
                    showTabsOverflowControl: true,
                }
            );

            // Mock tab to verify the method is called
            const mockTab1 = { updateDragAndDropState: jest.fn() };
            const mockTab2 = { updateDragAndDropState: jest.fn() };

            // Add mock tabs to the internal tabs array
            (cut as any)._tabs = [{ value: mockTab1 }, { value: mockTab2 }];

            cut.updateDragAndDropState();

            expect(mockTab1.updateDragAndDropState).toHaveBeenCalledTimes(1);
            expect(mockTab2.updateDragAndDropState).toHaveBeenCalledTimes(1);
        });
    });

    describe('edge panel tab click behaviour', () => {
        function makePanel(id: string): IDockviewPanel {
            return fromPartial<IDockviewPanel>({
                id,
                view: {
                    tab: { element: document.createElement('div') },
                },
            });
        }

        function makeGroup(
            activePanel: IDockviewPanel,
            isCollapsedFn: () => boolean,
            expandMock: jest.Mock,
            collapseMock: jest.Mock,
            openPanelMock: jest.Mock
        ): DockviewGroupPanel {
            return fromPartial<DockviewGroupPanel>({
                activePanel,
                api: {
                    location: { type: 'fixed' },
                    isCollapsed: isCollapsedFn,
                    expand: expandMock,
                    collapse: collapseMock,
                },
                model: {
                    openPanel: openPanelMock,
                    canDisplayOverlay: jest.fn(),
                    dropTargetContainer: undefined,
                },
                locked: false,
            });
        }

        function makeAccessor(): DockviewComponent {
            return fromPartial<DockviewComponent>({
                options: {},
                doSetGroupActive: jest.fn(),
                onDidOptionsChange: jest
                    .fn()
                    .mockReturnValue({ dispose: jest.fn() }),
            });
        }

        test('clicking active tab in collapsed fixed group expands it', () => {
            const panel1 = makePanel('panel1');
            const panel2 = makePanel('panel2');
            const expandMock = jest.fn();
            const collapseMock = jest.fn();
            const openPanelMock = jest.fn();

            const group = makeGroup(
                panel1,
                () => true,
                expandMock,
                collapseMock,
                openPanelMock
            );
            const cut = new Tabs(group, makeAccessor(), {
                showTabsOverflowControl: false,
            });
            cut.openPanel(panel1);
            cut.openPanel(panel2);

            fireEvent.click(cut.tabs[0].element);

            expect(expandMock).toHaveBeenCalledTimes(1);
            expect(collapseMock).not.toHaveBeenCalled();
            expect(openPanelMock).not.toHaveBeenCalled();
        });

        test('clicking active tab in expanded fixed group collapses it', () => {
            const panel1 = makePanel('panel1');
            const panel2 = makePanel('panel2');
            const expandMock = jest.fn();
            const collapseMock = jest.fn();
            const openPanelMock = jest.fn();

            const group = makeGroup(
                panel1,
                () => false,
                expandMock,
                collapseMock,
                openPanelMock
            );
            const cut = new Tabs(group, makeAccessor(), {
                showTabsOverflowControl: false,
            });
            cut.openPanel(panel1);
            cut.openPanel(panel2);

            fireEvent.click(cut.tabs[0].element);

            expect(collapseMock).toHaveBeenCalledTimes(1);
            expect(expandMock).not.toHaveBeenCalled();
            expect(openPanelMock).not.toHaveBeenCalled();
        });

        test('clicking non-active tab in collapsed fixed group activates panel and expands group', () => {
            const panel1 = makePanel('panel1');
            const panel2 = makePanel('panel2');
            const expandMock = jest.fn();
            const collapseMock = jest.fn();
            const openPanelMock = jest.fn();

            const group = makeGroup(
                panel1,
                () => true,
                expandMock,
                collapseMock,
                openPanelMock
            );
            const cut = new Tabs(group, makeAccessor(), {
                showTabsOverflowControl: false,
            });
            cut.openPanel(panel1);
            cut.openPanel(panel2);

            fireEvent.click(cut.tabs[1].element);

            expect(openPanelMock).toHaveBeenCalledWith(panel2);
            expect(expandMock).toHaveBeenCalledTimes(1);
            expect(collapseMock).not.toHaveBeenCalled();
        });

        test('clicking non-active tab in expanded fixed group only activates panel', () => {
            const panel1 = makePanel('panel1');
            const panel2 = makePanel('panel2');
            const expandMock = jest.fn();
            const collapseMock = jest.fn();
            const openPanelMock = jest.fn();

            const group = makeGroup(
                panel1,
                () => false,
                expandMock,
                collapseMock,
                openPanelMock
            );
            const cut = new Tabs(group, makeAccessor(), {
                showTabsOverflowControl: false,
            });
            cut.openPanel(panel1);
            cut.openPanel(panel2);

            fireEvent.click(cut.tabs[1].element);

            expect(openPanelMock).toHaveBeenCalledWith(panel2);
            expect(expandMock).not.toHaveBeenCalled();
            expect(collapseMock).not.toHaveBeenCalled();
        });
    });

    describe('vertical smooth animation drop', () => {
        afterEach(() => {
            LocalSelectionTransfer.getInstance<PanelTransfer>().clearData(
                PanelTransfer.prototype
            );
            jest.restoreAllMocks();
        });

        /**
         * Regression: after the source tab collapses to height:0 in vertical
         * smooth mode, the cursor may be over the empty space in _tabsList rather
         * than over a child tab element. The _tabsList dragover listener must call
         * event.preventDefault() so the browser treats _tabsList as a valid drop
         * target; without it the drop event never fires.
         */
        test('dragover on tab strip calls preventDefault, enabling drop on empty space', () => {
            const accessor = fromPartial<DockviewComponent>({
                id: 'test-accessor-id',
                options: { tabAnimation: 'smooth' },
                onDidOptionsChange: jest
                    .fn()
                    .mockReturnValue({ dispose: jest.fn() }),
            });
            const group = fromPartial<DockviewGroupPanel>({
                id: 'test-group-id',
                locked: false,
                model: fromPartial({
                    canDisplayOverlay: jest.fn().mockReturnValue(true),
                    dropTargetContainer: undefined,
                }),
            });
            const tabs = new Tabs(group, accessor, {
                showTabsOverflowControl: false,
            });
            tabs.direction = 'vertical';

            tabs.openPanel(createMockPanel('panel-a'), 0);
            tabs.openPanel(createMockPanel('panel-b'), 1);
            tabs.openPanel(createMockPanel('panel-c'), 2);

            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [
                    new PanelTransfer(
                        'test-accessor-id',
                        'test-group-id',
                        'panel-a'
                    ),
                ],
                PanelTransfer.prototype
            );

            // Simulate what dragstart sets up
            (tabs as any)._animState = {
                sourceTabId: 'panel-a',
                sourceIndex: 0,
                tabPositions: (tabs as any).snapshotTabPositions(),
                currentInsertionIndex: null,
            };

            const tabsList = (tabs as any)._tabsList as HTMLElement;
            const drops: TabDropIndexEvent[] = [];
            tabs.onDrop((e) => drops.push(e));

            // Fire dragover on _tabsList (empty space where source tab collapsed)
            const dragOverEvent = createOffsetDragOverEvent({
                clientX: 0,
                clientY: 5,
            });
            tabsList.dispatchEvent(dragOverEvent);

            // The fix: preventDefault must have been called so _tabsList is a
            // valid drop target even when the cursor is not over a child tab.
            expect(dragOverEvent.defaultPrevented).toBe(true);

            // drop should now fire and emit the correct index
            fireEvent.drop(tabsList);
            expect(drops.length).toBe(1);
        });
    });

    describe('tab drop index', () => {
        afterEach(() => {
            LocalSelectionTransfer.getInstance<PanelTransfer>().clearData(
                PanelTransfer.prototype
            );
            jest.restoreAllMocks();
        });

        test('same-group: dropping on left half of a tab inserts before it (no source-removal adjustment needed)', () => {
            // [A(0), B(1), C(2)], drag C over left of A → insertionIndex=0, sourceIndex=2
            // 2 < 0 is false → adjustedIndex=0 → openPanel at 0 → [C, A, B]
            const { tabs } = createTabsForDropTest();
            tabs.openPanel(createMockPanel('panel-a'), 0);
            tabs.openPanel(createMockPanel('panel-b'), 1);
            tabs.openPanel(createMockPanel('panel-c'), 2);

            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [
                    new PanelTransfer(
                        'test-accessor-id',
                        'test-group-id',
                        'panel-c'
                    ),
                ],
                PanelTransfer.prototype
            );

            const index = simulateDropOnTab(tabs, 0, 'left');
            expect(index).toBe(0);
        });

        test('same-group: dropping on right half adjusts index for source removal', () => {
            // [A(0), B(1), C(2)], drag A over right of C → insertionIndex=3, sourceIndex=0
            // 0 < 3 → adjustedIndex=2 → remove A then openPanel at 2 → [B, C, A]
            const { tabs } = createTabsForDropTest();
            tabs.openPanel(createMockPanel('panel-a'), 0);
            tabs.openPanel(createMockPanel('panel-b'), 1);
            tabs.openPanel(createMockPanel('panel-c'), 2);

            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [
                    new PanelTransfer(
                        'test-accessor-id',
                        'test-group-id',
                        'panel-a'
                    ),
                ],
                PanelTransfer.prototype
            );

            const index = simulateDropOnTab(tabs, 2, 'right');
            expect(index).toBe(2);
        });

        test('same-group: dropping on left half also adjusts when source is before target', () => {
            // [A(0), B(1), C(2)], drag A over left of C → insertionIndex=2, sourceIndex=0
            // 0 < 2 → adjustedIndex=1 → remove A then openPanel at 1 → [B, A, C]
            const { tabs } = createTabsForDropTest();
            tabs.openPanel(createMockPanel('panel-a'), 0);
            tabs.openPanel(createMockPanel('panel-b'), 1);
            tabs.openPanel(createMockPanel('panel-c'), 2);

            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [
                    new PanelTransfer(
                        'test-accessor-id',
                        'test-group-id',
                        'panel-a'
                    ),
                ],
                PanelTransfer.prototype
            );

            const index = simulateDropOnTab(tabs, 2, 'left');
            expect(index).toBe(1);
        });

        test('cross-group: dropping on left half inserts before target tab', () => {
            // [A(0), B(1), C(2)], external panel over left of B → insertionIndex=1
            // sourceIndex=-1 (not in group) → adjustedIndex=1 → openPanel at 1
            const { tabs } = createTabsForDropTest();
            tabs.openPanel(createMockPanel('panel-a'), 0);
            tabs.openPanel(createMockPanel('panel-b'), 1);
            tabs.openPanel(createMockPanel('panel-c'), 2);

            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [
                    new PanelTransfer(
                        'test-accessor-id',
                        'other-group-id',
                        'panel-x'
                    ),
                ],
                PanelTransfer.prototype
            );

            const index = simulateDropOnTab(tabs, 1, 'left');
            expect(index).toBe(1);
        });

        test('cross-group: dropping on right half inserts after target tab', () => {
            // [A(0), B(1), C(2)], external panel over right of B → insertionIndex=2
            // sourceIndex=-1 → adjustedIndex=2 → openPanel at 2
            const { tabs } = createTabsForDropTest();
            tabs.openPanel(createMockPanel('panel-a'), 0);
            tabs.openPanel(createMockPanel('panel-b'), 1);
            tabs.openPanel(createMockPanel('panel-c'), 2);

            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [
                    new PanelTransfer(
                        'test-accessor-id',
                        'other-group-id',
                        'panel-x'
                    ),
                ],
                PanelTransfer.prototype
            );

            const index = simulateDropOnTab(tabs, 1, 'right');
            expect(index).toBe(2);
        });
    });

    describe('direction', () => {
        test('direction setter toggles CSS classes', () => {
            const cut = new Tabs(
                fromPartial<DockviewGroupPanel>({}),
                fromPartial<DockviewComponent>({
                    options: {},
                }),
                {
                    showTabsOverflowControl: true,
                }
            );

            const tabsList = cut.element.querySelector(
                '.dv-tabs-container'
            ) as HTMLElement;

            expect(tabsList).toBeTruthy();

            // default direction is horizontal
            expect(cut.direction).toBe('horizontal');

            cut.direction = 'vertical';
            expect(cut.direction).toBe('vertical');
            expect(
                tabsList.classList.contains('dv-tabs-container-vertical')
            ).toBeTruthy();
            expect(tabsList.classList.contains('dv-vertical')).toBeTruthy();
            expect(tabsList.classList.contains('dv-horizontal')).toBeFalsy();

            cut.direction = 'horizontal';
            expect(cut.direction).toBe('horizontal');
            expect(
                tabsList.classList.contains('dv-tabs-container-vertical')
            ).toBeFalsy();
            expect(tabsList.classList.contains('dv-horizontal')).toBeTruthy();
            expect(tabsList.classList.contains('dv-vertical')).toBeFalsy();
        });
    });
});
