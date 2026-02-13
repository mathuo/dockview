<script setup lang="ts">
import {
    GridviewApi,
    type GridviewOptions,
    PROPERTY_KEYS_GRIDVIEW,
    type GridviewFrameworkOptions,
    createGridview,
} from 'dockview-core';
import { defineProps, defineEmits } from 'vue';
import { useViewComponent } from '../composables/useViewComponent';
import { VueGridviewPanelView } from './view';
import type { IGridviewVueProps, GridviewVueEvents } from './types';

function extractCoreOptions(props: IGridviewVueProps): GridviewOptions {
    const coreOptions = (
        PROPERTY_KEYS_GRIDVIEW as (keyof GridviewOptions)[]
    ).reduce((obj, key) => {
        (obj as any)[key] = props[key];
        return obj;
    }, {} as Partial<GridviewOptions>);

    return coreOptions as GridviewOptions;
}

const emit = defineEmits<GridviewVueEvents>();
const props = defineProps<IGridviewVueProps>();

const { el } = useViewComponent(
    {
        componentName: 'gridview-vue',
        propertyKeys: PROPERTY_KEYS_GRIDVIEW,
        createApi: createGridview,
        createView: (id, name, component, instance) =>
            new VueGridviewPanelView(id, name, component, instance),
        extractCoreOptions,
    },
    props,
    emit
);
</script>

<template>
    <div ref="el" style="height: 100%; width: 100%" />
</template>
