import { GridviewComponent } from '../../gridview/gridviewComponent';
import { GridviewPanel } from '../../gridview/gridviewPanel';
import { IFrameworkPart } from '../../panel/types';
import { Orientation } from '../../splitview/core/splitview';

class TestGridview extends GridviewPanel {
    constructor(id: string, componentName: string) {
        super(id, componentName);
    }

    getComponent(): IFrameworkPart {
        return {
            update: (parmas) => {
                //
            },
            dispose: () => {
                //
            },
        };
    }
}

describe('gridview', () => {
    let container: HTMLElement;
    let gridview: GridviewComponent;

    beforeEach(() => {
        container = document.createElement('div');
        gridview = new GridviewComponent(container, {
            proportionalLayout: false,
            orientation: Orientation.VERTICAL,
            components: { default: TestGridview },
        });
    });

    test('deserialize and serialize a layout', () => {
        gridview.layout(800, 400);
        gridview.fromJSON({
            grid: {
                height: 400,
                width: 800,
                orientation: Orientation.HORIZONTAL,
                root: {
                    type: 'branch',
                    size: 800,
                    data: [
                        {
                            type: 'leaf',
                            size: 300,
                            visible: true,
                            data: {
                                id: 'panel_1',
                                component: 'default',
                                snap: false,
                            },
                        },
                        {
                            type: 'leaf',
                            size: 300,
                            visible: false,
                            data: {
                                id: 'panel_2',
                                component: 'default',
                                snap: false,
                            },
                        },
                        {
                            type: 'leaf',
                            size: 200,
                            visible: true,
                            data: {
                                id: 'panel_3',
                                component: 'default',
                                snap: true,
                            },
                        },
                    ],
                },
            },
            activePanel: 'panel_1',
        });

        expect(JSON.parse(JSON.stringify(gridview.toJSON()))).toEqual({
            grid: {
                height: 400,
                width: 800,
                orientation: Orientation.HORIZONTAL,
                root: {
                    type: 'branch',
                    size: 800,
                    data: [
                        {
                            type: 'leaf',
                            size: 300,
                            data: {
                                id: 'panel_1',
                                component: 'default',
                                snap: false,
                            },
                        },
                        {
                            type: 'leaf',
                            size: 300,
                            visible: false,
                            data: {
                                id: 'panel_2',
                                component: 'default',
                                snap: false,
                            },
                        },
                        {
                            type: 'leaf',
                            size: 200,
                            data: {
                                id: 'panel_3',
                                component: 'default',
                                snap: true,
                            },
                        },
                    ],
                },
            },
            activePanel: 'panel_1',
        });
    });
});
