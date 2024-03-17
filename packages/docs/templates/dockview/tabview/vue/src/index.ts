import 'dockview-core/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import { DockviewVue } from 'dockview-vue';
import {
    DockviewApi,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-core';

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
    <div style="height:100%;padding:20px;color:white;">
      <div>{{title}}</div>
    </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        Panel,
    },
    setup() {
        return {
            components: {
                default: Panel,
            },
        };
    },
    data() {
        return { api: null as DockviewApi | null };
    },
    watch: {
        api(newValue, oldValue) {
            if (!newValue) {
                return;
            }

            const disposable = newValue.onWillShowOverlay((e) => {
                if (e.kind === 'header_space' || e.kind === 'tab') {
                    return;
                }
                e.preventDefault();
            });

            return () => {
                disposable.dispose();
            };
        },
    },
    methods: {
        onReady(event: DockviewReadyEvent) {
            event.api.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            event.api.addPanel({
                id: 'panel_2',
                component: 'default',
            });

            event.api.addPanel({
                id: 'panel_3',
                component: 'default',
            });
            event.api.addPanel({
                id: 'panel_4',
                component: 'default',
            });
            event.api.addPanel({
                id: 'panel_5',
                component: 'default',
            });

            this.api = event.api;
        },
    },
    template: `
      <dockview-vue
        style="width:100%;height:100%"
        class="dockview-theme-abyss"
        @ready="onReady"
        :components="components"
        :disableFloatingGroups=true
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
