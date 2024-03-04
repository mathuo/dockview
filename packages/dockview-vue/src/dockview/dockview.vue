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
  type DockviewEvents,
  type DockviewFrameworkOptions,
} from 'dockview-core'
import { ref, onMounted, defineProps, defineEmits, watch, onBeforeUnmount } from 'vue'
import {
  VueContentRenderer,
  VueHeaderActionsRenderer,
  VueTabRenderer,
  VueWatermarkRenderer,
  type VueComponent
} from '../utils'


interface VueProps {
  // onReady: (event: DockviewReadyEvent) => void;
  components: Record<string, VueComponent<IDockviewPanelProps>>
  tabComponents?: Record<string, VueComponent<IDockviewPanelHeaderProps>>
  watermarkComponent?: VueComponent<IWatermarkPanelProps>;
  // onDidDrop?: (event: DockviewDidDropEvent) => void;
  // onWillDrop?: (event: DockviewWillDropEvent) => void;
  // showDndOverlay?: (event: DockviewDndOverlayEvent) => boolean;
  className?: string;
  defaultTabComponent?: VueComponent<IDockviewPanelHeaderProps>
  rightHeaderActionsComponent?: VueComponent<IGroupPanelBaseProps>
  leftHeaderActionsComponent?: VueComponent<IGroupPanelBaseProps>
  prefixHeaderActionsComponent?: VueComponent<IGroupPanelBaseProps>
}

type IDockviewVueProps = DockviewOptions & VueProps;

function extractCoreOptions(props: IDockviewVueProps): DockviewOptions {
  const coreOptions = (PROPERTY_KEYS as (keyof DockviewOptions)[]).reduce(
    (obj, key) => {
      (obj as any)[key] = props[key]
      return obj;
    },
    {} as Partial<DockviewOptions>
  );

  return coreOptions as DockviewOptions;
}

type VueEvents = {
  onReady: (event: {api: DockviewApi}) => void;
}

type DockviewVueEvents = DockviewEvents & VueEvents;

interface TestEvents {
  onDidChange: (event: string, a: number) => void;
  onDidChange2?: (event: string, a: number) => void;
}

type StripEventSyntax<T> = T extends `on${infer E}` ? Uncapitalize<E> : T;

type FunctionValue<T extends (...args: any[]) => void> =
  T extends (...args: infer G) => void ? G : never;

type Emitter<T extends Record<string, any>> = { [P in keyof T as StripEventSyntax<P>]-?:
  FunctionValue<T[P]>
}


type VueEmits = Emitter<DockviewVueEvents>

const emit = defineEmits<VueEmits>();
const props = defineProps<IDockviewVueProps>()



const el = ref<HTMLElement | null>(null)
const instance = ref<DockviewComponent | null>(null)

PROPERTY_KEYS.forEach(coreOptionKey => {
  watch(() => props[coreOptionKey], (newValue, oldValue) => {
    if (instance.value) {
      instance.value.updateOptions({ [coreOptionKey]: newValue })
    }
  })
})

onMounted(() => {
  if (!el.value) {
    throw new Error('element is not mounted')
  }

  const frameworkOptions: DockviewFrameworkOptions = {
    parentElement: el.value,
    frameworkComponentFactory: {
      content: {
        createComponent: (id: string, componentId: string, component: any): IContentRenderer => {
          return new VueContentRenderer(component)
        }
      },
      tab: {
        createComponent: (id: string, componentId: string, component: any): ITabRenderer => {
          return new VueTabRenderer(component)
        }
      },
      watermark: {
        createComponent: (id: string, componentId: string, component: any): IWatermarkRenderer => {
          return new VueWatermarkRenderer(component)
        }
      },
      // action: {
      //   createComponent: (id: string, componentId: string, component: any): IWatermarkRenderer => {
      //     return new VueHeaderActionRenderer(component)
      //   }
      // }
    },
    frameworkComponents: props.components,
    frameworkTabComponents: props.tabComponents,
    headerLeftActionComponent: props.leftHeaderActionsComponent ? ((group) => {
      return new VueHeaderActionsRenderer(
        props.leftHeaderActionsComponent as VueComponent,
        group);
    }) : undefined,
    headerPrefixActionComponent: props.prefixHeaderActionsComponent ? (group) => {
      return new VueHeaderActionsRenderer(
        props.prefixHeaderActionsComponent as VueComponent,
        group);
    } : undefined,
    headerRightActionComponent: props.rightHeaderActionsComponent ? (group) => {
      return new VueHeaderActionsRenderer(
        props.rightHeaderActionsComponent as VueComponent,
        group);
    } : undefined,
  }

  const dockview = new DockviewComponent({
    ...extractCoreOptions(props),
    ...frameworkOptions
  })

  instance.value = dockview
  emit("ready", { api: new DockviewApi(dockview) })
})

onBeforeUnmount(() => {
  if (instance.value) {
    instance.value.dispose()
  }
})

</script>

<template>
  <div ref="el" />
</template>
