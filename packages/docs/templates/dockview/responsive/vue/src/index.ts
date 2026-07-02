import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import {
    DockviewVue,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-vue';

const Panel = defineComponent({
    inject: ['vu3ProvideInjectEvidenceTestMessage'],
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
            message: this.vu3ProvideInjectEvidenceTestMessage ?? 'not found',
        };
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
    <div style="height:100%; color:red;">
      Hello World
      <div>{{title}}</div>
      <div>{{message}}</div>
    </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        panel: Panel,
    },
    data() {
        // Below 600px the side-by-side groups collapse into one tabbed group;
        // above 680px they expand back out (container-driven, not viewport).
        return {
            responsive: {
                breakpoints: [
                    { name: 'lg', maxWidth: Infinity },
                    {
                        name: 'sm',
                        maxWidth: 600,
                        exitAt: 680,
                        rules: [{ kind: 'collapseToTabs' }],
                    },
                ],
            },
        };
    },
    methods: {
        onReady(event: DockviewReadyEvent) {
            event.api.addPanel({
                id: 'sidebar',
                component: 'panel',
                title: 'Sidebar',
            });
            event.api.addPanel({
                id: 'editor',
                component: 'panel',
                title: 'Editor',
                position: { referencePanel: 'sidebar', direction: 'right' },
            });
            event.api.addPanel({
                id: 'inspector',
                component: 'panel',
                title: 'Inspector',
                position: { referencePanel: 'editor', direction: 'right' },
            });
        },
    },
    provide() {
        return {
            vu3ProvideInjectEvidenceTestMessage: 'Hello from the provider',
        };
    },
    template: `
      <dockview-vue
        style="width:100%; height:100%"
        class="dockview-theme-abyss"
        :responsive="responsive"
        @ready="onReady"
      >
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
