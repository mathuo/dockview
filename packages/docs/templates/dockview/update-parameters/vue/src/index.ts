import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import {
    DockviewVue,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
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
            isRunning: false,
            title: null,
        };
    },
    methods: {
        toggle() {
            this.isRunning = !this.isRunning;
        },
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
    watch: {
        isRunning(newValue, oldValue) {
            if (!newValue) {
                return;
            }

            const interval = setInterval(() => {
                this.params.api.updateParameters({ myValue: Date.now() });
            }, 1000);
            this.params.api.updateParameters({ myValue: Date.now() });

            return () => {
                clearInterval(interval);
            };
        },
    },
    template: `
      <div style="height:100%;color:white;">
        <div>{{title}}</div>
        <button v-if="!isRunning" @click="toggle">Start</button>
        <button v-if="isRunning" @click="toggle">Stop</button>
      </div>`,
});

const Tab = defineComponent({
    name: 'Tab',
    props: {
        params: {
            type: Object as PropType<
                IDockviewPanelHeaderProps<{ myValue: number }>
            >,
            required: true,
        },
    },
    data() {
        return {
            title: '',
            value: this.params.params.myValue,
        };
    },
    mounted() {
        const disposable = this.params.api.onDidTitleChange(() => {
            this.title = this.api.title;
        });

        const disposable2 = this.params.api.onDidParametersChange(() => {
            console.log(this.params);
            this.value = this.params.params.myValue;
        });

        this.title = this.api.title;
        this.value = this.params.params.myValue;

        return () => {
            disposable.dispose();
            disposable2.dispose();
        };
    },
    template: `
    <div>
      <div>custom tab: {{title}}</div>
      <div>value: {{value}}</div>
    </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        Panel,
        defaultPanel: Panel,
        defaultTab: Tab,
    },
    methods: {
        onReady(event: DockviewReadyEvent) {
            event.api.addPanel({
                id: 'panel_1',
                component: 'defaultPanel',
                tabComponent: 'defaultTab',
                params: {
                    myValue: Date.now(),
                },
            });

            event.api.addPanel({
                id: 'panel_2',
                component: 'defaultPanel',
                tabComponent: 'defaultTab',
                params: {
                    myValue: Date.now(),
                },
            });
        },
    },
    template: `
      <dockview-vue
        style="width:100%;height:100%"
        class="dockview-theme-abyss"
        @ready="onReady"
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
