import { PanelDimensionChangeEvent } from '../../api/panelApi';
import { CompositeDisposable } from '../../lifecycle';
import { PanelUpdateEvent } from '../../panel/types';
import { PaneviewComponent } from '../../paneview/paneviewComponent';
import {
    PaneviewPanel,
    IPaneBodyPart,
    IPaneHeaderPart,
    PanePanelComponentInitParameter,
} from '../../paneview/paneviewPanel';
import { Orientation } from '../../splitview/splitview';

class TestPanel extends PaneviewPanel {
    constructor(id: string, component: string) {
        super(id, component, 'header', Orientation.VERTICAL, false, true);
    }

    getHeaderComponent() {
        return new (class Header implements IPaneHeaderPart {
            private _element: HTMLElement = document.createElement('div');

            get element() {
                return this._element;
            }

            init(params: PanePanelComponentInitParameter) {
                //
            }

            update(params: PanelUpdateEvent) {
                //
            }

            dispose() {
                //
            }
        })();
    }

    getBodyComponent() {
        return new (class Header implements IPaneBodyPart {
            private _element: HTMLElement = document.createElement('div');

            get element() {
                return this._element;
            }

            init(params: PanePanelComponentInitParameter) {
                //
            }

            update(params: PanelUpdateEvent) {
                //
            }

            dispose() {
                //
            }
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

        const paneview = new PaneviewComponent({
            parentElement: container,
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

        const panel1 = paneview.getPanel('panel1') as PaneviewPanel;
        const panel2 = paneview.getPanel('panel2') as PaneviewPanel;

        let panel1Dimensions: PanelDimensionChangeEvent | undefined = undefined;
        disposables.addDisposables(
            panel1.api.onDidDimensionsChange((event) => {
                panel1Dimensions = event;
            })
        );

        let panel2Dimensions: PanelDimensionChangeEvent | undefined = undefined;
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

        panel1.api.setExpanded(true);

        expect(panel1Dimensions).toEqual({ width: 200, height: 578 });
        expect(panel2Dimensions).toEqual({ width: 200, height: 22 });

        panel2.api.setExpanded(true);
        panel1.api.setSize({ size: 300 });

        expect(panel1Dimensions).toEqual({ width: 200, height: 300 });
        expect(panel2Dimensions).toEqual({ width: 200, height: 300 });

        panel1.api.setSize({ size: 200 });

        expect(panel1Dimensions).toEqual({ width: 200, height: 200 });
        expect(panel2Dimensions).toEqual({ width: 200, height: 400 });

        disposables.dispose();
        paneview.dispose();
    });

    test('serialization', () => {
        const paneview = new PaneviewComponent({
            parentElement: container,
            components: {
                testPanel: TestPanel,
            },
        });

        paneview.fromJSON({
            size: 6,
            views: [
                {
                    size: 1,
                    data: {
                        id: 'panel1',
                        component: 'testPanel',
                        title: 'Panel 1',
                    },
                    expanded: true,
                },
                {
                    size: 2,
                    data: {
                        id: 'panel2',
                        component: 'testPanel',
                        title: 'Panel 2',
                    },
                    expanded: false,
                },
                {
                    size: 3,
                    data: {
                        id: 'panel3',
                        component: 'testPanel',
                        title: 'Panel 3',
                    },
                },
            ],
        });

        paneview.layout(400, 800);

        const panel1 = paneview.getPanel('panel1');

        expect(panel1!.api.height).toBe(756);
        expect(panel1!.api.width).toBe(400);
        expect(panel1!.api.id).toBe('panel1');
        // expect(panel1!.api.isActive).toBeTruthy();
        // expect(panel1?.api.isFocused).toBeFalsy();
        expect(panel1!.api.isVisible).toBeTruthy();
        expect(panel1!.api.isExpanded).toBeTruthy();

        const panel2 = paneview.getPanel('panel2');

        expect(panel2!.api.height).toBe(22);
        expect(panel2!.api.width).toBe(400);
        expect(panel2!.api.id).toBe('panel2');
        // expect(panel2!.api.isActive).toBeTruthy();
        // expect(panel2?.api.isFocused).toBeFalsy();
        expect(panel2!.api.isVisible).toBeTruthy();
        expect(panel2!.api.isExpanded).toBeFalsy();

        const panel3 = paneview.getPanel('panel3');

        expect(panel3!.api.height).toBe(22);
        expect(panel3!.api.width).toBe(400);
        expect(panel3!.api.id).toBe('panel3');
        // expect(panel3!.api.isActive).toBeTruthy();
        // expect(panel3?.api.isFocused).toBeFalsy();
        expect(panel3!.api.isVisible).toBeTruthy();
        expect(panel3!.api.isExpanded).toBeFalsy();

        expect(JSON.parse(JSON.stringify(paneview.toJSON()))).toEqual({
            size: 800,
            views: [
                {
                    size: 756,
                    data: {
                        id: 'panel1',
                        component: 'testPanel',
                        title: 'Panel 1',
                    },
                    expanded: true,
                    minimumSize: 100,
                },
                {
                    size: 22,
                    data: {
                        id: 'panel2',
                        component: 'testPanel',
                        title: 'Panel 2',
                    },
                    expanded: false,
                    minimumSize: 100,
                },
                {
                    size: 22,
                    data: {
                        id: 'panel3',
                        component: 'testPanel',
                        title: 'Panel 3',
                    },
                    expanded: false,
                    minimumSize: 100,
                },
            ],
        });
    });

    test('toJSON shouldnt fire any layout events', () => {
        const paneview = new PaneviewComponent({
            parentElement: container,
            components: {
                testPanel: TestPanel,
            },
        });
        paneview.layout(1000, 1000);

        paneview.addPanel({
            id: 'panel1',
            component: 'testPanel',
            title: 'Panel 1',
        });
        paneview.addPanel({
            id: 'panel2',
            component: 'testPanel',
            title: 'Panel 2',
        });

        const disposable = paneview.onDidLayoutChange(() => {
            fail('onDidLayoutChange shouldnt have been called');
        });

        const result = paneview.toJSON();
        expect(result).toBeTruthy();

        disposable.dispose();
    });

    test('dispose of paneviewComponent', () => {
        expect(container.childNodes.length).toBe(0);

        const paneview = new PaneviewComponent({
            parentElement: container,
            components: {
                testPanel: TestPanel,
            },
        });

        paneview.layout(1000, 1000);

        paneview.addPanel({
            id: 'panel1',
            component: 'testPanel',
            title: 'Panel 1',
        });
        paneview.addPanel({
            id: 'panel2',
            component: 'testPanel',
            title: 'Panel 2',
        });

        expect(container.childNodes.length).toBeGreaterThan(0);

        paneview.dispose();

        expect(container.childNodes.length).toBe(0);
    });

    test('panel is disposed of when component is disposed', () => {
        const paneview = new PaneviewComponent({
            parentElement: container,
            components: {
                testPanel: TestPanel,
            },
        });

        paneview.layout(1000, 1000);

        paneview.addPanel({
            id: 'panel1',
            component: 'testPanel',
            title: 'Panel 1',
        });
        paneview.addPanel({
            id: 'panel2',
            component: 'testPanel',
            title: 'Panel 2',
        });

        const panel1 = paneview.getPanel('panel1')!;
        const panel2 = paneview.getPanel('panel2')!;

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        paneview.dispose();

        expect(panel1Spy).toHaveBeenCalledTimes(1);
        expect(panel2Spy).toHaveBeenCalledTimes(1);
    });

    test('panel is disposed of when removed', () => {
        const paneview = new PaneviewComponent({
            parentElement: container,
            components: {
                testPanel: TestPanel,
            },
        });

        paneview.layout(1000, 1000);

        paneview.addPanel({
            id: 'panel1',
            component: 'testPanel',
            title: 'Panel 1',
        });
        paneview.addPanel({
            id: 'panel2',
            component: 'testPanel',
            title: 'Panel 2',
        });

        const panel1 = paneview.getPanel('panel1')!;
        const panel2 = paneview.getPanel('panel2')!;

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        paneview.removePanel(panel2);

        expect(panel1Spy).not.toHaveBeenCalled();
        expect(panel2Spy).toHaveBeenCalledTimes(1);
    });

    test('panel is disposed of when fromJSON is called', () => {
        const paneview = new PaneviewComponent({
            parentElement: container,
            components: {
                testPanel: TestPanel,
            },
        });

        paneview.layout(1000, 1000);

        paneview.addPanel({
            id: 'panel1',
            component: 'testPanel',
            title: 'Panel 1',
        });
        paneview.addPanel({
            id: 'panel2',
            component: 'testPanel',
            title: 'Panel 2',
        });

        const panel1 = paneview.getPanel('panel1')!;
        const panel2 = paneview.getPanel('panel2')!;

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        paneview.fromJSON({ views: [], size: 0 });

        expect(panel1Spy).toHaveBeenCalledTimes(1);
        expect(panel2Spy).toHaveBeenCalledTimes(1);
    });
});
