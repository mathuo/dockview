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
    data() {
        return {
            value: '',
            title: '',
        };
    },
    methods: {
        onChangeTitle() {
            this.api.setTitle(this.value);
        },
        updateTitle(title: string) {
            this.title = title;
        },
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
    <div style="height:100%;padding:20px;">
      <div>
        <span style="color:grey;">props.api.title=</span>
        <span style="color:white;">{{ title }}</span>
      </div>
      <input v-model="value"/>
      <button @click="onChangeTitle">Change</button>
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
    methods: {
        onReady(event: DockviewReadyEvent) {
            const panel = event.api.addPanel({
                id: 'panel_1',
                component: 'default',
                title: 'Panel 1',
            });

            event.api.addPanel({
                id: 'panel_2',
                component: 'default',
                title: 'Panel 2',
                position: { referencePanel: panel },
            });

            const panel3 = event.api.addPanel({
                id: 'panel_3',
                component: 'default',
                title: 'Panel 3',

                position: { referencePanel: panel, direction: 'right' },
            });

            event.api.addPanel({
                id: 'panel_4',
                component: 'default',
                title: 'Panel 4',
                position: { referencePanel: panel3 },
            });
        },
    },
    template: `
      <dockview-vue
        style="width:100%;height:100%"
        class="dockview-theme-abyss"
        @ready="onReady"
        :components="components"
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
