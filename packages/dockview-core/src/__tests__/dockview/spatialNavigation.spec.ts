import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import { IContentRenderer } from '../../dockview/types';
import { mockGetBoundingClientRect } from '../__test_utils__/utils';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    init(): void {
        // noop
    }
    layout(): void {
        // noop
    }
    dispose(): void {
        // noop
    }
}

/**
 * Spatial group navigation: `adjacentGroupInDirection` and the
 * `group.api.boundingBox` geometry accessor. DOM rects are zero in jsdom, so
 * each group's rect is mocked to lay out a deterministic grid.
 */
describe('spatial group navigation', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    beforeEach(() => {
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });
        dockview.layout(1000, 1000);
    });

    afterEach(() => dockview.dispose());

    function mockRect(
        group: DockviewGroupPanel,
        box: { left: number; top: number; width: number; height: number }
    ) {
        jest.spyOn(group.element, 'getBoundingClientRect').mockImplementation(
            () => mockGetBoundingClientRect(box)
        );
    }

    /** Four groups laid out as a 2x2 grid (mocked geometry). */
    function build2x2() {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        const p2 = dockview.addPanel({
            id: 'p2',
            component: 'default',
            position: { direction: 'right', referencePanel: 'p1' },
        });
        const p3 = dockview.addPanel({
            id: 'p3',
            component: 'default',
            position: { direction: 'below', referencePanel: 'p1' },
        });
        const p4 = dockview.addPanel({
            id: 'p4',
            component: 'default',
            position: { direction: 'below', referencePanel: 'p2' },
        });

        mockRect(p1.group, { left: 0, top: 0, width: 100, height: 100 });
        mockRect(p2.group, { left: 100, top: 0, width: 100, height: 100 });
        mockRect(p3.group, { left: 0, top: 100, width: 100, height: 100 });
        mockRect(p4.group, { left: 100, top: 100, width: 100, height: 100 });

        return {
            topLeft: p1.group,
            topRight: p2.group,
            bottomLeft: p3.group,
            bottomRight: p4.group,
        };
    }

    test('finds the nearest grid group in each direction', () => {
        const { topLeft, topRight, bottomLeft, bottomRight } = build2x2();

        expect(dockview.adjacentGroupInDirection(topLeft, 'right')).toBe(
            topRight
        );
        expect(dockview.adjacentGroupInDirection(topLeft, 'down')).toBe(
            bottomLeft
        );
        expect(dockview.adjacentGroupInDirection(topRight, 'left')).toBe(
            topLeft
        );
        expect(dockview.adjacentGroupInDirection(bottomRight, 'up')).toBe(
            topRight
        );
    });

    test('returns undefined at an edge', () => {
        const { topLeft } = build2x2();

        expect(
            dockview.adjacentGroupInDirection(topLeft, 'left')
        ).toBeUndefined();
        expect(
            dockview.adjacentGroupInDirection(topLeft, 'up')
        ).toBeUndefined();
    });

    test('the DockviewApi surface delegates to the component', () => {
        const { topLeft, topRight } = build2x2();

        expect(dockview.api.adjacentGroupInDirection(topLeft, 'right')).toBe(
            topRight
        );
    });

    test('group.api.boundingBox is relative to the dock root', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });

        jest.spyOn(
            dockview.element,
            'getBoundingClientRect'
        ).mockImplementation(() =>
            mockGetBoundingClientRect({
                left: 10,
                top: 20,
                width: 1000,
                height: 1000,
            })
        );
        mockRect(p1.group, { left: 60, top: 70, width: 100, height: 100 });

        expect(p1.group.api.boundingBox).toEqual({
            left: 50,
            top: 50,
            width: 100,
            height: 100,
        });
    });
});
