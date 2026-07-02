import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import {
    DockviewVue,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-vue';
// LayoutPriority is a core enum; the framework bundle tree-shakes it out, so
// import it from dockview-core (string-valued, safe across bundles).
import { LayoutPriority } from 'dockview-core';

/**
 * A "complex" responsive demo exercising all three reflow transforms as the
 * container narrows — driven by the *container* width, not the viewport:
 *
 *   lg  (>900px)      canonical — four groups side by side
 *   md  (640–900px)   restack           — flipped from columns to rows
 *   sm  (440–640px)   restack + hide    — low-priority groups parked
 *   xs  (<440px)      collapseToTabs    — everything folded into one tabbed group
 */

const TINTS: Record<string, string> = {
    Files: '#1f6feb',
    'app.ts': '#238636',
    'styles.css': '#238636',
    Properties: '#8957e5',
    Output: '#9e6a03',
};

const Panel = defineComponent({
    name: 'Panel',
    props: {
        params: {
            type: Object as PropType<IDockviewPanelProps>,
            required: true,
        },
    },
    data() {
        return { title: '' };
    },
    computed: {
        tint(): string {
            return TINTS[this.title] ?? '#484f58';
        },
    },
    mounted() {
        const disposable = this.params.api.onDidTitleChange(() => {
            this.title = this.params.api.title;
        });
        this.title = this.params.api.title;
        return () => disposable.dispose();
    },
    template: `
    <div style="height:100%; box-sizing:border-box; padding:12px; color:white;"
         :style="{ borderTop: '2px solid ' + tint }">
      {{ title }}
    </div>`,
});

const BANDS: Record<string, string> = {
    lg: 'lg · ≥900px · canonical — four groups side by side',
    md: 'md · 640–900px · restack — flipped from columns to rows',
    sm: 'sm · 440–640px · restack + hide — low-priority groups parked',
    xs: 'xs · <440px · collapseToTabs — one tabbed group',
};

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        panel: Panel,
    },
    data() {
        return {
            band: 'lg',
            bands: BANDS,
            responsive: {
                breakpoints: [
                    { name: 'lg', maxWidth: Infinity },
                    {
                        name: 'md',
                        maxWidth: 900,
                        exitAt: 980,
                        rules: [{ kind: 'restack' }],
                    },
                    {
                        name: 'sm',
                        maxWidth: 640,
                        exitAt: 720,
                        rules: [{ kind: 'restack' }, { kind: 'hide' }],
                    },
                    {
                        name: 'xs',
                        maxWidth: 440,
                        exitAt: 520,
                        rules: [{ kind: 'collapseToTabs' }],
                    },
                ],
            },
        };
    },
    methods: {
        onReady(event: DockviewReadyEvent) {
            const api = event.api;
            api.onDidBreakpointChange((e) => (this.band = e.to));

            const explorer = api.addPanel({
                id: 'files',
                component: 'panel',
                title: 'Files',
            });
            explorer.group.api.priority = LayoutPriority.Low;

            const editor = api.addPanel({
                id: 'editor',
                component: 'panel',
                title: 'app.ts',
                position: { referencePanel: 'files', direction: 'right' },
            });
            editor.group.api.priority = LayoutPriority.Fill;
            api.addPanel({
                id: 'styles',
                component: 'panel',
                title: 'styles.css',
                position: { referenceGroup: editor.group },
            });

            const inspector = api.addPanel({
                id: 'inspector',
                component: 'panel',
                title: 'Properties',
                position: { referenceGroup: editor.group, direction: 'right' },
            });

            const terminal = api.addPanel({
                id: 'terminal',
                component: 'panel',
                title: 'Output',
                position: {
                    referenceGroup: inspector.group,
                    direction: 'right',
                },
            });
            terminal.group.api.priority = LayoutPriority.Low;

            editor.api.setActive();
            this.band = api.activeBreakpoint ?? 'lg';
        },
    },
    template: `
      <div style="height:100%; display:flex; flex-direction:column;">
        <div style="flex:0 0 auto; padding:6px 10px; font:12px/1.4 ui-monospace,monospace; color:#e6edf3; background:#161b22; border-bottom:1px solid #30363d;">
          {{ bands[band] || ('breakpoint: ' + band) }}
        </div>
        <dockview-vue
          style="flex:1 1 auto; min-height:0;"
          class="dockview-theme-abyss"
          :responsive="responsive"
          @ready="onReady"
        >
        </dockview-vue>
      </div>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
