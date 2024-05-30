import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import {
    DockviewVue,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-vue';

const Panel = defineComponent({
    name: 'Panel',
    props: {
        params: {
            type: Object as PropType<IDockviewPanelProps>,
            required: true,
        },
    },
    data() {
        return {
            title: '',
        };
    },

    mounted() {
        const disposable = this.params.api.onDidTitleChange(() => {
            this.title = this.api.title;
        });
        this.title = this.api.title;

        return () => {
            disposable.dispose();
        };
    },

    template: `
      <div style="height:100%;padding:20px;">
        <span style="color:white;">{{ title }}</span>
      </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        default: Panel,
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
                position: {
                    direction: 'right',
                    referencePanel: 'panel_1',
                },
            });
            event.api.addPanel({
                id: 'panel_3',
                component: 'default',
                position: {
                    direction: 'below',
                    referencePanel: 'panel_1',
                },
            });
            event.api.addPanel({
                id: 'panel_4',
                component: 'default',
            });
            event.api.addPanel({
                id: 'panel_5',
                component: 'default',
            });
        },
    },
    template: `
      <dockview-vue
        style="width:100%;height:100%"
        class="dockview-theme-abyss"
        @ready="onReady"
        :locked=true
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
