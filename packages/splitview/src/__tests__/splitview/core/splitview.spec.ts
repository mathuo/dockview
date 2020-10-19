import { Emitter } from '../../../events';
import {
    IView,
    Orientation,
    Splitview,
} from '../../../splitview/core/splitview';

class Testview implements IView {
    private _element: HTMLElement = document.createElement('div');
    private _size = 0;
    private _orthogonalSize = 0;

    private readonly _onDidChange = new Emitter<number | undefined>();
    readonly onDidChange = this._onDidChange.event;

    get minimumSize() {
        return this._minimumSize;
    }

    get maximumSize() {
        return this._maxiumSize;
    }

    get element() {
        return this._element;
    }

    get size() {
        return this._size;
    }

    get orthogonalSize() {
        return this._orthogonalSize;
    }

    constructor(private _minimumSize: number, private _maxiumSize: number) {}

    layout(size: number, orthogonalSize: number) {
        this._size = size;
        this._orthogonalSize = orthogonalSize;
    }

    setVisible(isVisible: boolean) {}

    dispose() {
        this._onDidChange.dispose();
    }
}

describe('splitview', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.className = 'ab';
    });

    it('has views and sashes', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        splitview.addView(new Testview(50, 100));
        splitview.addView(new Testview(50, 100));
        splitview.addView(new Testview(50, 100));

        const viewQuery = container.querySelectorAll(
            '.split-view-container > .view-container > .view'
        );
        expect(viewQuery.length).toBe(3);
    });
});
