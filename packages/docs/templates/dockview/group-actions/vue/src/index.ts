import 'dockview-core/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import { DockviewVue } from 'dockview-vue';
import {
    DockviewGroupPanelApi,
    DockviewReadyEvent,
    IDockviewHeaderActionsProps,
    IDockviewPanelProps,
} from 'dockview-core';
import './app.css';

const LeftAction = defineComponent({
    name: 'LeftAction',
    props: {
        containerApi: {
            type: Object as PropType<
                IDockviewHeaderActionsProps['containerApi']
            >,
            required: true,
        },
        api: {
            type: Object as PropType<IDockviewHeaderActionsProps['api']>,
            required: true,
        },
        group: {
            type: Object as PropType<IDockviewHeaderActionsProps['group']>,
            required: true,
        },
    },
    data() {
        return {
            activePanel: null,
        };
    },
    mounted() {
        const disposable = this.api.onDidActivePanelChange((event) => {
            this.activePanel = event.panel.id;
        });

        this.activePanel = this.group.activePanel.id;

        return () => {
            disposable.dispose();
        };
    },
    template: `
      <div class="dockview-groupcontrol-demo">
        <span class="dockview-groupcontrol-demo-active-panel">
          "Active Panel " {{ activePanel }}
        </span>
      </div>`,
});

const RightAction = defineComponent({
    name: 'RightAction',
    props: {
        containerApi: {
            type: Object as PropType<
                IDockviewHeaderActionsProps['containerApi']
            >,
            required: true,
        },
        api: {
            type: Object as PropType<IDockviewHeaderActionsProps['api']>,
            required: true,
        },
        group: {
            type: Object as PropType<IDockviewHeaderActionsProps['group']>,
            required: true,
        },
    },
    data() {
        return {
            isGroupActive: false,
        };
    },
    mounted() {
        const disposable = this.api.onDidActiveChange((event) => {
            this.isGroupActive = event.isActive;
        });

        this.isActive = this.api.isActive;

        return () => {
            disposable.dispose();
        };
    },
    template: `
    <div class="dockview-groupcontrol-demo">
      <span v-if="isGroupActive" style="color:green;" class="dockview-groupcontrol-demo-active-panel">
        Group Active
      </span>
      <span v-if="!isGroupActive" style="color:red;" class="dockview-groupcontrol-demo-active-panel">
        Group Inactive
      </span>
    </div>`,
});

const PrefixAction = defineComponent({
    name: 'PrefixAction',
    props: {
        containerApi: {
            type: Object as PropType<
                IDockviewHeaderActionsProps['containerApi']
            >,
            required: true,
        },
        group: {
            type: Object as PropType<IDockviewHeaderActionsProps['group']>,
            required: true,
        },
    },
    template: `<div class="dockview-groupcontrol-demo">🌲</div>`,
});

const Panel = defineComponent({
    name: 'Panel',
    props: {
        api: {
            type: Object as PropType<IDockviewPanelProps['api']>,
            required: true,
        },
        containerApi: {
            type: Object as PropType<IDockviewPanelProps['containerApi']>,
            required: true,
        },
        params: {
            type: Object as PropType<IDockviewPanelProps['params']>,
            required: true,
        },
    },
    data() {
        return {
            title: '',
        };
    },

    mounted() {
        const disposable = this.api.onDidTitleChange(() => {
            this.title = this.api.title;
        });
        this.title = this.api.title;

        return () => {
            disposable.dispose();
        };
    },
    template: `
      <div style="color:white;">
        <div>{{title}}</div>
      </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        Panel,
        LeftAction,
        RightAction,
        PrefixAction,
    },
    data() {
        return {
            components: {
                default: Panel,
            },
            leftAction: LeftAction,
            rightAction: RightAction,
            prefixAction: PrefixAction,
        };
    },
    methods: {
        onReady(event: DockviewReadyEvent) {
            event.api.addPanel({
                id: 'panel_1',
                component: 'default',
                title: 'Panel 1',
            });

            event.api.addPanel({
                id: 'panel_2',
                component: 'default',
                title: 'Panel 2',
                position: {
                    direction: 'right',
                },
            });

            event.api.addPanel({
                id: 'panel_3',
                component: 'default',
                title: 'Panel 3',
                position: {
                    direction: 'below',
                },
            });
        },
    },
    template: `
      <dockview-vue
        style="width:100%;height:100%"
        class="dockview-theme-abyss"
        @ready="onReady"
        :components="components"
        :leftHeaderActionsComponent="leftAction"
        :rightHeaderActionsComponent="rightAction"
        :prefixHeaderActionsComponent="prefixAction"
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
