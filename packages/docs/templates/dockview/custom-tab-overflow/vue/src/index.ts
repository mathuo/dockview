import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import {
    DockviewVue,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-vue';

// Simple panel component
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
            this.title = this.params.api.title;
        });
        this.title = this.params.api.title;

        return () => {
            disposable.dispose();
        };
    },
    template: `
    <div style="height:100%; padding: 16px;">
      <h3>{{ title }}</h3>
      <p>This is a sample panel. Try resizing the window to see the custom overflow behavior.</p>
    </div>`,
});

// Custom tab overflow component
const CustomTabOverflow = defineComponent({
    name: 'CustomTabOverflow',
    props: {
        event: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            isOpen: false,
        };
    },
    watch: {
        'event.isVisible'(newValue: boolean) {
            if (!newValue) {
                this.isOpen = false;
            }
        },
    },
    methods: {
        activateTab(tab: any) {
            tab.panel.api.setActive();
            this.isOpen = false;
        },
    },
    template: `
    <div v-if="event.isVisible" style="position: relative;">
      <button
        @click="isOpen = !isOpen"
        style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; 
               background: white; cursor: pointer; font-size: 12px;"
      >
        +{{ event.tabs.length }} more
      </button>
      
      <div
        v-if="isOpen"
        style="position: absolute; top: 100%; right: 0; background: white; 
               border: 1px solid #ccc; border-radius: 4px; 
               box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 200px;"
      >
        <div
          v-for="tab in event.tabs"
          :key="tab.id"
          @click="activateTab(tab)"
          style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;"
          :style="{ backgroundColor: tab.isActive ? '#e6f3ff' : 'transparent' }"
        >
          {{ tab.title }}
          <span v-if="tab.isActive" style="margin-left: 8px; font-weight: bold;">
            (active)
          </span>
        </div>
      </div>
    </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        panel: Panel,
        'custom-tab-overflow': CustomTabOverflow,
    },
    methods: {
        onReady(event: DockviewReadyEvent) {
            // Add multiple panels to trigger overflow
            for (let i = 1; i <= 8; i++) {
                event.api.addPanel({
                    id: `panel_${i}`,
                    component: 'panel',
                    title: `Panel ${i}`,
                });
            }
        },
    },
    template: `
      <dockview-vue
        style="width:100%; height:100%"
        class="dockview-theme-abyss"
        :tab-overflow-component="'custom-tab-overflow'"
        @ready="onReady"
      >
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);