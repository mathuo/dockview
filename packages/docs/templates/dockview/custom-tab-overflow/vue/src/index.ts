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

// Custom trigger component (appears in the tab header)
const CustomTrigger = defineComponent({
    name: 'CustomTrigger',
    props: {
        event: {
            type: Object,
            required: true,
        },
    },
    template: `
    <button 
      v-if="event.isVisible"
      style="background: linear-gradient(45deg, #ff6b6b, #feca57); 
             color: white; border: none; border-radius: 50%; 
             width: 28px; height: 28px; font-size: 12px; 
             font-weight: bold; cursor: pointer; 
             box-shadow: 0 2px 4px rgba(0,0,0,0.2);
             display: flex; align-items: center; justify-content: center;"
    >
      {{ event.tabs.length }}
    </button>`,
});

// Custom content component (the overflow menu)
const CustomContent = defineComponent({
    name: 'CustomContent',
    props: {
        event: {
            type: Object,
            required: true,
        },
    },
    methods: {
        activateTab(tab: any) {
            tab.panel.api.setActive();
        },
    },
    template: `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px; padding: 16px; min-width: 280px; 
                color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px; text-align: center;">
        📋 Hidden Tabs ({{ event.tabs.length }})
      </div>
      
      <div style="max-height: 300px; overflow-y: auto;">
        <div
          v-for="tab in event.tabs"
          :key="tab.id"
          @click="activateTab(tab)"
          style="padding: 12px; margin: 6px 0; border-radius: 8px; 
                 cursor: pointer; transition: all 0.2s ease;
                 display: flex; align-items: center; justify-content: space-between;"
          :style="{
            background: tab.isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: tab.isActive ? '2px solid rgba(255, 255, 255, 0.6)' : '2px solid transparent'
          }"
        >
          <span :style="{ fontWeight: tab.isActive ? 'bold' : 'normal' }">
            {{ tab.title }}
          </span>
          <span 
            v-if="tab.isActive"
            style="font-size: 12px; background: rgba(255,255,255,0.3);
                   padding: 2px 6px; border-radius: 4px;"
          >
            ✓ Active
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
        'custom-trigger': CustomTrigger,
        'custom-content': CustomContent,
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
        :tab-overflow-component="{ trigger: 'custom-trigger', content: 'custom-content' }"
        @ready="onReady"
      >
      </dockview-vue>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);