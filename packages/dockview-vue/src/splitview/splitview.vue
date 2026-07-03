<script setup lang="ts">
import {
    type SplitviewOptions,
    PROPERTY_KEYS_SPLITVIEW,
    createSplitview,
} from 'dockview';
import { useViewComponent } from '../composables/useViewComponent';
import { VueSplitviewPanelView } from './view';
import DockviewPortals from '../dockviewPortals.vue';
import type { ISplitviewVueProps, SplitviewVueEvents } from './types';

function extractCoreOptions(props: ISplitviewVueProps): SplitviewOptions {
    const coreOptions = (
        PROPERTY_KEYS_SPLITVIEW as (keyof SplitviewOptions)[]
    ).reduce((obj, key) => {
        (obj as any)[key] = props[key];
        return obj;
    }, {} as Partial<SplitviewOptions>);

    return coreOptions as SplitviewOptions;
}

const emit = defineEmits<SplitviewVueEvents>();
const props = defineProps<ISplitviewVueProps>();

const { el, registry } = useViewComponent(
    {
        componentName: 'splitview-vue',
        propertyKeys: PROPERTY_KEYS_SPLITVIEW,
        createApi: createSplitview,
        createView: (id, name, component, instance, registry) =>
            new VueSplitviewPanelView(id, name, component, instance, registry),
        extractCoreOptions,
    },
    props,
    emit
);
</script>

<template>
    <div ref="el" style="height: 100%; width: 100%" />
    <DockviewPortals :entries="registry.entries" />
</template>
