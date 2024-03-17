import 'dockview-core/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import { DockviewVue } from 'dockview-vue';
import { DockviewReadyEvent, IDockviewPanelProps } from 'dockview-core';

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
    setup(props) {
        return {
            title: props.api.title,
        };
    },
    template: `
    <div style="height:100%; color:red;">
      Hello World
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
                panel: Panel,
            },
        };
    },
    methods: {
        onReady(event: DockviewReadyEvent) {
            console.log('ready');

            event.api.addPanel({
                id: 'panel_1',
                component: 'panel',
                title: 'Panel 1',
            });
        },
    },
    template: `
      <dockview-vue
        style="width:100%; height:100%"
        class="dockview-theme-abyss"
        @ready="onReady"
        :components="components"
      >
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
