<script setup lang="ts">
import {
    DockviewApi,
    type DockviewOptions,
    PROPERTY_KEYS_DOCKVIEW,
    type DockviewFrameworkOptions,
createDockview,
} from '@samelie/dockview-core';
import {
    ref,
    onMounted,
    defineProps,
    defineEmits,
    watch,
    onBeforeUnmount,
    markRaw,
    getCurrentInstance,
} from 'vue';
import {
    VueHeaderActionsRenderer,
    VueRenderer,
    VueWatermarkRenderer,
    findComponent,
} from '../utils';
import type { IDockviewVueProps, VueEvents } from './types';

function extractCoreOptions(props: IDockviewVueProps): DockviewOptions {
    const coreOptions = (PROPERTY_KEYS_DOCKVIEW as (keyof DockviewOptions)[]).reduce(
        (obj, key) => {
            (obj as any)[key] = props[key];
            return obj;
        },
        {} as Partial<DockviewOptions>
    );

    return coreOptions as DockviewOptions;
}

const emit = defineEmits<VueEvents>();

const props = defineProps<IDockviewVueProps>();

const el = ref<HTMLElement | null>(null);
const instance = ref<DockviewApi | null>(null);

PROPERTY_KEYS_DOCKVIEW.forEach((coreOptionKey) => {
    watch(
        () => props[coreOptionKey],
        (newValue, oldValue) => {
            if (instance.value) {
                instance.value.updateOptions({ [coreOptionKey]: newValue });
            }
        }
    );
});

onMounted(() => {
    if (!el.value) {
        throw new Error('dockview-vue: element is not mounted');
    }

    const inst = getCurrentInstance();

    if(!inst) {
      throw new Error('dockview-vue: getCurrentInstance() returned null')
    }

    const frameworkOptions: DockviewFrameworkOptions = {
        createComponent(options) {
            const component = findComponent(
                inst,
                options.name
            );
            return new VueRenderer(component!, inst);
        },
        createTabComponent(options) {
            let component = findComponent(inst, options.name);

            if (!component && props.defaultTabComponent) {
                component = findComponent(
                    inst,
                    props.defaultTabComponent
                );
            }

            if (component) {
                return new VueRenderer(component, inst);
            }
            return undefined;
        },
        createWatermarkComponent: props.watermarkComponent
            ? () => {
                  const component = findComponent(
                      inst,
                      props.watermarkComponent!
                  );

                  return new VueWatermarkRenderer(
                      component!,
                      inst
                  );
              }
            : undefined,
        createLeftHeaderActionComponent: props.leftHeaderActionsComponent
            ? (group) => {
                  const component = findComponent(
                      inst,
                      props.leftHeaderActionsComponent!
                  );
                  return new VueHeaderActionsRenderer(
                      component!,
                      inst,
                      group
                  );
              }
            : undefined,
        createPrefixHeaderActionComponent: props.prefixHeaderActionsComponent
            ? (group) => {
                  const component = findComponent(
                      inst,
                      props.prefixHeaderActionsComponent!
                  );
                  return new VueHeaderActionsRenderer(
                      component!,
                      inst,
                      group
                  );
              }
            : undefined,
        createRightHeaderActionComponent: props.rightHeaderActionsComponent
            ? (group) => {
                  const component = findComponent(
                      inst,
                      props.rightHeaderActionsComponent!
                  );
                  return new VueHeaderActionsRenderer(
                      component!,
                      inst,
                      group
                  );
              }
            : undefined,
    };

    const api = createDockview(el.value, {
        ...extractCoreOptions(props),
        ...frameworkOptions,
    });

    const { clientWidth, clientHeight } = el.value;
    api.layout(clientWidth, clientHeight);

    /**
     * !!! THIS IS VERY IMPORTANT
     *
     * Since we store a reference to `DockviewComponent` within the Vue.js world Vue.js will 'deeply Proxyify' the object
     * since this is how Vue.js does its reactivity magic.
     *
     * We do not want Vue.js to touch the `DockviewComponent` reference since it does not need to be reactive in accordance
     * to the Vue.js reactivity model and since `DockviewComponent` is written in plain TypeScript allowing Vue.js
     * to proxify the reference will cause all kinds of unexpected issues
     *
     * @see https://vuejs.org/guide/extras/reactivity-in-depth.html
     * @see https://vuejs.org/api/reactivity-advanced.html#markraw
     */
    instance.value = markRaw(api);

    emit('ready', { api});
});

onBeforeUnmount(() => {
    if (instance.value) {
        instance.value.dispose();
    }
});
</script>

<template>
    <div ref="el" />
</template>
