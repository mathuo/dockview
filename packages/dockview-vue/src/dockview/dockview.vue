<script setup lang="ts">
import {
    DockviewApi,
    DockviewComponent,
    type IContentRenderer,
    type ITabRenderer,
    type IWatermarkRenderer,
    type IDockviewPanelProps,
    type IDockviewPanelHeaderProps,
    type IGroupPanelBaseProps,
    type IWatermarkPanelProps,
    type DockviewOptions,
    PROPERTY_KEYS,
    type DockviewFrameworkOptions,
    type DockviewReadyEvent,
} from 'dockview-core';
import {
    ref,
    onMounted,
    defineProps,
    defineEmits,
    watch,
    onBeforeUnmount,
} from 'vue';
import {
    VueContentRenderer,
    VueHeaderActionsRenderer,
    VueTabRenderer,
    VueWatermarkRenderer,
    type VueComponent,
} from '../utils';

interface VueProps {
    components: Record<string, VueComponent<IDockviewPanelProps>>;
    tabComponents?: Record<string, VueComponent<IDockviewPanelHeaderProps>>;
    watermarkComponent?: VueComponent<IWatermarkPanelProps>;
    defaultTabComponent?: VueComponent<IDockviewPanelHeaderProps>;
    rightHeaderActionsComponent?: VueComponent<IGroupPanelBaseProps>;
    leftHeaderActionsComponent?: VueComponent<IGroupPanelBaseProps>;
    prefixHeaderActionsComponent?: VueComponent<IGroupPanelBaseProps>;
}

const VUE_PROPERTIES = (() => {
    const _value: Record<keyof VueProps, undefined> = {
        components: undefined,
        tabComponents: undefined,
        watermarkComponent: undefined,
        defaultTabComponent: undefined,
        rightHeaderActionsComponent: undefined,
        leftHeaderActionsComponent: undefined,
        prefixHeaderActionsComponent: undefined,
    };

    return Object.keys(_value) as (keyof VueProps)[];
})();

type VueEvents = {
    ready: [event: DockviewReadyEvent];
};

const DEFAULT_REACT_TAB = 'props.defaultTabComponent';

export type IDockviewVueProps = DockviewOptions & VueProps;

function extractCoreOptions(props: IDockviewVueProps): DockviewOptions {
    const coreOptions = (PROPERTY_KEYS as (keyof DockviewOptions)[]).reduce(
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
const instance = ref<DockviewComponent | null>(null);

PROPERTY_KEYS.forEach((coreOptionKey) => {
    watch(
        () => props[coreOptionKey],
        (newValue, oldValue) => {
            if (instance.value) {
                instance.value.updateOptions({ [coreOptionKey]: newValue });
            }
        }
    );
});

watch(
    () => props.components,
    (newValue, oldValue) => {
        if (instance.value) {
            instance.value.updateOptions({ frameworkComponents: newValue });
        }
    }
);

watch(
    () => [props.tabComponents, props.defaultTabComponent],
    ([newTabComponents, newDefaultTabComponent], oldValue) => {
        if (instance.value) {
            const frameworkTabComponents = newTabComponents ?? {};

            if (newDefaultTabComponent) {
                frameworkTabComponents[DEFAULT_REACT_TAB] =
                    newDefaultTabComponent;
            }

            instance.value.updateOptions({
                defaultTabComponent: newDefaultTabComponent
                    ? DEFAULT_REACT_TAB
                    : undefined,
                frameworkTabComponents,
            });
        }
    }
);

watch(
    () => props.watermarkComponent,
    (newValue, oldValue) => {
        if (instance.value) {
            instance.value.updateOptions({
                watermarkFrameworkComponent: newValue,
            });
        }
    }
);

watch(
    () => props.leftHeaderActionsComponent,
    (newValue, oldValue) => {
        if (instance.value) {
            instance.value.updateOptions({
                headerLeftActionComponent: newValue
                    ? (group) => {
                          return new VueHeaderActionsRenderer(
                              newValue as VueComponent,
                              group
                          );
                      }
                    : undefined,
            });
        }
    }
);

watch(
    () => props.rightHeaderActionsComponent,
    (newValue, oldValue) => {
        if (instance.value) {
            instance.value.updateOptions({
                headerRightActionComponent: newValue
                    ? (group) => {
                          return new VueHeaderActionsRenderer(
                              newValue as VueComponent,
                              group
                          );
                      }
                    : undefined,
            });
        }
    }
);

watch(
    () => props.prefixHeaderActionsComponent,
    (newValue, oldValue) => {
        if (instance.value) {
            instance.value.updateOptions({
                headerPrefixActionComponent: newValue
                    ? (group) => {
                          return new VueHeaderActionsRenderer(
                              newValue as VueComponent,
                              group
                          );
                      }
                    : undefined,
            });
        }
    }
);

onMounted(() => {
    if (!el.value) {
        throw new Error('element is not mounted');
    }

    const frameworkTabComponents = props.tabComponents ?? {};

    if (props.defaultTabComponent) {
        frameworkTabComponents[DEFAULT_REACT_TAB] = props.defaultTabComponent;
    }

    const frameworkOptions: DockviewFrameworkOptions = {
        parentElement: el.value,
        frameworkComponentFactory: {
            content: {
                createComponent: (
                    id: string,
                    componentId: string,
                    component: any
                ): IContentRenderer => {
                    return new VueContentRenderer(component);
                },
            },
            tab: {
                createComponent: (
                    id: string,
                    componentId: string,
                    component: any
                ): ITabRenderer => {
                    return new VueTabRenderer(component);
                },
            },
            watermark: {
                createComponent: (
                    id: string,
                    componentId: string,
                    component: any
                ): IWatermarkRenderer => {
                    return new VueWatermarkRenderer(component);
                },
            },
            // action: {
            //   createComponent: (id: string, componentId: string, component: any): IWatermarkRenderer => {
            //     return new VueHeaderActionRenderer(component)
            //   }
            // }
        },
        frameworkComponents: props.components,
        frameworkTabComponents,
        headerLeftActionComponent: props.leftHeaderActionsComponent
            ? (group) => {
                  return new VueHeaderActionsRenderer(
                      props.leftHeaderActionsComponent as VueComponent,
                      group
                  );
              }
            : undefined,
        headerPrefixActionComponent: props.prefixHeaderActionsComponent
            ? (group) => {
                  return new VueHeaderActionsRenderer(
                      props.prefixHeaderActionsComponent as VueComponent,
                      group
                  );
              }
            : undefined,
        headerRightActionComponent: props.rightHeaderActionsComponent
            ? (group) => {
                  return new VueHeaderActionsRenderer(
                      props.rightHeaderActionsComponent as VueComponent,
                      group
                  );
              }
            : undefined,
        defaultTabComponent: props.defaultTabComponent
            ? DEFAULT_REACT_TAB
            : undefined,
    };

    const dockview = new DockviewComponent({
        ...extractCoreOptions(props),
        ...frameworkOptions,
    });

    instance.value = dockview;
    emit('ready', { api: new DockviewApi(dockview) });
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
