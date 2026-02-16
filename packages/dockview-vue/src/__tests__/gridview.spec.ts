import {
    createGridview,
    PROPERTY_KEYS_GRIDVIEW,
    Orientation,
} from 'dockview-core';
import { VueGridviewPanelView } from '../gridview/view';
import { VuePart } from '../utils';
import * as gridviewTypes from '../gridview/types';

describe('GridviewVue Component', () => {
    test('should export component types', () => {
        expect(gridviewTypes).toBeDefined();
        expect(typeof gridviewTypes).toBe('object');
    });

    test('should export dockview-core functionality', () => {
        expect(createGridview).toBeDefined();
        expect(PROPERTY_KEYS_GRIDVIEW).toBeDefined();
    });

    test('should have correct gridview properties', () => {
        expect(PROPERTY_KEYS_GRIDVIEW).toContain('proportionalLayout');
        expect(PROPERTY_KEYS_GRIDVIEW).toContain('hideBorders');
        expect(PROPERTY_KEYS_GRIDVIEW).toContain('disableAutoResizing');
    });

    test('should create gridview instance with DOM element', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const api = createGridview(element, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: true,
            hideBorders: false,
            createComponent: () =>
                new VueGridviewPanelView(
                    'test',
                    'test-component',
                    { template: '<div>Test</div>' } as any,
                    {} as any
                ),
        });

        expect(api).toBeDefined();
        expect(typeof api.layout).toBe('function');
        expect(typeof api.dispose).toBe('function');
        expect(typeof api.addPanel).toBe('function');
        expect(typeof api.updateOptions).toBe('function');

        api.dispose();
        document.body.removeChild(element);
    });

    test('should handle proportional layout changes', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const api = createGridview(element, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
            createComponent: () =>
                new VueGridviewPanelView(
                    'test',
                    'test-component',
                    { template: '<div>Test</div>' } as any,
                    {} as any
                ),
        });

        // Update proportional layout
        api.updateOptions({ proportionalLayout: true });

        // Test passes if no errors are thrown
        expect(true).toBe(true);

        api.dispose();
        document.body.removeChild(element);
    });

    test('should add and manage grid panels', () => {
        const initSpy = jest
            .spyOn(VuePart.prototype, 'init')
            .mockImplementation(() => {});

        const element = document.createElement('div');
        document.body.appendChild(element);

        const api = createGridview(element, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: true,
            createComponent: (options) =>
                new VueGridviewPanelView(
                    options.id,
                    options.name,
                    { template: '<div>Test</div>' } as any,
                    {} as any
                ),
        });

        // Add a panel
        api.addPanel({
            id: 'grid-panel-1',
            component: 'test-component',
        });

        expect(api.panels.length).toBe(1);
        expect(api.panels[0].id).toBe('grid-panel-1');
        expect(initSpy).toHaveBeenCalled();

        // Remove the panel
        api.removePanel(api.panels[0]);
        expect(api.panels.length).toBe(0);

        initSpy.mockRestore();
        api.dispose();
        document.body.removeChild(element);
    });
});

describe('VueGridviewPanelView', () => {
    let mockVueInstance: any;
    let mockVueComponent: any;
    let panelView: VueGridviewPanelView;

    beforeEach(() => {
        mockVueInstance = {
            appContext: { components: {} },
            components: {},
            parent: null,
        };

        mockVueComponent = {
            props: { params: Object, api: Object, containerApi: Object },
            template: '<div>Test Gridview Panel</div>',
        };

        panelView = new VueGridviewPanelView(
            'gridview-test-id',
            'gridview-test-component',
            mockVueComponent as any,
            mockVueInstance
        );
    });

    test('should create panel view with correct properties', () => {
        expect(panelView.id).toBe('gridview-test-id');
        expect(panelView.element).toBeInstanceOf(HTMLElement);
        expect(panelView.element.style.height).toBe('100%');
        expect(panelView.element.style.width).toBe('100%');
        expect(panelView.element.style.overflow).toBe('hidden');
    });

    test('should implement GridviewPanel interface', () => {
        expect(panelView.api).toBeDefined();
        expect(typeof panelView.getComponent).toBe('function');
        expect(panelView.element).toBeInstanceOf(HTMLElement);
    });

    test('should create framework part and call init when getComponent is called', () => {
        const initSpy = jest
            .spyOn(VuePart.prototype, 'init')
            .mockImplementation(() => {});

        // Mock _params to avoid accessor error
        (panelView as any)._params = {
            params: {},
            accessor: { id: 'test-accessor' },
        };

        const component = panelView.getComponent();
        expect(component).toBeDefined();
        expect(component.constructor.name).toBe('VuePart');
        expect(initSpy).toHaveBeenCalled();

        initSpy.mockRestore();
    });

    test('should handle empty params', () => {
        const initSpy = jest
            .spyOn(VuePart.prototype, 'init')
            .mockImplementation(() => {});

        // Mock _params to avoid accessor error
        (panelView as any)._params = {
            params: {},
            accessor: { id: 'test-accessor' },
        };

        const component = panelView.getComponent();
        expect(component).toBeDefined();

        initSpy.mockRestore();
    });
});
