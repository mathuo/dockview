<script setup lang="ts">
import {
    SplitviewApi,
    type SplitviewOptions,
    PROPERTY_KEYS_SPLITVIEW,
    type SplitviewFrameworkOptions,
    createSplitview,
} from 'dockview-core';
import { defineProps, defineEmits } from 'vue';
import { useViewComponent } from '../composables/useViewComponent';
import { VueSplitviewPanelView } from './view';
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

const { el } = useViewComponent(
    {
        componentName: 'splitview-vue',
        propertyKeys: PROPERTY_KEYS_SPLITVIEW,
        createApi: createSplitview,
        createView: (id, name, component, instance) =>
            new VueSplitviewPanelView(id, name, component, instance),
        extractCoreOptions,
    },
    props,
    emit
);
</script>

<template>
    <div ref="el" style="height: 100%; width: 100%" />
</template>
