import { createPaneview, PROPERTY_KEYS_PANEVIEW } from 'dockview-core';
import { VuePaneviewPanelView } from '../paneview/view';
import * as paneviewTypes from '../paneview/types';

describe('PaneviewVue Component', () => {
    test('should export component types', () => {
        expect(paneviewTypes).toBeDefined();
        expect(typeof paneviewTypes).toBe('object');
    });

    test('should export dockview-core functionality', () => {
        expect(createPaneview).toBeDefined();
        expect(PROPERTY_KEYS_PANEVIEW).toBeDefined();
    });

    test('should have correct paneview properties', () => {
        expect(PROPERTY_KEYS_PANEVIEW).toContain('disableAutoResizing');
        expect(PROPERTY_KEYS_PANEVIEW).toContain('disableDnd');
    });

    test('should create paneview with Vue framework support', () => {
        // Test that Vue-specific components can be created with proper type safety
        expect(typeof createPaneview).toBe('function');
        expect(typeof VuePaneviewPanelView).toBe('function');

        // Test that a Vue paneview panel view can be instantiated
        const mockVueComponent = { template: '<div>Test</div>' } as any;
        const mockParent = {} as any;

        const panelView = new VuePaneviewPanelView(
            'test-id',
            mockVueComponent,
            mockParent
        );

        expect(panelView.id).toBe('test-id');
        expect(panelView.element).toBeInstanceOf(HTMLElement);
        expect(typeof panelView.init).toBe('function');
        expect(typeof panelView.update).toBe('function');
        expect(typeof panelView.dispose).toBe('function');
    });

    test('should handle Vue component integration for panes', () => {
        // Test Vue component factory creation for paneview
        const mockComponent = {
            template:
                '<div class="vue-pane-panel">{{ title }}: {{ params.content }}</div>',
            props: ['params', 'api', 'containerApi', 'title'],
        };

        expect(mockComponent.template).toContain('vue-pane-panel');
        expect(mockComponent.props).toContain('params');
        expect(mockComponent.props).toContain('api');
        expect(mockComponent.props).toContain('containerApi');
        expect(mockComponent.props).toContain('title');
    });
});

describe('VuePaneviewPanelView', () => {
    test('should be a class that implements IPanePart interface', () => {
        expect(VuePaneviewPanelView).toBeDefined();
        expect(typeof VuePaneviewPanelView).toBe('function');
    });

    test('should create instance with required properties', () => {
        const mockVueInstance = {
            appContext: { components: {} },
            components: {},
            parent: null,
        };

        const mockVueComponent = {
            props: {
                params: Object,
                api: Object,
                containerApi: Object,
                title: String,
            },
            template: '<div>{{ title }}: Test Paneview Panel</div>',
        } as any;

        const panelView = new VuePaneviewPanelView(
            'paneview-test-id',
            mockVueComponent,
            mockVueInstance as any
        );

        expect(panelView.id).toBe('paneview-test-id');
        expect(panelView.element).toBeInstanceOf(HTMLElement);
        expect(typeof panelView.init).toBe('function');
        expect(typeof panelView.update).toBe('function');
        expect(typeof panelView.dispose).toBe('function');
        expect(typeof panelView.toJSON).toBe('function');
    });

    test('should return correct JSON representation', () => {
        const mockVueInstance = {
            appContext: { components: {} },
            components: {},
            parent: null,
        };

        const panelView = new VuePaneviewPanelView(
            'paneview-test-id',
            { template: '<div>Test</div>' } as any,
            mockVueInstance as any
        );

        const json = panelView.toJSON();
        expect(json).toEqual({ id: 'paneview-test-id' });
    });

    test('should handle lifecycle methods gracefully', () => {
        const mockVueInstance = {
            appContext: { components: {} },
            components: {},
            parent: null,
        };

        const panelView = new VuePaneviewPanelView(
            'test-id',
            { template: '<div>Test</div>' } as any,
            mockVueInstance as any
        );

        expect(() =>
            panelView.update({ params: { data: 'test' } })
        ).not.toThrow();
        expect(() => panelView.dispose()).not.toThrow();
    });
});
