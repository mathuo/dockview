<script setup lang="ts">
import {
  DockviewApi,
  DockviewComponent,
  type DockviewDndOverlayEvent,
  type DockviewPanelRenderer,
  type DroptargetOverlayModel,
  type IContentRenderer,
  type ITabRenderer,
  type IWatermarkRenderer
} from 'dockview-core'
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import {
  VueContentRenderer,
  VueTabRenderer,
  VueWatermarkRenderer,
  type ComponentInterface
} from './utils'

interface Props {
  // onReady: (event: DockviewReadyEvent) => void;
  components: Record<string, any>
  tabComponents?: Record<string, any>
  // watermarkComponent?: React.FunctionComponent<IWatermarkPanelProps>;
  // onDidDrop?: (event: DockviewDidDropEvent) => void;
  // onWillDrop?: (event: DockviewWillDropEvent) => void;
  // showDndOverlay?: (event: DockviewDndOverlayEvent) => boolean;
  hideBorders?: boolean;
  className?: string;
  disableAutoResizing?: boolean;
  // defaultTabComponent?: React.FunctionComponent<IDockviewPanelHeaderProps>;
  // rightHeaderActionsComponent?: React.FunctionComponent<IDockviewHeaderActionsProps>;
  // leftHeaderActionsComponent?: React.FunctionComponent<IDockviewHeaderActionsProps>;
  // prefixHeaderActionsComponent?: React.FunctionComponent<IDockviewHeaderActionsProps>;
  singleTabMode?: 'fullwidth' | 'default';
  disableFloatingGroups?: boolean;
  floatingGroupBounds?:
  | 'boundedWithinViewport'
  | {
    minimumHeightWithinViewport?: number;
    minimumWidthWithinViewport?: number;
  };
  debug?: boolean;
  defaultRenderer?: DockviewPanelRenderer;
  rootOverlayModel?: DroptargetOverlayModel
  locked?: boolean;
  disableDnd?: boolean;
}

interface Emits {
  (event: 'ready', value: { api: DockviewApi }): void
  (event: 'showDndOverlay', value: DockviewDndOverlayEvent):void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const el = ref<HTMLElement | null>(null)
const instance = ref<DockviewComponent | null>(null)

watch(() => props.components, (newValue, oldValue) => {
  if (instance.value) {
    instance.value.updateOptions({ components: newValue })
  }
})

onMounted(() => {
  if (!el.value) {
    throw new Error('element is not mounted')
  }

  const dockview = new DockviewComponent({
    parentElement: el.value,
    frameworkComponentFactory: {
      content: {
        createComponent: (id: string, componentId: string, component: any): IContentRenderer => {
          console.log('dockview-vue: createComponent')

          return new VueContentRenderer(component as ComponentInterface)
        }
      },
      tab: {
        createComponent: (id: string, componentId: string, component: any): ITabRenderer => {
          return new VueTabRenderer(component as ComponentInterface)
        }
      },
      watermark: {
        createComponent: (id: string, componentId: string, component: any): IWatermarkRenderer => {
          return new VueWatermarkRenderer(component as ComponentInterface)
        }
      }
    },
    frameworkComponents: props.components,
    disableAutoResizing: props.disableAutoResizing,
    frameworkTabComponents: props.tabComponents,
    singleTabMode: props.singleTabMode,
    disableFloatingGroups: props.disableFloatingGroups,
    floatingGroupBounds: props.floatingGroupBounds,
    defaultRenderer: props.defaultRenderer,
    debug: props.debug,
    rootOverlayModel: props.rootOverlayModel,
    locked: props.locked,
    disableDnd: props.disableDnd,
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
