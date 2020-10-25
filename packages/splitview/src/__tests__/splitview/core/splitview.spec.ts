import { last } from '../../../array';
import { Emitter } from '../../../events';
import {
    IView,
    Orientation,
    Sizing,
    Splitview,
} from '../../../splitview/core/splitview';

class Testview implements IView {
    private _element: HTMLElement = document.createElement('div');
    private _size = 0;
    private _orthogonalSize = 0;

    private readonly _onDidChange = new Emitter<number | undefined>();
    readonly onDidChange = this._onDidChange.event;

    private readonly _onLayoutCalled = new Emitter<void>();
    readonly onLayoutCalled = this._onLayoutCalled.event;

    private readonly _onRendered = new Emitter<void>();
    readonly onRenderered = this._onRendered.event;

    get minimumSize() {
        return this._minimumSize;
    }

    get maximumSize() {
        return this._maxiumSize;
    }

    get element() {
        this._onRendered.fire();
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
        this._onLayoutCalled.fire();
    }

    fireChangeEvent(value: number | undefined) {
        this._onDidChange.fire(value);
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

    test('vertical splitview', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        expect(splitview.orientation).toBe(Orientation.HORIZONTAL);

        const viewQuery = container.querySelectorAll(
            '.split-view-container horizontal'
        );
        expect(viewQuery).toBeTruthy();

        splitview.dispose();
    });

    test('horiziontal splitview', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.VERTICAL,
        });

        expect(splitview.orientation).toBe(Orientation.VERTICAL);

        const viewQuery = container.querySelectorAll(
            '.split-view-container vertical'
        );
        expect(viewQuery).toBeTruthy();

        splitview.dispose();
    });

    test('has views and sashes', () => {
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

        splitview.dispose();
    });

    test('calls lifecycle methods on view', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        splitview.layout(200, 500);

        let rendered = false;
        let layout = false;

        const view = new Testview(50, Number.POSITIVE_INFINITY);
        const layoutDisposable = view.onLayoutCalled(() => {
            layout = true;
        });
        const renderDisposable = view.onRenderered(() => {
            rendered = true;
        });

        splitview.addView(view);

        splitview.layout(100, 100);

        expect(rendered).toBeTruthy();
        expect(layout).toBeTruthy();

        layoutDisposable.dispose();
        renderDisposable.dispose();
        splitview.dispose();
    });

    test('add view at specified index', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        splitview.layout(200, 500);

        const view1 = new Testview(50, 200);
        const view2 = new Testview(50, 200);
        const view3 = new Testview(50, 200);

        splitview.addView(view1);
        splitview.addView(view2, Sizing.Distribute, 0);
        splitview.addView(view3, Sizing.Distribute, 1);

        expect(splitview.getViews()).toEqual([view2, view3, view1]);
    });

    test('streches to viewport', () => {
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

        splitview.dispose();
    });

    test('can resize views 1', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        splitview.layout(200, 500);

        const view1 = new Testview(50, 200);
        const view2 = new Testview(50, 200);

        splitview.addView(view1);
        splitview.addView(view2);

        expect(view1.size).toBe(100);
        expect(view2.size).toBe(100);

        view1.fireChangeEvent(65);

        expect(view1.size).toBe(65);
        expect(view2.size).toBe(135);

        view2.fireChangeEvent(75);

        expect(view1.size).toBe(125);
        expect(view2.size).toBe(75);

        view2.fireChangeEvent(undefined);

        expect(view1.size).toBe(125);
        expect(view2.size).toBe(75);

        splitview.dispose();
    });

    test('can resize views 2', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        const view1 = new Testview(50, 200);
        const view2 = new Testview(50, 200);
        const view3 = new Testview(50, 200);

        splitview.addView(view1);
        splitview.addView(view2);
        splitview.addView(view3);

        splitview.layout(200, 500);

        expect([view1.size, view2.size, view3.size]).toEqual([67, 67, 66]);

        splitview.resizeView(1, 100);
        expect([view1.size, view2.size, view3.size]).toEqual([50, 100, 50]);

        splitview.resizeView(2, 60);
        expect([view1.size, view2.size, view3.size]).toEqual([50, 90, 60]);

        expect([
            splitview.getViewSize(0),
            splitview.getViewSize(1),
            splitview.getViewSize(2),
            splitview.getViewSize(3),
        ]).toEqual([50, 90, 60, -1]);

        splitview.dispose();
    });

    test('has zero size before initial layout is called', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        const view1 = new Testview(50, 200);
        const view2 = new Testview(50, 200);
        const view3 = new Testview(50, 200);

        splitview.addView(view1);
        splitview.addView(view2);
        splitview.addView(view3);

        splitview.layout(200, 500);

        expect([view1.size, view2.size, view3.size]).toEqual([67, 67, 66]);

        splitview.dispose();
    });
});
