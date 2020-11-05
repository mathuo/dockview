import { PanelDimensionChangeEvent } from '../../api/api';
import { CompositeDisposable } from '../../lifecycle';
import { PanelUpdateEvent } from '../../panel/types';
import { ComponentPaneview } from '../../paneview/componentPaneview';
import {
    PaneviewPanel,
    IPaneBodyPart,
    IPaneHeaderPart,
    PanePanelComponentInitParameter,
} from '../../paneview/paneviewPanel';

class TestPanel extends PaneviewPanel {
    constructor(id: string, component: string) {
        super(id, component, 'header');
    }

    getHeaderComponent() {
        return new (class Header implements IPaneHeaderPart {
            private _element: HTMLElement = document.createElement('div');

            get element() {
                return this._element;
            }

            init(params: PanePanelComponentInitParameter) {}

            update(params: PanelUpdateEvent) {}

            dispose() {}
        })();
    }

    getBodyComponent() {
        return new (class Header implements IPaneBodyPart {
            private _element: HTMLElement = document.createElement('div');

            get element() {
                return this._element;
            }

            init(params: PanePanelComponentInitParameter) {}

            update(params: PanelUpdateEvent) {}

            dispose() {}
        })();
    }
}

describe('componentPaneview', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.className = 'container';
    });

    test('vertical panels', () => {
        const disposables = new CompositeDisposable();

        const paneview = new ComponentPaneview(container, {
            components: {
                testPanel: TestPanel,
            },
        });

        paneview.layout(600, 400);

        paneview.addPanel({
            id: 'panel1',
            component: 'testPanel',
            title: 'Panel 1',
        });
        paneview.addPanel({
            id: 'panel2',
            component: 'testPanel',
            title: 'Panel2',
        });

        const panel1 = paneview.getPanel('panel1');
        const panel2 = paneview.getPanel('panel2');

        let panel1Dimensions: PanelDimensionChangeEvent;
        disposables.addDisposables(
            panel1.api.onDidDimensionsChange((event) => {
                panel1Dimensions = event;
            })
        );

        let panel2Dimensions: PanelDimensionChangeEvent;
        disposables.addDisposables(
            panel2.api.onDidDimensionsChange((event) => {
                panel2Dimensions = event;
            })
        );

        expect(panel1Dimensions).toEqual({ width: 600, height: 22 });
        expect(panel2Dimensions).toEqual({ width: 600, height: 22 });

        panel1.api.setSize({ size: 300 });

        expect(panel1Dimensions).toEqual({ width: 600, height: 22 });
        expect(panel2Dimensions).toEqual({ width: 600, height: 22 });

        paneview.layout(200, 600);

        expect(panel1Dimensions).toEqual({ width: 200, height: 22 });
        expect(panel2Dimensions).toEqual({ width: 200, height: 22 });

        disposables.dispose();
        paneview.dispose();
    });
});
