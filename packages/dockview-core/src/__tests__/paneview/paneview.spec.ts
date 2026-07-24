import { CompositeDisposable } from '../../lifecycle';
import { Paneview } from '../../paneview/paneview';
import { IPanePart, PaneviewPanel } from '../../paneview/paneviewPanel';
import { Orientation } from '../../splitview/splitview';

class TestPanel extends PaneviewPanel {
    protected getBodyComponent(): IPanePart {
        return {
            element: document.createElement('div'),
            update: () => {
                //
            },
            dispose: () => {
                //
            },
            init: () => {
                // /
            },
        };
    }

    protected getHeaderComponent(): IPanePart {
        return {
            element: document.createElement('div'),
            update: () => {
                //
            },
            dispose: () => {
                //
            },
            init: () => {
                // /
            },
        };
    }
}

describe('paneview', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.className = 'container';
    });

    test('onDidAddView and onDidRemoveView events', () => {
        const paneview = new Paneview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        const added: PaneviewPanel[] = [];
        const removed: PaneviewPanel[] = [];

        const disposable = new CompositeDisposable(
            paneview.onDidAddView((view) => added.push(view)),
            paneview.onDidRemoveView((view) => removed.push(view))
        );

        const view1 = new TestPanel({
            id: 'id',
            component: 'component',
            headerComponent: 'headerComponent',
            orientation: Orientation.VERTICAL,
            isExpanded: true,
            isHeaderVisible: true,
            headerSize: 22,
            minimumBodySize: 0,
            maximumBodySize: Number.MAX_SAFE_INTEGER,
        });
        const view2 = new TestPanel({
            id: 'id2',
            component: 'component',
            headerComponent: 'headerComponent',
            orientation: Orientation.VERTICAL,
            isExpanded: true,
            isHeaderVisible: true,
            headerSize: 22,
            minimumBodySize: 0,
            maximumBodySize: Number.MAX_SAFE_INTEGER,
        });

        expect(added).toHaveLength(0);
        expect(removed).toHaveLength(0);

        paneview.addPane(view1);
        expect(added).toHaveLength(1);
        expect(removed).toHaveLength(0);
        expect(added[0]).toBe(view1);

        paneview.addPane(view2);
        expect(added).toHaveLength(2);
        expect(removed).toHaveLength(0);
        expect(added[1]).toBe(view2);

        paneview.removePane(0);
        expect(added).toHaveLength(2);
        expect(removed).toHaveLength(1);
        expect(removed[0]).toBe(view1);

        paneview.removePane(0);
        expect(added).toHaveLength(2);
        expect(removed).toHaveLength(2);
        expect(removed[1]).toBe(view2);

        disposable.dispose();
    });

    test('reordering a pane does not leak its expansion-state listener', () => {
        const paneview = new Paneview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        const makePanel = (id: string) =>
            new TestPanel({
                id,
                component: 'component',
                headerComponent: 'headerComponent',
                orientation: Orientation.VERTICAL,
                isExpanded: true,
                isHeaderVisible: true,
                headerSize: 22,
                minimumBodySize: 0,
                maximumBodySize: Number.MAX_SAFE_INTEGER,
            });

        const view1 = makePanel('id1');
        const view2 = makePanel('id2');

        paneview.addPane(view1);
        paneview.addPane(view2);

        // reorder view1 a few times; each move must not leak a listener
        paneview.moveView(0, 1);
        paneview.moveView(1, 0);
        paneview.moveView(0, 1);

        let changes = 0;
        const disposable = paneview.onDidChange(() => changes++);

        // a single expansion toggle should fire exactly one change event, not
        // one-per-leaked-listener (N + 1)
        view1.setExpanded(false);
        expect(changes).toBe(1);

        disposable.dispose();
        paneview.dispose();
    });

    test('dispose of paneview', () => {
        expect(container.childNodes).toHaveLength(0);

        const paneview = new Paneview(container, {
            orientation: Orientation.HORIZONTAL,
        });

        const view1 = new TestPanel({
            id: 'id',
            component: 'component',
            headerComponent: 'headerComponent',
            orientation: Orientation.VERTICAL,
            isExpanded: true,
            isHeaderVisible: true,
            headerSize: 22,
            minimumBodySize: 0,
            maximumBodySize: Number.MAX_SAFE_INTEGER,
        });
        const view2 = new TestPanel({
            id: 'id2',
            component: 'component',
            headerComponent: 'headerComponent',
            orientation: Orientation.VERTICAL,
            isExpanded: true,
            isHeaderVisible: true,
            headerSize: 22,
            minimumBodySize: 0,
            maximumBodySize: Number.MAX_SAFE_INTEGER,
        });

        paneview.addPane(view1);
        paneview.addPane(view2);

        expect(container.childNodes.length).toBeGreaterThan(0);

        paneview.dispose();

        expect(container.childNodes).toHaveLength(0);
    });
});
