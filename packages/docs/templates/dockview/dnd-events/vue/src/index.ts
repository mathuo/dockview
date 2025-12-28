import { createApp, ref, onMounted, onUnmounted, watchEffect } from 'vue';
import { DockviewVue, DockviewReadyEvent, DockviewApi } from 'dockview-vue';
import 'dockview-core/dist/styles/dockview.css';

const DefaultPanelComponent = {
    name: 'DefaultPanelComponent',
    props: ['api'],
    template: `
        <div style="height: 100%;">
            <div>{{ api?.title || 'Panel' }}</div>
        </div>
    `
};

const App = {
    name: 'App',
    components: {
        DockviewVue,
        'default-panel': DefaultPanelComponent,
    },
    setup() {
        const api = ref<DockviewApi | null>(null);
        const disablePanelDrag = ref(false);
        const disableGroupDrag = ref(false);
        const disableOverlay = ref(false);
        
        const disposables: any[] = [];

        const components = {
            default: DefaultPanelComponent,
        };

        const setupEventListeners = () => {
            if (!api.value) return;

            // Clear existing disposables
            disposables.forEach(d => d?.dispose?.());
            disposables.length = 0;

            disposables.push(
                api.value.onWillDragPanel((e: any) => {
                    if (disablePanelDrag.value) {
                        e.nativeEvent.preventDefault();
                    }
                }),

                api.value.onWillDragGroup((e: any) => {
                    if (disableGroupDrag.value) {
                        e.nativeEvent.preventDefault();
                    }
                }),

                api.value.onWillShowOverlay((e: any) => {
                    console.log(e);
                    if (disableOverlay.value) {
                        e.preventDefault();
                    }
                }),

                api.value.onWillDrop((e: any) => {
                    // Handle will drop
                }),

                api.value.onDidDrop((e: any) => {
                    // Handle did drop
                })
            );
        };

        // Watch for changes in the disable flags
        watchEffect(() => {
            if (api.value) {
                setupEventListeners();
            }
        });

        onUnmounted(() => {
            disposables.forEach(d => d?.dispose?.());
        });

        const onReady = (event: DockviewReadyEvent) => {
            api.value = event.api;

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

            setupEventListeners();
        };

        const togglePanelDrag = () => {
            disablePanelDrag.value = !disablePanelDrag.value;
        };

        const toggleGroupDrag = () => {
            disableGroupDrag.value = !disableGroupDrag.value;
        };

        const toggleOverlay = () => {
            disableOverlay.value = !disableOverlay.value;
        };

        return {
            components,
            onReady,
            disablePanelDrag,
            disableGroupDrag,
            disableOverlay,
            togglePanelDrag,
            toggleGroupDrag,
            toggleOverlay,
        };
    },
    template: `
        <div style="display: flex; flex-direction: column; height: 100vh;">
            <div>
                <button @click="togglePanelDrag">
                    Panel Drag: {{ disablePanelDrag ? 'disabled' : 'enabled' }}
                </button>
                <button @click="toggleGroupDrag">
                    Group Drag: {{ disableGroupDrag ? 'disabled' : 'enabled' }}
                </button>
                <button @click="toggleOverlay">
                    Overlay: {{ disableOverlay ? 'disabled' : 'enabled' }}
                </button>
            </div>
            <div style="flex-grow: 1;">
                <dockview-vue
                    :components="components"
                    class-name="dockview-theme-abyss"
                    @ready="onReady">
                </dockview-vue>
            </div>
        </div>
    `
};

createApp(App).mount('#app');