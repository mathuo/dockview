import { Emitter, Event } from '../../events';
import { BranchNode } from '../../gridview/branchNode';
import {
    Gridview,
    IGridView,
    IViewSize,
    SerializedGridview,
    orthogonal,
} from '../../gridview/gridview';
import { Orientation, Sizing } from '../../splitview/splitview';

class MockGridview implements IGridView {
    minimumWidth: number = 0;
    maximumWidth: number = Number.MAX_VALUE;
    minimumHeight: number = 0;
    maximumHeight: number = Number.MAX_VALUE;
    onDidChange: Event<IViewSize | undefined> = new Emitter<
        IViewSize | undefined
    >().event;
    element: HTMLElement = document.createElement('div');

    width: number = 0;
    height: number = 0;

    constructor(private id?: string) {
        this.element.className = 'mock-grid-view';
        this.element.id = `${id ?? ''}`;
    }

    layout(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    toJSON(): object {
        if (this.id) {
            return { id: this.id };
        }
        return {};
    }
}

describe('gridview', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
    });

    test('dispose of gridview', () => {
        expect(container.childNodes.length).toBe(0);

        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );

        container.appendChild(gridview.element);

        expect(container.childNodes.length).toBe(1);

        gridview.dispose();

        expect(container.childNodes.length).toBe(0);
    });

    test('insertOrthogonalSplitviewAtRoot #1', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        gridview.addView(new MockGridview(), Sizing.Distribute, [0]);

        gridview.insertOrthogonalSplitviewAtRoot();

        gridview.addView(new MockGridview(), Sizing.Distribute, [1]);

        gridview.addView(new MockGridview(), Sizing.Distribute, [0, 1]);

        function checkOrientationFlipsAtEachLevel(root: BranchNode) {
            const orientation = root.orientation;
            const orthogonalOrientation = orthogonal(orientation);

            for (const child of root.children) {
                if (child.orientation !== orthogonalOrientation) {
                    fail('child cannot have the same orientation as parent');
                }
                if (child instanceof BranchNode) {
                    checkOrientationFlipsAtEachLevel(child);
                }
            }
        }

        checkOrientationFlipsAtEachLevel((gridview as any).root as BranchNode);
    });

    test('insertOrthogonalSplitviewAtRoot #2', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        gridview.addView(new MockGridview(), Sizing.Distribute, [0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1]);

        gridview.insertOrthogonalSplitviewAtRoot();

        gridview.addView(new MockGridview(), Sizing.Distribute, [1]);

        function checkOrientationFlipsAtEachLevel(root: BranchNode) {
            const orientation = root.orientation;
            const orthogonalOrientation = orthogonal(orientation);

            for (const child of root.children) {
                if (child.orientation !== orthogonalOrientation) {
                    fail('child cannot have the same orientation as parent');
                }
                if (child instanceof BranchNode) {
                    checkOrientationFlipsAtEachLevel(child);
                }
            }
        }

        checkOrientationFlipsAtEachLevel((gridview as any).root as BranchNode);
    });

    test('removeView: remove leaf from branch where branch becomes leaf and parent is root', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        gridview.addView(new MockGridview(), Sizing.Distribute, [0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1]);

        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0]);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: [
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                        ],
                        size: 500,
                        type: 'branch',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(3);

        gridview.removeView([1, 0], Sizing.Distribute);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(2);
    });

    test('removeView: remove leaf from branch where branch remains branch and parent is root', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        gridview.addView(new MockGridview(), Sizing.Distribute, [0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1]);

        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 1]);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: [
                            {
                                data: {},
                                size: 333,
                                type: 'leaf',
                            },
                            {
                                data: {},
                                size: 333,
                                type: 'leaf',
                            },
                            {
                                data: {},
                                size: 334,
                                type: 'leaf',
                            },
                        ],
                        size: 500,
                        type: 'branch',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(4);

        gridview.removeView([1, 0], Sizing.Distribute);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: [
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                        ],
                        size: 500,
                        type: 'branch',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(3);
    });

    test('removeView: remove leaf where parent is root', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        gridview.addView(new MockGridview(), Sizing.Distribute, [0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1]);

        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0]);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: [
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                        ],
                        size: 500,
                        type: 'branch',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(3);

        gridview.removeView([0], Sizing.Distribute);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'VERTICAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(2);
    });

    test('removeView: remove leaf from branch where branch becomes leaf and parent is not root', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        gridview.addView(new MockGridview(), Sizing.Distribute, [0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1]);

        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0, 0]);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: [
                            {
                                data: [
                                    {
                                        data: {},
                                        size: 250,
                                        type: 'leaf',
                                    },
                                    {
                                        data: {},
                                        size: 250,
                                        type: 'leaf',
                                    },
                                ],
                                size: 500,
                                type: 'branch',
                            },
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                        ],
                        size: 500,
                        type: 'branch',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(4);

        gridview.removeView([1, 0, 0], Sizing.Distribute);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: [
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                        ],
                        size: 500,
                        type: 'branch',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(3);
    });

    test('removeView: remove leaf from branch where branch remains branch and parent is not root', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        gridview.addView(new MockGridview(), Sizing.Distribute, [0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1]);

        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0, 0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0, 1]);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: [
                            {
                                data: [
                                    {
                                        data: {},
                                        size: 166,
                                        type: 'leaf',
                                    },
                                    {
                                        data: {},
                                        size: 166,
                                        type: 'leaf',
                                    },
                                    {
                                        data: {},
                                        size: 168,
                                        type: 'leaf',
                                    },
                                ],
                                size: 500,
                                type: 'branch',
                            },
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                        ],
                        size: 500,
                        type: 'branch',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(5);

        gridview.removeView([1, 0, 1], Sizing.Distribute);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: [
                            {
                                data: [
                                    {
                                        data: {},
                                        size: 250,
                                        type: 'leaf',
                                    },
                                    {
                                        data: {},
                                        size: 250,
                                        type: 'leaf',
                                    },
                                ],
                                size: 500,
                                type: 'branch',
                            },
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                        ],
                        size: 500,
                        type: 'branch',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(4);
    });

    test('removeView: remove leaf where parent is root', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        gridview.addView(new MockGridview(), Sizing.Distribute, [0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1]);

        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0, 0]);
        gridview.addView(new MockGridview(), Sizing.Distribute, [1, 0, 1]);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: [
                            {
                                data: [
                                    {
                                        data: {},
                                        size: 166,
                                        type: 'leaf',
                                    },
                                    {
                                        data: {},
                                        size: 166,
                                        type: 'leaf',
                                    },
                                    {
                                        data: {},
                                        size: 168,
                                        type: 'leaf',
                                    },
                                ],
                                size: 500,
                                type: 'branch',
                            },
                            {
                                data: {},
                                size: 500,
                                type: 'leaf',
                            },
                        ],
                        size: 500,
                        type: 'branch',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(5);

        gridview.removeView([1, 1], Sizing.Distribute);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [
                    {
                        data: {},
                        size: 500,
                        type: 'leaf',
                    },
                    {
                        data: {},
                        size: 166,
                        type: 'leaf',
                    },
                    {
                        data: {},
                        size: 166,
                        type: 'leaf',
                    },
                    {
                        data: {},
                        size: 168,
                        type: 'leaf',
                    },
                ],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
        expect(
            gridview.element.querySelectorAll('.mock-grid-view').length
        ).toBe(4);
    });

    test('that calling insertOrthogonalSplitviewAtRoot() for an empty view doesnt add any nodes', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'HORIZONTAL',
            root: {
                data: [],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });

        gridview.insertOrthogonalSplitviewAtRoot();

        expect(gridview.serialize()).toEqual({
            height: 1000,
            orientation: 'VERTICAL',
            root: {
                data: [],
                size: 1000,
                type: 'branch',
            },
            width: 1000,
        });
    });

    test('re-structuring deep gridivew where a branchnode becomes of length one and is coverted to a leaf node', () => {
        const gridview = new Gridview(
            false,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        const view1 = new MockGridview('1');
        const view2 = new MockGridview('2');
        const view3 = new MockGridview('3');
        const view4 = new MockGridview('4');
        const view5 = new MockGridview('5');
        const view6 = new MockGridview('6');

        gridview.addView(view1, Sizing.Distribute, [0]);

        gridview.addView(view2, Sizing.Distribute, [1]);
        gridview.addView(view3, Sizing.Distribute, [1, 0]);
        gridview.addView(view4, Sizing.Distribute, [1, 1, 0]);
        gridview.addView(view5, Sizing.Distribute, [1, 1, 0, 0]);
        gridview.addView(view6, Sizing.Distribute, [1, 1, 0, 0, 0]);

        let el = gridview.element.querySelectorAll('.mock-grid-view');
        expect(el.length).toBe(6);

        gridview.remove(view2);

        el = gridview.element.querySelectorAll('.mock-grid-view');
        expect(el.length).toBe(5);
    });

    test('gridview nested proportional layouts', () => {
        const gridview = new Gridview(
            true,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        const view1 = new MockGridview('1');
        const view2 = new MockGridview('2');
        const view3 = new MockGridview('3');
        const view4 = new MockGridview('4');
        const view5 = new MockGridview('5');
        const view6 = new MockGridview('6');

        gridview.addView(view1, Sizing.Distribute, [0]);
        gridview.addView(view2, Sizing.Distribute, [1]);
        gridview.addView(view3, Sizing.Distribute, [1, 1]);
        gridview.addView(view4, Sizing.Distribute, [1, 1, 0]);
        gridview.addView(view5, Sizing.Distribute, [1, 1, 0, 0]);
        gridview.addView(view6, Sizing.Distribute, [1, 1, 0, 0, 0]);

        const views = [view1, view2, view3, view4, view5, view6];

        const dimensions = [
            { width: 500, height: 1000 },
            { width: 500, height: 500 },
            { width: 250, height: 500 },
            { width: 250, height: 250 },
            { width: 125, height: 250 },
            { width: 125, height: 250 },
        ];

        expect(
            views.map((view) => ({
                width: view.width,
                height: view.height,
            }))
        ).toEqual(dimensions);

        gridview.layout(2000, 1500);

        expect(
            views.map((view) => ({
                width: view.width,
                height: view.height,
            }))
        ).toEqual(
            dimensions.map(({ width, height }) => ({
                width: width * 2,
                height: height * 1.5,
            }))
        );

        gridview.layout(200, 2000);

        expect(
            views.map((view) => ({
                width: view.width,
                height: view.height,
            }))
        ).toEqual(
            dimensions.map(({ width, height }) => ({
                width: width * 0.2,
                height: height * 2,
            }))
        );
    });

    test('that maximizeView retains original dimensions when restored', () => {
        const gridview = new Gridview(
            true,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        const view1 = new MockGridview('1');
        const view2 = new MockGridview('2');
        const view3 = new MockGridview('3');
        const view4 = new MockGridview('4');
        const view5 = new MockGridview('5');
        const view6 = new MockGridview('6');

        gridview.addView(view1, Sizing.Distribute, [0]);
        gridview.addView(view2, Sizing.Distribute, [1]);
        gridview.addView(view3, Sizing.Distribute, [1, 1]);
        gridview.addView(view4, Sizing.Distribute, [1, 1, 0]);
        gridview.addView(view5, Sizing.Distribute, [1, 1, 0, 0]);
        gridview.addView(view6, Sizing.Distribute, [1, 1, 0, 0, 0]);

        /**
         *   _____________________________________________
         *  |                     |                       |
         *  |                     |           2           |
         *  |                     |                       |
         *  |          1          |_______________________|
         *  |                     |         |      4      |
         *  |                     |    3    |_____________|
         *  |                     |         |   5  |   6  |
         *  |_____________________|_________|______|______|
         */

        const views = [view1, view2, view3, view4, view5, view6];

        const dimensions = [
            { width: 500, height: 1000 },
            { width: 500, height: 500 },
            { width: 250, height: 500 },
            { width: 250, height: 250 },
            { width: 125, height: 250 },
            { width: 125, height: 250 },
        ];

        function assertLayout() {
            expect(
                views.map((view) => ({
                    width: view.width,
                    height: view.height,
                }))
            ).toEqual(dimensions);
        }

        // base case assertions
        assertLayout();
        expect(gridview.hasMaximizedView()).toBeFalsy();

        /**
         * maximize each view individually and then return to the standard view
         * checking on each iteration that the original layout dimensions
         * are restored
         */
        for (const view of views) {
            gridview.maximizeView(view);
            expect(gridview.hasMaximizedView()).toBeTruthy();
            gridview.exitMaximizedView();
            assertLayout();
        }
    });

    test('that maximizedView is exited when a views visibility is changed', () => {
        const gridview = new Gridview(
            true,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        const view1 = new MockGridview('1');
        const view2 = new MockGridview('2');
        const view3 = new MockGridview('3');

        gridview.addView(view1, Sizing.Distribute, [0]);
        gridview.addView(view2, Sizing.Distribute, [1]);
        gridview.addView(view3, Sizing.Distribute, [1, 1]);

        expect(gridview.hasMaximizedView()).toBeFalsy();
        gridview.maximizeView(view2);
        expect(gridview.hasMaximizedView()).toBeTruthy();

        gridview.setViewVisible([0], true);
        expect(gridview.hasMaximizedView()).toBeFalsy();
    });

    test('that maximizedView is exited when a view is moved', () => {
        const gridview = new Gridview(
            true,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        const view1 = new MockGridview('1');
        const view2 = new MockGridview('2');
        const view3 = new MockGridview('3');
        const view4 = new MockGridview('4');

        gridview.addView(view1, Sizing.Distribute, [0]);
        gridview.addView(view2, Sizing.Distribute, [1]);
        gridview.addView(view3, Sizing.Distribute, [1, 1]);
        gridview.addView(view4, Sizing.Distribute, [1, 1, 0]);

        expect(gridview.hasMaximizedView()).toBeFalsy();
        gridview.maximizeView(view2);
        expect(gridview.hasMaximizedView()).toBeTruthy();

        gridview.moveView([1, 1], 0, 1);
        expect(gridview.hasMaximizedView()).toBeFalsy();
    });

    test('that maximizedView is exited when a view is added', () => {
        const gridview = new Gridview(
            true,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        const view1 = new MockGridview('1');
        const view2 = new MockGridview('2');
        const view3 = new MockGridview('3');
        const view4 = new MockGridview('4');

        gridview.addView(view1, Sizing.Distribute, [0]);
        gridview.addView(view2, Sizing.Distribute, [1]);
        gridview.addView(view3, Sizing.Distribute, [1, 1]);

        expect(gridview.hasMaximizedView()).toBeFalsy();
        gridview.maximizeView(view2);
        expect(gridview.hasMaximizedView()).toBeTruthy();

        gridview.addView(view4, Sizing.Distribute, [1, 1, 0]);
        expect(gridview.hasMaximizedView()).toBeFalsy();
    });

    test('that maximizedView is exited when a view is removed', () => {
        const gridview = new Gridview(
            true,
            { separatorBorder: '' },
            Orientation.HORIZONTAL
        );
        gridview.layout(1000, 1000);

        const view1 = new MockGridview('1');
        const view2 = new MockGridview('2');
        const view3 = new MockGridview('3');

        gridview.addView(view1, Sizing.Distribute, [0]);
        gridview.addView(view2, Sizing.Distribute, [1]);
        gridview.addView(view3, Sizing.Distribute, [1, 1]);

        expect(gridview.hasMaximizedView()).toBeFalsy();
        gridview.maximizeView(view2);
        expect(gridview.hasMaximizedView()).toBeTruthy();

        gridview.removeView([1, 1]);
        expect(gridview.hasMaximizedView()).toBeFalsy();
    });
});
