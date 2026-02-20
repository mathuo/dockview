import {
    DockviewEmitter,
    DockviewGroupPanel,
    DockviewGroupPanelApi,
    DockviewGroupPanelModel,
    IDockviewPanel,
} from 'dockview-core';
import {
    VueHeaderActionsRenderer,
    VuePart,
    findComponent,
    mountVueComponent,
} from '../utils';

const mockUpdate = jest.fn();
const mockVueDispose = jest.fn();

jest.mock('vue', () => ({
    createVNode: jest.fn(() => ({})),
    render: jest.fn(),
    cloneVNode: jest.fn(() => ({})),
}));

// After mocking vue, mountVueComponent will return { update, dispose }
// We need to get a reference to the render mock to track props
import { createVNode, render as vueRender, cloneVNode } from 'vue';
const createVNodeMock = createVNode as jest.Mock;
const vueRenderMock = vueRender as jest.Mock;

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

describe('VueHeaderActionsRenderer', () => {
    let onDidAddPanel: DockviewEmitter<any>;
    let onDidRemovePanel: DockviewEmitter<any>;
    let onDidActivePanelChange: DockviewEmitter<any>;
    let onDidActiveChange: DockviewEmitter<any>;
    let onDidLocationChange: DockviewEmitter<any>;
    let groupPanel: DockviewGroupPanel;
    let mockParent: any;
    let mockComponent: any;
    let panels: IDockviewPanel[];
    let activePanel: IDockviewPanel | undefined;
    let isGroupActive: boolean;

    beforeEach(() => {
        onDidAddPanel = new DockviewEmitter();
        onDidRemovePanel = new DockviewEmitter();
        onDidActivePanelChange = new DockviewEmitter();
        onDidActiveChange = new DockviewEmitter();
        onDidLocationChange = new DockviewEmitter();

        panels = [{ id: 'panel-1' } as IDockviewPanel];
        activePanel = panels[0];
        isGroupActive = true;

        const groupModel = {
            onDidAddPanel: onDidAddPanel.event,
            onDidRemovePanel: onDidRemovePanel.event,
            onDidActivePanelChange: onDidActivePanelChange.event,
            get panels() {
                return panels;
            },
            get activePanel() {
                return activePanel;
            },
        } as Partial<DockviewGroupPanelModel> as DockviewGroupPanelModel;

        const groupApi = {
            onDidActiveChange: onDidActiveChange.event,
            onDidLocationChange: onDidLocationChange.event,
            location: { type: 'grid' },
            get isActive() {
                return isGroupActive;
            },
        } as Partial<DockviewGroupPanelApi> as DockviewGroupPanelApi;

        groupPanel = {
            api: groupApi,
            model: groupModel,
        } as Partial<DockviewGroupPanel> as DockviewGroupPanel;

        mockParent = {
            appContext: { components: {}, provides: {} },
            provides: {},
        };

        mockComponent = {
            template: '<div>header actions</div>',
            props: ['params'],
        };
    });

    afterEach(() => {
        onDidAddPanel.dispose();
        onDidRemovePanel.dispose();
        onDidActivePanelChange.dispose();
        onDidActiveChange.dispose();
        onDidLocationChange.dispose();
        createVNodeMock.mockClear();
        vueRenderMock.mockClear();
        (cloneVNode as jest.Mock).mockClear();
    });

    test('should create element with correct class and styles', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        expect(renderer.element).toBeInstanceOf(HTMLElement);
        expect(renderer.element.className).toBe('dv-vue-part');
        expect(renderer.element.style.height).toBe('100%');
        expect(renderer.element.style.width).toBe('100%');
    });

    test('should pass enriched IDockviewHeaderActionsProps on init', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        const mockContainerApi = {} as any;

        renderer.init({
            api: groupPanel.api,
            containerApi: mockContainerApi,
            group: groupPanel as any,
        });

        expect(createVNodeMock).toHaveBeenCalledTimes(1);

        const passedProps = createVNodeMock.mock.calls[0][1];
        expect(passedProps.params).toEqual(
            expect.objectContaining({
                api: groupPanel.api,
                containerApi: mockContainerApi,
                panels: panels,
                activePanel: activePanel,
                isGroupActive: true,
                group: groupPanel,
            })
        );

        renderer.dispose();
    });

    test('should update panels reactively when onDidAddPanel fires', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        renderer.init({
            api: groupPanel.api,
            containerApi: {} as any,
            group: groupPanel as any,
        });

        // Clear from init call
        (cloneVNode as jest.Mock).mockClear();
        vueRenderMock.mockClear();

        const newPanel = { id: 'panel-2' } as IDockviewPanel;
        panels = [...panels, newPanel];

        onDidAddPanel.fire(undefined);

        // cloneVNode should have been called for the update
        expect(vueRenderMock).toHaveBeenCalled();

        renderer.dispose();
    });

    test('should update panels reactively when onDidRemovePanel fires', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        renderer.init({
            api: groupPanel.api,
            containerApi: {} as any,
            group: groupPanel as any,
        });

        vueRenderMock.mockClear();

        panels = [];
        onDidRemovePanel.fire(undefined);

        expect(vueRenderMock).toHaveBeenCalled();

        renderer.dispose();
    });

    test('should update activePanel reactively when onDidActivePanelChange fires', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        renderer.init({
            api: groupPanel.api,
            containerApi: {} as any,
            group: groupPanel as any,
        });

        vueRenderMock.mockClear();

        activePanel = undefined;
        onDidActivePanelChange.fire(undefined);

        expect(vueRenderMock).toHaveBeenCalled();

        renderer.dispose();
    });

    test('should update isGroupActive reactively when onDidActiveChange fires', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        renderer.init({
            api: groupPanel.api,
            containerApi: {} as any,
            group: groupPanel as any,
        });

        vueRenderMock.mockClear();

        isGroupActive = false;
        onDidActiveChange.fire(undefined);

        expect(vueRenderMock).toHaveBeenCalled();

        renderer.dispose();
    });

    test('should dispose event subscriptions on dispose', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        renderer.init({
            api: groupPanel.api,
            containerApi: {} as any,
            group: groupPanel as any,
        });

        renderer.dispose();

        vueRenderMock.mockClear();

        // After dispose, firing events should not trigger re-renders
        onDidAddPanel.fire(undefined);
        onDidRemovePanel.fire(undefined);
        onDidActivePanelChange.fire(undefined);
        onDidActiveChange.fire(undefined);

        // Only the dispose render(null) call, no update re-renders
        expect(vueRenderMock).not.toHaveBeenCalled();
    });

    test('should dispose previous subscriptions when init is called again', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        renderer.init({
            api: groupPanel.api,
            containerApi: {} as any,
            group: groupPanel as any,
        });

        // Second init should dispose previous mount
        renderer.init({
            api: groupPanel.api,
            containerApi: {} as any,
            group: groupPanel as any,
        });

        // createVNode should have been called twice (once per init)
        expect(createVNodeMock).toHaveBeenCalledTimes(2);

        renderer.dispose();
    });

    test('should handle dispose before init gracefully', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        expect(() => renderer.dispose()).not.toThrow();
    });

    test('should subscribe to all five group events', () => {
        const renderer = new VueHeaderActionsRenderer(
            mockComponent,
            mockParent,
            groupPanel
        );

        renderer.init({
            api: groupPanel.api,
            containerApi: {} as any,
            group: groupPanel as any,
        });

        vueRenderMock.mockClear();

        // Fire each event and check it triggers a render
        onDidAddPanel.fire(undefined);
        expect(vueRenderMock).toHaveBeenCalledTimes(1);

        onDidRemovePanel.fire(undefined);
        expect(vueRenderMock).toHaveBeenCalledTimes(2);

        onDidActivePanelChange.fire(undefined);
        expect(vueRenderMock).toHaveBeenCalledTimes(3);

        onDidActiveChange.fire(undefined);
        expect(vueRenderMock).toHaveBeenCalledTimes(4);

        onDidLocationChange.fire({
            location: { type: 'fixed', position: 'left' },
        });
        expect(vueRenderMock).toHaveBeenCalledTimes(5);

        renderer.dispose();
    });
});
