import { describe, test, expect, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import DockviewVue from '../dockview/dockview.vue';
import { DockviewApi } from 'dockview-core';

const MockPanel = defineComponent({
    name: 'MockPanel',
    props: ['params'],
    template: '<div class="mock-panel">Panel</div>',
});

const MockTab = defineComponent({
    name: 'MockTab',
    props: ['params'],
    template: '<div class="mock-tab">Tab</div>',
});

const MockTab2 = defineComponent({
    name: 'MockTab2',
    props: ['params'],
    template: '<div class="mock-tab-2">Tab2</div>',
});

const MockWatermark = defineComponent({
    name: 'MockWatermark',
    props: ['params'],
    template: '<div class="mock-watermark">Watermark</div>',
});

const MockHeaderAction = defineComponent({
    name: 'MockHeaderAction',
    props: ['params'],
    template: '<div class="mock-header-action">Action</div>',
});

function mountDockview(props: Record<string, any> = {}) {
    return mount(DockviewVue, {
        props,
        attachTo: document.body,
        global: {
            components: {
                MockPanel,
                MockTab,
                MockTab2,
                MockWatermark,
                MockHeaderAction,
            },
        },
    });
}

describe('DockviewVue Component', () => {
    let wrapper: ReturnType<typeof mountDockview>;

    afterEach(() => {
        wrapper?.unmount();
    });

    test('should mount and emit ready event with api', async () => {
        wrapper = mountDockview();
        await flushPromises();

        expect(wrapper.emitted('ready')).toBeTruthy();
        const readyEvent = wrapper.emitted('ready')![0][0] as any;
        expect(readyEvent.api).toBeInstanceOf(DockviewApi);
    });

    test('should pass defaultTabComponent to core options on mount', async () => {
        wrapper = mountDockview({
            defaultTabComponent: 'MockTab',
        });
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any)
            .api as DockviewApi;

        api.addPanel({
            id: 'panel-1',
            component: 'MockPanel',
            title: 'Panel 1',
        });

        const panel = api.getPanel('panel-1');
        expect(panel).toBeDefined();
    });

    test('should update defaultTabComponent when prop changes', async () => {
        wrapper = mountDockview({
            defaultTabComponent: 'MockTab',
        });
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any)
            .api as DockviewApi;
        const updateSpy = vi.spyOn(api, 'updateOptions');

        await wrapper.setProps({ defaultTabComponent: 'MockTab2' });
        await nextTick();

        expect(updateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                defaultTabComponent: 'MockTab2',
                createTabComponent: expect.any(Function),
            })
        );
    });

    test('should update watermarkComponent when prop changes', async () => {
        wrapper = mountDockview();
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any)
            .api as DockviewApi;
        const updateSpy = vi.spyOn(api, 'updateOptions');

        await wrapper.setProps({ watermarkComponent: 'MockWatermark' });
        await nextTick();

        expect(updateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                createWatermarkComponent: expect.any(Function),
            })
        );
    });

    test('should clear watermarkComponent when prop is unset', async () => {
        wrapper = mountDockview({
            watermarkComponent: 'MockWatermark',
        });
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any)
            .api as DockviewApi;
        const updateSpy = vi.spyOn(api, 'updateOptions');

        await wrapper.setProps({ watermarkComponent: undefined });
        await nextTick();

        expect(updateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                createWatermarkComponent: undefined,
            })
        );
    });

    test('should update rightHeaderActionsComponent when prop changes', async () => {
        wrapper = mountDockview();
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any)
            .api as DockviewApi;
        const updateSpy = vi.spyOn(api, 'updateOptions');

        await wrapper.setProps({
            rightHeaderActionsComponent: 'MockHeaderAction',
        });
        await nextTick();

        expect(updateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                createRightHeaderActionComponent: expect.any(Function),
            })
        );
    });

    test('should update leftHeaderActionsComponent when prop changes', async () => {
        wrapper = mountDockview();
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any)
            .api as DockviewApi;
        const updateSpy = vi.spyOn(api, 'updateOptions');

        await wrapper.setProps({
            leftHeaderActionsComponent: 'MockHeaderAction',
        });
        await nextTick();

        expect(updateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                createLeftHeaderActionComponent: expect.any(Function),
            })
        );
    });

    test('should update prefixHeaderActionsComponent when prop changes', async () => {
        wrapper = mountDockview();
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any)
            .api as DockviewApi;
        const updateSpy = vi.spyOn(api, 'updateOptions');

        await wrapper.setProps({
            prefixHeaderActionsComponent: 'MockHeaderAction',
        });
        await nextTick();

        expect(updateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                createPrefixHeaderActionComponent: expect.any(Function),
            })
        );
    });

    test('should update tabGroupChipComponent when prop changes', async () => {
        wrapper = mountDockview();
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any)
            .api as DockviewApi;
        const updateSpy = vi.spyOn(api, 'updateOptions');

        await wrapper.setProps({
            tabGroupChipComponent: 'MockHeaderAction',
        });
        await nextTick();

        expect(updateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                createTabGroupChipComponent: expect.any(Function),
            })
        );
    });

    test('should dispose api on unmount', async () => {
        wrapper = mountDockview();
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any)
            .api as DockviewApi;
        const disposeSpy = vi.spyOn(api, 'dispose');

        wrapper.unmount();

        expect(disposeSpy).toHaveBeenCalled();
    });
});
