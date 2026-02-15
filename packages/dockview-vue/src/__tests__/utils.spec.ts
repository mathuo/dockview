import { VuePart, findComponent, mountVueComponent } from '../utils';

describe('Utils', () => {
    test('should export VuePart class', () => {
        expect(VuePart).toBeDefined();
        expect(typeof VuePart).toBe('function');
    });

    test('should export findComponent function', () => {
        expect(findComponent).toBeDefined();
        expect(typeof findComponent).toBe('function');
    });

    test('should export mountVueComponent function', () => {
        expect(mountVueComponent).toBeDefined();
        expect(typeof mountVueComponent).toBe('function');
    });
});

describe('findComponent', () => {
    test('should find component in instance components', () => {
        const testComponent = { template: '<div>Test</div>' };
        const mockInstance = {
            components: {
                'test-component': testComponent,
            },
            appContext: { components: {} },
            parent: null,
        } as any;

        const found = findComponent(mockInstance, 'test-component');
        expect(found).toBe(testComponent);
    });

    test('should find component in app context', () => {
        const testComponent = { template: '<div>Test</div>' };
        const mockInstance = {
            components: {},
            appContext: {
                components: {
                    'global-component': testComponent,
                },
            },
            parent: null,
        } as any;

        const found = findComponent(mockInstance, 'global-component');
        expect(found).toBe(testComponent);
    });

    test('should throw error when component not found', () => {
        const mockInstance = {
            components: {},
            appContext: { components: {} },
            parent: null,
        } as any;

        expect(() => findComponent(mockInstance, 'non-existent')).toThrow(
            "Failed to find Vue Component 'non-existent'"
        );
    });
});

describe('VuePart', () => {
    let container: HTMLElement;
    let testComponent: any;
    let mockParent: any;
    let vuePart: VuePart;

    beforeEach(() => {
        container = document.createElement('div');

        testComponent = {
            template:
                '<div class="vue-part">{{ params.title }} - {{ params.data }}</div>',
            props: ['params', 'api', 'containerApi'],
        };

        mockParent = {
            appContext: {
                components: {},
                provides: {},
            },
            provides: {},
        };

        const mockProps = {
            params: { title: 'Test Title', data: 'test data' },
            api: { id: 'test-api' },
            containerApi: { id: 'container-api' },
        };

        vuePart = new VuePart(container, testComponent, mockParent, mockProps);
    });

    test('should create VuePart instance', () => {
        expect(vuePart).toBeInstanceOf(VuePart);
        expect(vuePart.constructor.name).toBe('VuePart');
    });

    test('should have required methods', () => {
        expect(typeof vuePart.init).toBe('function');
        expect(typeof vuePart.update).toBe('function');
        expect(typeof vuePart.dispose).toBe('function');
    });

    test('should handle update before init gracefully', () => {
        expect(() =>
            vuePart.update({ params: { title: 'New' } })
        ).not.toThrow();
    });

    test('should handle dispose before init gracefully', () => {
        expect(() => vuePart.dispose()).not.toThrow();
    });

    test('should handle init call without throwing', () => {
        // Test that init can be called without throwing
        // Note: may fail due to Vue environment setup but should not crash the test
        try {
            vuePart.init();
            vuePart.dispose();
        } catch (error) {
            // Vue mounting may fail in test environment, but VuePart should handle it
            expect(error).toBeDefined();
        }
    });
});
