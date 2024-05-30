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
            running: false,
            title: '',
        };
    },
    methods: {
        onClick() {
            this.running = !this.running;
        },
    },
    watch: {
        running(newValue, oldValue) {
            if (!newValue) {
                return;
            }

            console.log('interval');

            const interval = setInterval(() => {
                this.params.api.updateParameters({ myValue: Date.now() });
            }, 1000);
            this.parmas.api.updateParameters({ myValue: Date.now() });

            return () => {
                clearInterval(interval);
            };
        },
    },
    mounted() {
        const disposable = this.params.api.onDidTitleChange(() => {
            this.title = this.params.api.title;
        });
        this.title = this.params.api.title;

        return () => {
            disposable.dispose();
        };
    },
    template: `
    <div style="height:100%;padding:20px;color:white;">
      <div>{{title}}</div>
      <button v-if="running" @click="onClick">Stop</button>
      <button v-if="!running" @click="onClick">Start</button>
      <span>{{title}}</span>
    </div>`,
});

interface CustomParams {
    myValue: number;
}

const Tab = defineComponent({
    name: 'Tab',
    props: {
        params: {
            type: Object as PropType<IDockviewPanelHeaderProps<CustomParams>>,
            required: true,
        },
    },
    data() {
        return {
            myValue: this.params.params.myValue,
            title: '',
        };
    },
    methods: {
        onClick() {
            this.running = !this.running;
        },
    },
    watch: {
        params(newValue, oldValue) {
            this.myValue = newValue.myValue;
        },
        running(newValue, oldValue) {
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
      <div>
        <div>custom tab: {{title}}</div>
        <span>value: {{myValue}}</span>
      </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
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
