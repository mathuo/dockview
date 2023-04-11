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
});
