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

        splitview.addView(new Testview(50, 50));
        splitview.addView(new Testview(50, 50));
        splitview.addView(new Testview(50, 50));

        let viewQuery = container.querySelectorAll(
            '.split-view-container > .view-container > .view'
        );
        expect(viewQuery.length).toBe(3);

        let sashQuery = container.querySelectorAll(
            '.split-view-container > .sash-container > .sash'
        );
        expect(sashQuery.length).toBe(2);

        splitview.removeView(2);

        viewQuery = container.querySelectorAll(
            '.split-view-container > .view-container > .view'
        );
        expect(viewQuery.length).toBe(2);

        sashQuery = container.querySelectorAll(
            '.split-view-container > .sash-container > .sash'
        );
        expect(sashQuery.length).toBe(1);

        splitview.removeView(0);

        viewQuery = container.querySelectorAll(
            '.split-view-container > .view-container > .view'
        );
        expect(viewQuery.length).toBe(1);

        sashQuery = container.querySelectorAll(
            '.split-view-container > .sash-container > .sash'
        );
        expect(sashQuery.length).toBe(0);

        splitview.removeView(0);

        viewQuery = container.querySelectorAll(
            '.split-view-container > .view-container > .view'
        );
        expect(viewQuery.length).toBe(0);

        sashQuery = container.querySelectorAll(
            '.split-view-container > .sash-container > .sash'
        );
        expect(sashQuery.length).toBe(0);
    });

    it('streches to viewport', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        splitview.layout(200, 500);

        const view = new Testview(50, Number.POSITIVE_INFINITY);

        splitview.addView(view);
        expect(view.size).toBe(200);

        splitview.layout(100, 500);
        expect(view.size).toBe(100);

        splitview.layout(50, 500);
        expect(view.size).toBe(50);

        splitview.layout(30, 500);
        expect(view.size).toBe(50);

        splitview.layout(100, 500);
        expect(view.size).toBe(100);
    });
});
