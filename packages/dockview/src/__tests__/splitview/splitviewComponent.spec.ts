import { PanelDimensionChangeEvent } from '../../api/panelApi';
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

    test('remove panel', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.VERTICAL,
            components: {
                testPanel: TestPanel,
            },
        });
        splitview.layout(600, 400);

        splitview.addPanel({ id: 'panel1', component: 'testPanel' });
        splitview.addPanel({ id: 'panel2', component: 'testPanel' });
        splitview.addPanel({ id: 'panel3', component: 'testPanel' });

        const panel1 = splitview.getPanel('panel1');
        const panel2 = splitview.getPanel('panel2');
        const panel3 = splitview.getPanel('panel3');

        expect(panel1.api.isActive).toBeFalsy();
        expect(panel2.api.isActive).toBeFalsy();
        expect(panel3.api.isActive).toBeTruthy();

        splitview.removePanel(panel3);

        expect(panel1.api.isActive).toBeFalsy();
        expect(panel2.api.isActive).toBeTruthy();
        expect(splitview.length).toBe(2);

        splitview.removePanel(panel1);
        expect(panel2.api.isActive).toBeTruthy();
        expect(splitview.length).toBe(1);

        splitview.removePanel(panel2);
        expect(splitview.length).toBe(0);
    });

    test('horizontal dimensions', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.HORIZONTAL,
            components: {
                testPanel: TestPanel,
            },
        });
        splitview.layout(600, 400);

        expect(splitview.height).toBe(400);
        expect(splitview.width).toBe(600);
    });

    test('vertical dimensions', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.VERTICAL,
            components: {
                testPanel: TestPanel,
            },
        });
        splitview.layout(600, 400);

        expect(splitview.height).toBe(400);
        expect(splitview.width).toBe(600);
    });

    test('api resize', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.VERTICAL,
            components: {
                testPanel: TestPanel,
            },
        });

        splitview.layout(400, 600);
        splitview.addPanel({ id: 'panel1', component: 'testPanel' });
        splitview.addPanel({ id: 'panel2', component: 'testPanel' });
        splitview.addPanel({ id: 'panel3', component: 'testPanel' });

        const panel1 = splitview.getPanel('panel1');
        const panel2 = splitview.getPanel('panel2');
        const panel3 = splitview.getPanel('panel3');

        expect(panel1.width).toBe(400);
        expect(panel1.height).toBe(200);
        expect(panel2.width).toBe(400);
        expect(panel2.height).toBe(200);
        expect(panel3.width).toBe(400);
        expect(panel3.height).toBe(200);

        panel1.api.setSize({ size: 100 });

        expect(panel1.width).toBe(400);
        expect(panel1.height).toBe(100);
        expect(panel2.width).toBe(400);
        expect(panel2.height).toBe(200);
        expect(panel3.width).toBe(400);
        expect(panel3.height).toBe(300);

        panel2.api.setSize({ size: 100 });

        expect(panel1.width).toBe(400);
        expect(panel1.height).toBe(100);
        expect(panel2.width).toBe(400);
        expect(panel2.height).toBe(100);
        expect(panel3.width).toBe(400);
        expect(panel3.height).toBe(400);

        panel3.api.setSize({ size: 100 });

        expect(panel1.width).toBe(400);
        expect(panel1.height).toBe(100);
        expect(panel2.width).toBe(400);
        expect(panel2.height).toBe(400);
        expect(panel3.width).toBe(400);
        expect(panel3.height).toBe(100);
    });

    test('api', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.HORIZONTAL,
            components: {
                testPanel: TestPanel,
            },
        });

        splitview.layout(600, 400);
        splitview.addPanel({ id: 'panel1', component: 'testPanel' });

        const panel1 = splitview.getPanel('panel1');

        expect(panel1!.api.height).toBe(400);
        expect(panel1!.api.width).toBe(600);
        expect(panel1!.api.id).toBe('panel1');
        expect(panel1!.api.isActive).toBeTruthy();
        // expect(panel1?.api.isFocused).toBeFalsy();
        expect(panel1!.api.isVisible).toBeTruthy();

        splitview.addPanel({ id: 'panel2', component: 'testPanel' });

        const panel2 = splitview.getPanel('panel2');

        expect(panel1!.api.isActive).toBeFalsy();

        expect(panel2!.api.height).toBe(400);
        expect(panel2!.api.width).toBe(300);
        expect(panel2!.api.id).toBe('panel2');
        expect(panel2!.api.isActive).toBeTruthy();
        // expect(panel2!.api.isFocused).toBeFalsy();
        expect(panel2!.api.isVisible).toBeTruthy();

        panel1?.api.setActive();

        expect(panel1!.api.isActive).toBeTruthy();
        expect(panel2!.api.isActive).toBeFalsy();
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

    test('serialization', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.VERTICAL,
            components: {
                testPanel: TestPanel,
            },
        });
        splitview.layout(600, 400);

        splitview.fromJSON({
            views: [
                {
                    size: 1,
                    data: { id: 'panel1', component: 'testPanel' },
                    snap: false,
                },
                {
                    size: 2,
                    data: { id: 'panel2', component: 'testPanel' },
                    snap: true,
                },
                { size: 3, data: { id: 'panel3', component: 'testPanel' } },
            ],
            size: 6,
            orientation: Orientation.VERTICAL,
            activeView: 'panel1',
        });

        expect(splitview.length).toBe(3);

        expect(JSON.parse(JSON.stringify(splitview.toJSON()))).toEqual({
            views: [
                {
                    size: 1,
                    data: { id: 'panel1', component: 'testPanel' },
                    snap: false,
                },
                {
                    size: 2,
                    data: { id: 'panel2', component: 'testPanel' },
                    snap: true,
                },
                {
                    size: 3,
                    data: { id: 'panel3', component: 'testPanel' },
                    snap: false,
                },
            ],
            size: 6,
            orientation: Orientation.VERTICAL,
            activeView: 'panel1',
        });
    });

    test('toJSON shouldnt fire any layout events', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.HORIZONTAL,
            components: {
                testPanel: TestPanel,
            },
        });

        splitview.layout(1000, 1000);

        splitview.addPanel({
            id: 'panel1',
            component: 'testPanel',
        });
        splitview.addPanel({
            id: 'panel2',
            component: 'testPanel',
        });

        const disposable = splitview.onDidLayoutChange(() => {
            fail('onDidLayoutChange shouldnt have been called');
        });

        const result = splitview.toJSON();
        expect(result).toBeTruthy();

        disposable.dispose();
    });

    test('dispose of splitviewComponent', () => {
        expect(container.childNodes.length).toBe(0);

        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.HORIZONTAL,
            components: {
                testPanel: TestPanel,
            },
        });

        splitview.layout(1000, 1000);

        splitview.addPanel({
            id: 'panel1',
            component: 'testPanel',
        });
        splitview.addPanel({
            id: 'panel2',
            component: 'testPanel',
        });

        expect(container.childNodes.length).toBeGreaterThan(0);

        splitview.dispose();

        expect(container.childNodes.length).toBe(0);
    });

    test('panel is disposed of when component is disposed', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.HORIZONTAL,
            components: {
                default: TestPanel,
            },
        });

        splitview.layout(1000, 1000);

        splitview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        splitview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        const panel1 = splitview.getPanel('panel1');
        const panel2 = splitview.getPanel('panel2');

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        splitview.dispose();

        expect(panel1Spy).toHaveBeenCalledTimes(1);
        expect(panel2Spy).toHaveBeenCalledTimes(1);
    });

    test('panel is disposed of when removed', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.HORIZONTAL,
            components: {
                default: TestPanel,
            },
        });

        splitview.layout(1000, 1000);

        splitview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        splitview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        const panel1 = splitview.getPanel('panel1');
        const panel2 = splitview.getPanel('panel2');

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        splitview.removePanel(panel2);

        expect(panel1Spy).not.toHaveBeenCalled();
        expect(panel2Spy).toHaveBeenCalledTimes(1);
    });

    test('panel is disposed of when fromJSON is called', () => {
        const splitview = new SplitviewComponent(container, {
            orientation: Orientation.HORIZONTAL,
            components: {
                default: TestPanel,
            },
        });

        splitview.layout(1000, 1000);

        splitview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        splitview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        const panel1 = splitview.getPanel('panel1');
        const panel2 = splitview.getPanel('panel2');

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        splitview.fromJSON({
            orientation: Orientation.HORIZONTAL,
            size: 0,
            views: [],
        });

        expect(panel1Spy).toHaveBeenCalledTimes(1);
        expect(panel2Spy).toHaveBeenCalledTimes(1);
    });
});
