<script setup lang="ts">
import {
    PaneviewApi,
    type PaneviewOptions,
    PROPERTY_KEYS_PANEVIEW,
    type PaneviewFrameworkOptions,
    createPaneview,
} from 'dockview-core';
import { defineProps, defineEmits } from 'vue';
import { useViewComponent } from '../composables/useViewComponent';
import { VuePaneviewPanelView } from './view';
import type { IPaneviewVueProps, PaneviewVueEvents } from './types';

function extractCoreOptions(props: IPaneviewVueProps): PaneviewOptions {
    const coreOptions = (
        PROPERTY_KEYS_PANEVIEW as (keyof PaneviewOptions)[]
    ).reduce((obj, key) => {
        (obj as any)[key] = props[key];
        return obj;
    }, {} as Partial<PaneviewOptions>);

    return coreOptions as PaneviewOptions;
}

const emit = defineEmits<PaneviewVueEvents>();
const props = defineProps<IPaneviewVueProps>();

const { el } = useViewComponent(
    {
        componentName: 'paneview-vue',
        propertyKeys: PROPERTY_KEYS_PANEVIEW,
        createApi: createPaneview,
        createView: (id, name, component, instance) =>
            new VuePaneviewPanelView(id, component, instance),
        extractCoreOptions,
    },
    props,
    emit
);
</script>

<template>
    <div ref="el" style="height: 100%; width: 100%" />
</template>
