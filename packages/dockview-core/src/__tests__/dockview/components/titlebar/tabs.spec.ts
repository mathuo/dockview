import { Tabs } from '../../../../dockview/components/titlebar/tabs';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { IDockviewPanel } from '../../../../dockview/dockviewPanel';
import { fireEvent } from '@testing-library/dom';

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

    describe('fixed panel tab click behaviour', () => {
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
