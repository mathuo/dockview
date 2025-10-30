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
        params: {
            type: Object as PropType<IPaneviewPanelProps>,
            required: true,
        },
    },
    data() {
        return {
            id: '',
            title: '',
        };
    },
    mounted() {
        this.id = this.params.api.id;
        this.title = this.params.api.title;
    },
    template: `
    <div style="height: 100%; padding: 10px; color: white; background: #1e1e1e; border: 1px solid #333;">
      Panel {{ id }}
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
        orientation="vertical"
        @ready="onReady"
      >
      </paneview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);