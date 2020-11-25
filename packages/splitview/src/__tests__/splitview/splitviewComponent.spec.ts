import { PanelDimensionChangeEvent } from '../../api/api';
import { CompositeDisposable } from '../../lifecycle';
import { Orientation } from '../../splitview/core/splitview';
import { SplitviewComponent } from '../../splitview/splitviewComponent';
import { SplitviewPanel } from '../../splitview/splitviewPanel';

class TestPanel extends SplitviewPanel {
    getComponent() {
        return {
            update: () => {
                //
            },
            dispose: () => {
                //
            },
        };
    }
}

describe('componentSplitview', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.className = 'container';
    });

    test('vertical panels', () => {
        const disposables = new CompositeDisposable();

        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.VERTICAL,
            components: {
                testPanel: TestPanel,
            },
        });

        splitview.layout(600, 400);

        splitview.addPanel({ id: 'panel1', component: 'testPanel' });
        splitview.addPanel({ id: 'panel2', component: 'testPanel' });

        const panel1 = splitview.getPanel('panel1') as SplitviewPanel;
        const panel2 = splitview.getPanel('panel2') as SplitviewPanel;

        let panel1Dimensions: PanelDimensionChangeEvent | undefined;
        disposables.addDisposables(
            panel1.api.onDidDimensionsChange((event) => {
                panel1Dimensions = event;
            })
        );

        let panel2Dimensions: PanelDimensionChangeEvent | undefined;
        disposables.addDisposables(
            panel2.api.onDidDimensionsChange((event) => {
                panel2Dimensions = event;
            })
        );

        expect(panel1Dimensions).toEqual({ width: 600, height: 200 });
        expect(panel2Dimensions).toEqual({ width: 600, height: 200 });

        panel1.api.setSize({ size: 300 });

        expect(panel1Dimensions).toEqual({ width: 600, height: 300 });
        expect(panel2Dimensions).toEqual({ width: 600, height: 100 });

        splitview.layout(200, 600);

        expect(panel1Dimensions).toEqual({ width: 200, height: 450 });
        expect(panel2Dimensions).toEqual({ width: 200, height: 150 });

        disposables.dispose();
        splitview.dispose();
    });

    test('horizontal panels', () => {
        const disposables = new CompositeDisposable();

        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.HORIZONTAL,
            components: {
                testPanel: TestPanel,
            },
        });

        splitview.layout(600, 400);

        splitview.addPanel({ id: 'panel1', component: 'testPanel' });
        splitview.addPanel({ id: 'panel2', component: 'testPanel' });

        const panel1 = splitview.getPanel('panel1') as SplitviewPanel;
        const panel2 = splitview.getPanel('panel2') as SplitviewPanel;

        let panel1Dimensions: PanelDimensionChangeEvent | undefined;
        disposables.addDisposables(
            panel1.api.onDidDimensionsChange((event) => {
                panel1Dimensions = event;
            })
        );

        let panel2Dimensions: PanelDimensionChangeEvent | undefined;
        disposables.addDisposables(
            panel2.api.onDidDimensionsChange((event) => {
                panel2Dimensions = event;
            })
        );

        expect(panel1Dimensions).toEqual({ width: 300, height: 400 });
        expect(panel2Dimensions).toEqual({ width: 300, height: 400 });

        panel1.api.setSize({ size: 200 });

        expect(panel1Dimensions).toEqual({ width: 200, height: 400 });
        expect(panel2Dimensions).toEqual({ width: 400, height: 400 });

        splitview.layout(200, 600);

        expect(panel1Dimensions).toEqual({ width: 67, height: 600 });
        expect(panel2Dimensions).toEqual({ width: 133, height: 600 });

        disposables.dispose();
        splitview.dispose();
    });
});
