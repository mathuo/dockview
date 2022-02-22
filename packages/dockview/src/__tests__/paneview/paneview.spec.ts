import { CompositeDisposable } from '../../lifecycle';
import { Paneview } from '../../paneview/paneview';
import {
    IPaneBodyPart,
    IPaneHeaderPart,
    PaneviewPanel,
} from '../../paneview/paneviewPanel';
import { Orientation } from '../../splitview/core/splitview';

class TestPanel extends PaneviewPanel {
    protected getBodyComponent(): IPaneBodyPart {
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

    protected getHeaderComponent(): IPaneHeaderPart {
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

        const view1 = new TestPanel(
            'id',
            'component',
            'headerComponent',
            Orientation.VERTICAL,
            true,
            true
        );
        const view2 = new TestPanel(
            'id2',
            'component',
            'headerComponent',
            Orientation.VERTICAL,
            true,
            true
        );

        expect(added.length).toBe(0);
        expect(removed.length).toBe(0);

        paneview.addPane(view1);
        expect(added.length).toBe(1);
        expect(removed.length).toBe(0);
        expect(added[0]).toBe(view1);

        paneview.addPane(view2);
        expect(added.length).toBe(2);
        expect(removed.length).toBe(0);
        expect(added[1]).toBe(view2);

        paneview.removePane(0);
        expect(added.length).toBe(2);
        expect(removed.length).toBe(1);
        expect(removed[0]).toBe(view1);

        paneview.removePane(0);
        expect(added.length).toBe(2);
        expect(removed.length).toBe(2);
        expect(removed[1]).toBe(view2);

        disposable.dispose();
    });
});
