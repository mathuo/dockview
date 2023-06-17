import { Emitter, Event } from '../../events';
import { BranchNode } from '../../gridview/branchNode';
import {
    Gridview,
    IGridView,
    IViewSize,
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

    constructor() {
        this.element.className = 'mock-grid-view';
    }

    layout(width: number, height: number): void {
        //
    }

    toJSON(): object {
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
});
