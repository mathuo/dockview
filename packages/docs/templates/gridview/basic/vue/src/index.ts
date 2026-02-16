import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import {
    GridviewVue,
    GridviewReadyEvent,
    IGridviewPanelProps,
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
    <div style="height: 100%; padding: 10px; color: white; background: #1e1e1e; border: 1px solid #333;">
      Panel {{ panelId }}
    </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'gridview-vue': GridviewVue,
        panel: Panel,
    },
    methods: {
        onReady(event: GridviewReadyEvent) {
            const panel1 = event.api.addPanel({
                id: 'panel_1',
                component: 'panel',
            });

            const panel2 = event.api.addPanel({
                id: 'panel_2',
                component: 'panel',
                position: { referencePanel: panel1.id, direction: 'right' },
            });

            event.api.addPanel({
                id: 'panel_3',
                component: 'panel',
                position: { referencePanel: panel1.id, direction: 'below' },
            });

            event.api.addPanel({
                id: 'panel_4',
                component: 'panel',
                position: { referencePanel: panel2.id, direction: 'below' },
            });
        },
    },
    template: `
      <gridview-vue
        style="width: 100%; height: 100%"
        class="dockview-theme-abyss"
        @ready="onReady"
      >
      </gridview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);