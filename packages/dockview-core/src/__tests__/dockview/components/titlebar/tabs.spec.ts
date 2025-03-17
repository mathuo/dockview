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
});
