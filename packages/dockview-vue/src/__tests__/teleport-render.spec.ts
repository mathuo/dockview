import { describe, test, expect, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, nextTick, onMounted, onUnmounted } from 'vue';
import DockviewVue from '../dockview/dockview.vue';

/**
 * Render-behaviour coverage for the teleport mount path beyond the happy
 * single-panel case: the `onlyWhenVisible` detach/reattach cycle (tab
 * switching) and panel prop updates flowing through the reactive props ref.
 */
describe('teleport render behaviour', () => {
    let wrapper: ReturnType<typeof mount>;

    afterEach(() => {
        wrapper?.unmount();
    });

    function mountDockview(components: Record<string, any>) {
        return mount(DockviewVue, {
            props: { components },
            attachTo: document.body,
        });
    }

    test('tab switching detaches/reattaches without destroying the panel instance', async () => {
        const mounted = vi.fn();
        const unmounted = vi.fn();

        const Panel = defineComponent({
            name: 'TabPanel',
            props: ['params'],
            setup(props) {
                onMounted(mounted);
                onUnmounted(unmounted);
                return () =>
                    h(
                        'div',
                        { class: `tab-panel-${props.params.params.which}` },
                        'Panel'
                    );
            },
        });

        wrapper = mountDockview({ Panel });
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any).api;
        api.addPanel({
            id: 'p1',
            component: 'Panel',
            params: { which: '1' },
        });
        api.addPanel({
            id: 'p2',
            component: 'Panel',
            params: { which: '2' },
            position: { referencePanel: 'p1', direction: 'within' },
        });
        await flushPromises();
        await nextTick();

        // Two panels in one group -> two component instances, both kept alive.
        expect(mounted).toHaveBeenCalledTimes(2);
        expect(unmounted).not.toHaveBeenCalled();

        // Switch active tab back to p1 a few times; the default 'onlyWhenVisible'
        // renderer detaches/reattaches the teleport target element. The Vue
        // instances must survive (no remount, no unmount).
        api.getPanel('p1')!.api.setActive();
        await flushPromises();
        api.getPanel('p2')!.api.setActive();
        await flushPromises();
        api.getPanel('p1')!.api.setActive();
        await flushPromises();
        await nextTick();

        expect(mounted).toHaveBeenCalledTimes(2);
        expect(unmounted).not.toHaveBeenCalled();
        expect(document.querySelector('.tab-panel-1')).not.toBeNull();
    });

    test('panel param updates flow through to the rendered component', async () => {
        const Panel = defineComponent({
            name: 'UpdatePanel',
            props: ['params'],
            setup: (props) => () =>
                h(
                    'div',
                    { class: 'update-panel' },
                    String(props.params.params.value)
                ),
        });

        wrapper = mountDockview({ Panel });
        await flushPromises();

        const api = (wrapper.emitted('ready')![0][0] as any).api;
        api.addPanel({
            id: 'p1',
            component: 'Panel',
            params: { value: 'before' },
        });
        await flushPromises();
        await nextTick();

        expect(document.querySelector('.update-panel')!.textContent).toBe(
            'before'
        );

        api.getPanel('p1')!.api.updateParameters({ value: 'after' });
        await flushPromises();
        await nextTick();

        expect(document.querySelector('.update-panel')!.textContent).toBe(
            'after'
        );
    });
});
