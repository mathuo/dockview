<script setup lang="ts">
import {
    type PaneviewOptions,
    PROPERTY_KEYS_PANEVIEW,
    createPaneview,
} from 'dockview';
import { useViewComponent } from '../composables/useViewComponent';
import { VuePaneviewPanelView } from './view';
import DockviewPortals from '../dockviewPortals.vue';
import type { IPaneviewVueProps, PaneviewVueEvents } from './types';

function extractCoreOptions(props: IPaneviewVueProps): PaneviewOptions {
    const coreOptions = (
        PROPERTY_KEYS_PANEVIEW as (keyof PaneviewOptions)[]
    ).reduce(
        (obj, key) => {
            (obj as any)[key] = props[key];
            return obj;
        },
        {} as Partial<PaneviewOptions>
    );

    return coreOptions as PaneviewOptions;
}

const emit = defineEmits<PaneviewVueEvents>();
const props = defineProps<IPaneviewVueProps>();

const { el, registry } = useViewComponent(
    {
        componentName: 'paneview-vue',
        propertyKeys: PROPERTY_KEYS_PANEVIEW,
        createApi: createPaneview,
        createView: (id, name, component, instance, registry) =>
            new VuePaneviewPanelView(id, component, instance, registry),
        extractCoreOptions,
        onApiCreated: (api) => [
            api.onDidDrop((event) => emit('didDrop', event)),
        ],
    },
    props,
    emit
);
</script>

<template>
    <div ref="el" style="height: 100%; width: 100%" />
    <DockviewPortals :entries="registry.entries" />
</template>
