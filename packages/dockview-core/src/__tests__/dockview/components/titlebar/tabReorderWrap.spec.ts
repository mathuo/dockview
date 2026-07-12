import { fromPartial } from '@total-typescript/shoehorn';
import {
    ITabReorderHost,
    TabReorderController,
} from '../../../../dockview/components/titlebar/tabReorderController';
import { DockviewHeaderDirection } from '../../../../dockview/options';

/**
 * Unit coverage for the 2-D wrapped-strip hit-test
 * (`computeWrappedInsertionIndex`) across both axes: rows for a horizontal
 * header and columns for a vertical header. jsdom has no layout, so each tab's
 * rect is mocked. The full drag flow is exercised e2e; here we pin the pure
 * geometry.
 */
describe('TabReorderController wrapped insertion index', () => {
    type Rect = Pick<
        DOMRect,
        'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'
    >;

    const tab = (id: string, rect: Rect) => ({
        value: {
            panel: { id },
            element: { getBoundingClientRect: () => rect as DOMRect },
        },
    });

    function controllerFor(
        direction: DockviewHeaderDirection,
        tabItems: ReturnType<typeof tab>[]
    ): TabReorderController {
        const host = fromPartial<ITabReorderHost>({
            tabItems: tabItems as any,
            direction,
            tabsList: document.createElement('div'),
        });
        return new TabReorderController(host);
    }

    const call = (c: TabReorderController, x: number, y: number): number =>
        (c as any).computeWrappedInsertionIndex(x, y);

    describe('horizontal header (rows)', () => {
        // two rows of two tabs: row0 (top 0), row1 (top 30)
        const tabs = [
            tab('t0', {
                left: 0,
                right: 50,
                top: 0,
                bottom: 26,
                width: 50,
                height: 26,
            }),
            tab('t1', {
                left: 50,
                right: 100,
                top: 0,
                bottom: 26,
                width: 50,
                height: 26,
            }),
            tab('t2', {
                left: 0,
                right: 50,
                top: 30,
                bottom: 56,
                width: 50,
                height: 26,
            }),
            tab('t3', {
                left: 50,
                right: 100,
                top: 30,
                bottom: 56,
                width: 50,
                height: 26,
            }),
        ];

        test('picks the slot before a tab in the pointed-at row by x-midpoint', () => {
            const c = controllerFor('horizontal', tabs);
            // over row1 (y=40), left of t2's midpoint (x=25) → insert at t2 (2)
            expect(call(c, 10, 40)).toBe(2);
            c.dispose();
        });

        test('past all tabs in a row → after the row last tab', () => {
            const c = controllerFor('horizontal', tabs);
            // over row0 (y=10), past t0/t1 midpoints → after t1 (index 1 + 1)
            expect(call(c, 200, 10)).toBe(2);
            c.dispose();
        });

        test('a between-rows hover snaps to the nearest row, not the last', () => {
            const c = controllerFor('horizontal', tabs);
            // y=27 sits in the inter-row gap (26..30), closer to row0 → left of
            // t0's midpoint → 0
            expect(call(c, 5, 27)).toBe(0);
            c.dispose();
        });
    });

    describe('vertical header (columns)', () => {
        // two columns of two tabs with a gap (50..60): col0 (left 0), col1 (left 60)
        const tabs = [
            tab('t0', {
                left: 0,
                right: 50,
                top: 0,
                bottom: 26,
                width: 50,
                height: 26,
            }),
            tab('t1', {
                left: 0,
                right: 50,
                top: 30,
                bottom: 56,
                width: 50,
                height: 26,
            }),
            tab('t2', {
                left: 60,
                right: 110,
                top: 0,
                bottom: 26,
                width: 50,
                height: 26,
            }),
            tab('t3', {
                left: 60,
                right: 110,
                top: 30,
                bottom: 56,
                width: 50,
                height: 26,
            }),
        ];

        test('picks the slot before a tab in the pointed-at column by y-midpoint', () => {
            const c = controllerFor('vertical', tabs);
            // over col1 (x=80), above t2's midpoint (y=13) → insert at t2 (2)
            expect(call(c, 80, 10)).toBe(2);
            c.dispose();
        });

        test('past all tabs in a column → after the column last tab', () => {
            const c = controllerFor('vertical', tabs);
            // over col0 (x=10), past t0/t1 midpoints (y=200) → after t1 (1 + 1)
            expect(call(c, 10, 200)).toBe(2);
            c.dispose();
        });

        test('a between-columns hover snaps to the nearest column, not the last', () => {
            const c = controllerFor('vertical', tabs);
            // x=53 sits in the inter-column gap (50..60), closer to col0 → above
            // t0's midpoint → 0
            expect(call(c, 53, 5)).toBe(0);
            c.dispose();
        });

        test('empty strip returns the end index', () => {
            const c = controllerFor('vertical', []);
            expect(call(c, 10, 10)).toBe(0);
            c.dispose();
        });
    });
});
