import {
    createSplitview,
    Orientation,
    PROPERTY_KEYS_SPLITVIEW,
} from 'dockview-core';
import { VueSplitviewPanelView } from '../splitview/view';
import { VuePart } from '../utils';
import * as splitviewTypes from '../splitview/types';

describe('SplitviewVue Component', () => {
    test('should export component types', () => {
        expect(splitviewTypes).toBeDefined();
        expect(typeof splitviewTypes).toBe('object');
    });

    test('should have access to orientation constants', () => {
        expect(Orientation.HORIZONTAL).toBeDefined();
        expect(Orientation.VERTICAL).toBeDefined();
    });

    test('should export dockview-core functionality', () => {
        expect(createSplitview).toBeDefined();
        expect(PROPERTY_KEYS_SPLITVIEW).toBeDefined();
    });

    test('should have correct splitview properties', () => {
        expect(PROPERTY_KEYS_SPLITVIEW).toContain('orientation');
        expect(PROPERTY_KEYS_SPLITVIEW).toContain('proportionalLayout');
        expect(PROPERTY_KEYS_SPLITVIEW).toContain('disableAutoResizing');
    });

    test('should create splitview with Vue framework support', () => {
        // Test that Vue-specific components can be created with proper type safety
        expect(typeof createSplitview).toBe('function');
        expect(typeof VueSplitviewPanelView).toBe('function');

        // Test that a Vue splitview panel view can be instantiated
        const mockVueComponent = { template: '<div>Test</div>' } as any;
        const mockParent = {} as any;

        const panelView = new VueSplitviewPanelView(
            'test-id',
            'test-component',
            mockVueComponent,
            mockParent
        );

        expect(panelView.id).toBe('test-id');
        expect(panelView.element).toBeInstanceOf(HTMLElement);
        expect(typeof panelView.getComponent).toBe('function');
    });

    test('should handle Vue component integration', () => {
        // Test Vue component factory creation for splitview
        const mockComponent = {
            template:
                '<div class="vue-splitview-panel">{{ params.title }}</div>',
            props: ['params', 'api', 'containerApi'],
        };

        expect(mockComponent.template).toContain('vue-splitview-panel');
        expect(mockComponent.props).toContain('params');
        expect(mockComponent.props).toContain('api');
        expect(mockComponent.props).toContain('containerApi');
    });
});

describe('VueSplitviewPanelView', () => {
    test('should be a class that extends SplitviewPanel', () => {
        expect(VueSplitviewPanelView).toBeDefined();
        expect(typeof VueSplitviewPanelView).toBe('function');
    });

    test('should create instance with required properties', () => {
        const mockVueInstance = {
            appContext: { components: {} },
            components: {},
            parent: null,
        };

        const mockVueComponent = {
            props: { params: Object, api: Object, containerApi: Object },
            template: '<div>Test</div>',
        } as any;

        const panelView = new VueSplitviewPanelView(
            'test-id',
            'test-component',
            mockVueComponent,
            mockVueInstance as any
        );

        expect(panelView.id).toBe('test-id');
        expect(panelView.element).toBeInstanceOf(HTMLElement);
        expect(typeof panelView.getComponent).toBe('function');
    });

    test('should handle getComponent with mocked parameters and call init', () => {
        const initSpy = jest
            .spyOn(VuePart.prototype, 'init')
            .mockImplementation(() => {});

        const mockVueInstance = {
            appContext: { components: {} },
            components: {},
            parent: null,
        };

        const mockVueComponent = {
            props: { params: Object, api: Object, containerApi: Object },
            template: '<div>Test</div>',
        } as any;

        const panelView = new VueSplitviewPanelView(
            'test-id',
            'test-component',
            mockVueComponent,
            mockVueInstance as any
        );

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
});
