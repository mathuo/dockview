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
        params: {
            type: Object as PropType<ISplitviewPanelProps>,
            required: true,
        },
    },
    data() {
        return {
            id: '',
        };
    },
    mounted() {
        this.id = this.params.api.id;
    },
    template: `
    <div style="height: 100%; padding: 10px; color: white; background: #1e1e1e;">
      Panel {{ id }}
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
        orientation="horizontal"
        @ready="onReady"
      >
      </splitview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);