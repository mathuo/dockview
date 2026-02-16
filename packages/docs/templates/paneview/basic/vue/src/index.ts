import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import {
    PaneviewVue,
    PaneviewReadyEvent,
    IPaneviewPanelProps,
} from 'dockview-vue';

const Panel = defineComponent({
    name: 'Panel',
    props: {
        api: {
            type: Object,
            required: true,
        },
        containerApi: {
            type: Object,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        params: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            panelId: '',
        };
    },
    mounted() {
        this.panelId = this.api.id;
    },
    template: `
    <div style="height: 100%; padding: 10px; color: white; background: #1e1e1e; border: 1px solid #333;">
      Panel {{ panelId }}
    </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'paneview-vue': PaneviewVue,
        panel: Panel,
    },
    methods: {
        onReady(event: PaneviewReadyEvent) {
            event.api.addPanel({
                id: 'panel_1',
                component: 'panel',
                title: 'Panel 1',
                size: 150,
            });

            event.api.addPanel({
                id: 'panel_2',
                component: 'panel',
                title: 'Panel 2',
                size: 200,
            });

            event.api.addPanel({
                id: 'panel_3',
                component: 'panel',
                title: 'Panel 3',
                size: 180,
            });
        },
    },
    template: `
      <paneview-vue
        style="width: 100%; height: 100%"
        class="dockview-theme-abyss"
        orientation="VERTICAL"
        @ready="onReady"
      >
      </paneview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);