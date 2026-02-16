import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import {
    SplitviewVue,
    SplitviewReadyEvent,
    ISplitviewPanelProps,
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
    <div style="height: 100%; padding: 10px; color: white; background: #1e1e1e;">
      Panel {{ panelId }}
    </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'splitview-vue': SplitviewVue,
        panel: Panel,
    },
    methods: {
        onReady(event: SplitviewReadyEvent) {
            event.api.addPanel({
                id: 'panel_1',
                component: 'panel',
                size: 200,
            });

            event.api.addPanel({
                id: 'panel_2',
                component: 'panel',
                size: 300,
            });

            event.api.addPanel({
                id: 'panel_3',
                component: 'panel',
                size: 200,
            });
        },
    },
    template: `
      <splitview-vue
        style="width: 100%; height: 100%"
        class="dockview-theme-abyss"
        orientation="VERTICAL"
        @ready="onReady"
      >
      </splitview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);