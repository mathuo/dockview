import { Tabs } from '../../../../dockview/components/titlebar/tabs';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';

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
            expect(
                tabsList.classList.contains('dv-vertical')
            ).toBeTruthy();
            expect(
                tabsList.classList.contains('dv-horizontal')
            ).toBeFalsy();

            cut.direction = 'horizontal';
            expect(cut.direction).toBe('horizontal');
            expect(
                tabsList.classList.contains('dv-tabs-container-vertical')
            ).toBeFalsy();
            expect(
                tabsList.classList.contains('dv-horizontal')
            ).toBeTruthy();
            expect(
                tabsList.classList.contains('dv-vertical')
            ).toBeFalsy();
        });
    });
});
