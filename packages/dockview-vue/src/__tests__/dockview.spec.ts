import { createDockview, PROPERTY_KEYS_DOCKVIEW } from 'dockview-core';
import * as dockviewTypes from '../dockview/types';

describe('DockviewVue Component', () => {
    test('should export component types', () => {
        expect(dockviewTypes).toBeDefined();
        expect(typeof dockviewTypes).toBe('object');
    });

    test('should export dockview-core functionality', () => {
        expect(createDockview).toBeDefined();
        expect(PROPERTY_KEYS_DOCKVIEW).toBeDefined();
        expect(Array.isArray(PROPERTY_KEYS_DOCKVIEW)).toBe(true);
    });

    test('should have correct dockview properties', () => {
        expect(PROPERTY_KEYS_DOCKVIEW).toContain('disableAutoResizing');
        expect(PROPERTY_KEYS_DOCKVIEW).toContain('hideBorders');
        expect(PROPERTY_KEYS_DOCKVIEW).toContain('theme');
        expect(PROPERTY_KEYS_DOCKVIEW).toContain('singleTabMode');
    });

    test('should create dockview instance with DOM element', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const mockRenderer = {
            element: document.createElement('div'),
            dispose: () => {},
            update: () => {},
            init: () => {},
        };

        const api = createDockview(element, {
            disableAutoResizing: true,
            hideBorders: false,
            createComponent: () => mockRenderer,
        });

        expect(api).toBeDefined();
        expect(typeof api.layout).toBe('function');
        expect(typeof api.dispose).toBe('function');
        expect(typeof api.addPanel).toBe('function');
        expect(typeof api.updateOptions).toBe('function');

        api.dispose();
        document.body.removeChild(element);
    });

    test('should handle framework component creation', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        let createdComponent: any;

        const api = createDockview(element, {
            createComponent: (options) => {
                createdComponent = {
                    element: document.createElement('div'),
                    dispose: jest.fn(),
                    update: jest.fn(),
                    init: jest.fn(),
                };
                return createdComponent;
            },
        });

        // Add a panel to trigger component creation
        api.addPanel({
            id: 'test-panel',
            component: 'test-component',
            title: 'Test Panel',
        });

        expect(createdComponent).toBeDefined();
        expect(createdComponent.element).toBeInstanceOf(HTMLElement);

        api.dispose();
        document.body.removeChild(element);
    });

    test('should handle option updates', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const mockRenderer = {
            element: document.createElement('div'),
            dispose: () => {},
            update: () => {},
            init: () => {},
        };

        const api = createDockview(element, {
            disableAutoResizing: false,
            hideBorders: false,
            createComponent: () => mockRenderer,
        });

        // Update options
        api.updateOptions({
            disableAutoResizing: true,
            hideBorders: true,
        });

        // Test passes if no errors are thrown
        expect(true).toBe(true);

        api.dispose();
        document.body.removeChild(element);
    });
});
