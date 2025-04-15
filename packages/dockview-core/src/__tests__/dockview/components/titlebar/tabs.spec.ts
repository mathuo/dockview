import { fromPartial } from '@total-typescript/shoehorn';
import { Tabs } from '../../../../tabs/tabs';
import { DroptargetOptions } from '../../../../dnd/droptarget';

describe('tabs', () => {
    describe('disableCustomScrollbars', () => {
        test('enabled by default', () => {
            const cut = new Tabs(
                'panel1',
                'group1',
                fromPartial<DroptargetOptions>({}),
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
                'panel1',
                'group1',
                fromPartial<DroptargetOptions>({}),
                {
                    showTabsOverflowControl: true,
                    scrollbars: 'custom',
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
                'panel1',
                'group1',
                fromPartial<DroptargetOptions>({}),
                {
                    showTabsOverflowControl: true,
                    scrollbars: 'native',
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
