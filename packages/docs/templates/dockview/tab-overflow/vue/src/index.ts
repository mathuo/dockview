import { LicenseManager } from 'dockview-enterprise';
import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';

import {
    DockviewVue,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-vue';

// dockview.dev docs license key — replace with your own key in production.
LicenseManager.setLicenseKey(
    '[KeyId:DOCKVIEW-DOCS]_[Company:Dockview]_[Plan:team]_[AppName:Dockview_Docs]_[Email:enterprise@dockview.dev]_[ValidFrom:01_Jan_2025]_[ValidUntil:01_Jan_2099]__aaa294ecec1eed47'
);

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
        this.title = this.params.api.title ?? '';
    },
    template: `
      <div class="example-panel">{{ title }}</div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        default: Panel,
    },
    data() {
        return {
            // Wrap tabs onto multiple rows when they no longer fit on one row.
            overflow: { mode: 'wrap' },
        };
    },
    methods: {
        onReady(event: DockviewReadyEvent) {
            // Open enough panels in a single group that the tabs no longer fit
            // on one row.
            for (let i = 1; i <= 12; i++) {
                event.api.addPanel({
                    id: `panel_${i}`,
                    component: 'default',
                    title: `Panel ${i}`,
                });
            }
        },
    },
    template: `
      <dockview-vue
        style="width:100%;height:100%"
        class="dockview-theme-abyss"
        :overflow="overflow"
        @ready="onReady"
      >
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
