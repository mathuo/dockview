import { Emitter } from '../../events';
import { CompositeDisposable } from '../../lifecycle';
import {
    IView,
    LayoutPriority,
    Orientation,
    Sizing,
    Splitview,
} from '../../splitview/splitview';
import { fireEvent } from '@testing-library/dom';
class Testview implements IView {
    private _element: HTMLElement = document.createElement('div');
    private _size = 0;
    private _orthogonalSize = 0;
    private _priority: LayoutPriority | undefined;

    private readonly _onDidChange = new Emitter<{
        size?: number;
        orthogonalSize?: number;
    }>();
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

    get priority() {
        return this._priority;
    }

    constructor(
        private _minimumSize: number,
        private _maxiumSize: number,
        priority?: LayoutPriority
    ) {
        this._priority = priority;
    }

    layout(size: number, orthogonalSize: number) {
        this._size = size;
        this._orthogonalSize = orthogonalSize;
        this._onLayoutCalled.fire();
    }

    fireChangeEvent(value: { size?: number; orthogonalSize?: number }) {
        this._onDidChange.fire(value);
    }

    setVisible(isVisible: boolean) {
        //
    }

    dispose() {
        this._onDidChange.dispose();
    }
}

describe('splitview', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.className = 'container';
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

    test('visiblity classnames', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        const view1 = new Testview(50, 50);
        const view2 = new Testview(50, 50);

        splitview.addView(view1);
        splitview.addView(view2);

        let viewQuery = container.querySelectorAll(
            '.split-view-container > .view-container > .view.visible'
        );
        expect(viewQuery.length).toBe(2);

        splitview.setViewVisible(1, false);

        viewQuery = container.querySelectorAll(
            '.split-view-container > .view-container > .view.visible'
        );
        expect(viewQuery.length).toBe(1);

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

        view1.fireChangeEvent({ size: 65 });

        expect(view1.size).toBe(65);
        expect(view2.size).toBe(135);

        view2.fireChangeEvent({ size: 75 });

        expect(view1.size).toBe(125);
        expect(view2.size).toBe(75);

        view2.fireChangeEvent({});

        expect(view1.size).toBe(125);
        expect(view2.size).toBe(75);

        splitview.dispose();
    });

    test('can resize views 2', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        splitview.layout(200, 500);

        const view1 = new Testview(50, 200);
        const view2 = new Testview(50, 200);
        const view3 = new Testview(50, 200);

        splitview.addView(view1);
        splitview.addView(view2);
        splitview.addView(view3);

        expect([view1.size, view2.size, view3.size]).toEqual([66, 66, 68]);

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

    test('move view', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        splitview.layout(200, 500);

        const view1 = new Testview(50, 200);
        const view2 = new Testview(50, 200);
        const view3 = new Testview(50, 200);

        splitview.addView(view1);
        splitview.addView(view2);
        splitview.addView(view3);

        expect([view1.size, view2.size, view3.size]).toEqual([66, 66, 68]);

        splitview.moveView(2, 0);
        expect(splitview.getViews()).toEqual([view3, view1, view2]);
        expect([view1.size, view2.size, view3.size]).toEqual([66, 66, 68]);

        splitview.moveView(0, 2);
        expect(splitview.getViews()).toEqual([view1, view2, view3]);
        expect([view1.size, view2.size, view3.size]).toEqual([66, 66, 68]);

        splitview.dispose();
    });

    test('layout called after views added', () => {
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

    test('proportional layout', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        splitview.layout(200, 500);

        const view1 = new Testview(20, Number.POSITIVE_INFINITY);
        const view2 = new Testview(20, Number.POSITIVE_INFINITY);

        splitview.addView(view1);
        splitview.addView(view2);

        expect([view1.size, view2.size]).toEqual([100, 100]);

        splitview.layout(100, 500);

        expect([view1.size, view2.size]).toEqual([50, 50]);

        splitview.dispose();
    });

    test('disable proportional layout', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
        });

        splitview.layout(200, 500);

        const view1 = new Testview(20, Number.POSITIVE_INFINITY);
        const view2 = new Testview(20, Number.POSITIVE_INFINITY);

        splitview.addView(view1);
        splitview.addView(view2);

        expect([view1.size, view2.size]).toEqual([100, 100]);

        splitview.layout(100, 500);

        expect([view1.size, view2.size]).toEqual([80, 20]);

        splitview.dispose();
    });

    test('high priority', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
        });

        splitview.layout(300, 500);

        const view1 = new Testview(50, Number.POSITIVE_INFINITY);
        const view2 = new Testview(
            50,
            Number.POSITIVE_INFINITY,
            LayoutPriority.High
        );
        const view3 = new Testview(50, Number.POSITIVE_INFINITY);

        splitview.addView(view1);
        splitview.addView(view2);
        splitview.addView(view3);

        expect([view1.size, view2.size, view3.size]).toEqual([100, 100, 100]);

        splitview.layout(400, 500);

        expect([view1.size, view2.size, view3.size]).toEqual([100, 200, 100]);

        splitview.dispose();
    });

    test('low priority', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
        });

        splitview.layout(300, 500);

        const view1 = new Testview(
            50,
            Number.POSITIVE_INFINITY,
            LayoutPriority.Low
        );
        const view2 = new Testview(50, Number.POSITIVE_INFINITY);
        const view3 = new Testview(50, Number.POSITIVE_INFINITY);

        splitview.addView(view1);
        splitview.addView(view2);
        splitview.addView(view3);

        expect([view1.size, view2.size, view3.size]).toEqual([100, 100, 100]);

        splitview.layout(400, 500);

        expect([view1.size, view2.size, view3.size]).toEqual([100, 100, 200]);

        splitview.dispose();
    });

    test('from descriptor', () => {
        const descriptor = {
            size: 300,
            views: [
                {
                    size: 80,
                    view: new Testview(0, Number.POSITIVE_INFINITY),
                },
                {
                    size: 100,
                    view: new Testview(0, Number.POSITIVE_INFINITY),
                },
                {
                    size: 120,
                    view: new Testview(0, Number.POSITIVE_INFINITY),
                },
            ],
        };

        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
            descriptor,
        });

        expect([
            descriptor.views[0].size,
            descriptor.views[1].size,
            descriptor.views[2].size,
        ]).toEqual([80, 100, 120]);
        expect(splitview.size).toBe(300);
    });

    test('onDidAddView and onDidRemoveView events', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
        });

        const added: IView[] = [];
        const removed: IView[] = [];

        const disposable = new CompositeDisposable(
            splitview.onDidAddView((view) => added.push(view)),
            splitview.onDidRemoveView((view) => removed.push(view))
        );

        const view1 = new Testview(0, 100);
        const view2 = new Testview(0, 100);

        expect(added.length).toBe(0);
        expect(removed.length).toBe(0);

        splitview.addView(view1);
        expect(added.length).toBe(1);
        expect(removed.length).toBe(0);
        expect(added[0]).toBe(view1);

        splitview.addView(view2);
        expect(added.length).toBe(2);
        expect(removed.length).toBe(0);
        expect(added[1]).toBe(view2);

        splitview.removeView(0);
        expect(added.length).toBe(2);
        expect(removed.length).toBe(1);
        expect(removed[0]).toBe(view1);

        splitview.removeView(0);
        expect(added.length).toBe(2);
        expect(removed.length).toBe(2);
        expect(removed[1]).toBe(view2);

        disposable.dispose();
    });

    test('dispose of splitview', () => {
        expect(container.childNodes.length).toBe(0);

        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
        });

        const view1 = new Testview(0, 100);
        const view2 = new Testview(0, 100);

        splitview.addView(view1);
        splitview.addView(view2);

        expect(container.childNodes.length).toBeGreaterThan(0);

        let anyEvents = false;
        const listener = splitview.onDidRemoveView((e) => {
            anyEvents = true; // disposing of the splitview shouldn't fire onDidRemoveView events
        });

        splitview.dispose();
        listener.dispose();

        expect(anyEvents).toBeFalsy();
        expect(container.childNodes.length).toBe(0);
    });

    test('dnd: mouse events to move sash', () => {
        const splitview = new Splitview(container, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
        });
        splitview.layout(400, 500);

        const view1 = new Testview(0, 1000);
        const view2 = new Testview(0, 1000);

        splitview.addView(view1);
        splitview.addView(view2);

        const sashElement = container
            .getElementsByClassName('sash')
            .item(0) as HTMLElement;

        // validate the expected state before drag
        expect([view1.size, view2.size]).toEqual([200, 200]);
        expect(sashElement).toBeTruthy();
        expect(view1.element.parentElement!.style.pointerEvents).toBe('');
        expect(view2.element.parentElement!.style.pointerEvents).toBe('');

        // start the drag event
        fireEvent.mouseDown(sashElement, { clientX: 50, clientY: 100 });

        // during a sash drag the views should have pointer-events disabled
        expect(view1.element.parentElement!.style.pointerEvents).toBe('none');
        expect(view2.element.parentElement!.style.pointerEvents).toBe('none');

        // expect a delta move of 70 - 50 = 20
        fireEvent.mouseMove(document, { clientX: 70, clientY: 110 });
        expect([view1.size, view2.size]).toEqual([220, 180]);

        // expect a delta move of 75 - 70 = 5
        fireEvent.mouseMove(document, { clientX: 75, clientY: 110 });
        expect([view1.size, view2.size]).toEqual([225, 175]);

        // end the drag event
        fireEvent.mouseUp(document);

        // expect pointer-eventes on views to be restored
        expect(view1.element.parentElement!.style.pointerEvents).toBe('');
        expect(view2.element.parentElement!.style.pointerEvents).toBe('');

        fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
        // expect no additional resizes
        expect([view1.size, view2.size]).toEqual([225, 175]);
    });
});
