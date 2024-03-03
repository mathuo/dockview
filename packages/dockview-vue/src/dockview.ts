import { PropType, VNode, defineComponent, h, getCurrentInstance } from 'vue';
import {
    DockviewComponent,
    DockviewDropEvent,
    DockviewDndOverlayEvent,
    GroupPanelFrameworkComponentFactory,
    DockviewPanelApi,
    DockviewApi,
    IContentRenderer,
    ITabRenderer,
    DockviewGroupPanel,
    IHeaderActionsRenderer,
} from 'dockview-core';

export interface DockviewReadyEvent {
    api: DockviewApi;
}

export interface IDockviewVueProps {
    onReady: (event: DockviewReadyEvent) => void;
    // components: PanelCollection<IDockviewPanelProps>;
    // tabComponents?: PanelCollection<IDockviewPanelHeaderProps>;
    // watermarkComponent?: React.FunctionComponent<IWatermarkPanelProps>;
    onDidDrop?: (event: DockviewDropEvent) => void;
    showDndOverlay?: (event: DockviewDndOverlayEvent) => boolean;
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
}

export const DockviewVue = defineComponent({
    render(): VNode {
        return h('div');
    },
    props: { type: Object as PropType<IDockviewVueProps> },
    data(): {
        api: DockviewApi | undefined;
        instance: DockviewComponent | undefined;
    } {
        return { api: undefined, instance: undefined };
    },
    watch: {},
    computed: {},
    methods: {
        getProvides() {
            let instance = getCurrentInstance() as any;
            let provides = {};

            while (instance) {
                if (instance && instance.provides) {
                    provides = { ...provides, ...instance.provides };
                }

                instance = instance.parent;
            }

            return provides;
        },
    },
    mounted() {
        this.instance = new DockviewComponent({ parentElement: this.$el });
    },
    unmounted() {
        if (this.instance) {
            this.instance.dispose();
        }
    },
});
