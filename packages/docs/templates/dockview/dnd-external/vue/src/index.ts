import { createApp, ref, onMounted, onUnmounted } from 'vue';
import { DockviewVue, DockviewReadyEvent, DockviewApi, positionToDirection, DockviewDidDropEvent } from 'dockview-vue';
import 'dockview-core/dist/styles/dockview.css';

const DefaultPanelComponent = {
    name: 'DefaultPanelComponent',
    props: ['params'],
    template: `
        <div style="padding: 20px;">
            <div>{{ params?.title || 'Panel' }}</div>
        </div>
    `
};

const DraggableElement = {
    name: 'DraggableElement',
    template: `
        <span
            tabindex="-1"
            @dragstart="onDragStart"
            style="background-color: orange; padding: 0px 8px; border-radius: 4px; width: 100px; cursor: pointer;"
            draggable="true">
            Drag me into the dock
        </span>
    `,
    methods: {
        onDragStart(event: DragEvent) {
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', 'nothing');
            }
        }
    }
};

const App = {
    name: 'App',
    components: {
        DockviewVue,
        'default-panel': DefaultPanelComponent,
        'draggable-element': DraggableElement,
    },
    setup() {
        const api = ref<DockviewApi | null>(null);
        const disposables: any[] = [];

        const components = {
            default: DefaultPanelComponent,
        };

        const setupDragListeners = () => {
            if (!api.value) return;

            // Clear existing disposables
            disposables.forEach(d => d?.dispose?.());
            disposables.length = 0;

            const panelDragDisposable = api.value.onWillDragPanel((event: any) => {
                const dataTransfer = event.nativeEvent.dataTransfer;
                if (dataTransfer) {
                    dataTransfer.setData('text/plain', 'Some custom panel data transfer data');
                    dataTransfer.setData('text/json', '{text: "Some custom panel data transfer data"}');
                }
            });

            const groupDragDisposable = api.value.onWillDragGroup((event: any) => {
                const dataTransfer = event.nativeEvent.dataTransfer;
                if (dataTransfer) {
                    dataTransfer.setData('text/plain', 'Some custom group data transfer data');
                    dataTransfer.setData('text/json', '{text: "Some custom group data transfer data"}');
                }
            });

            const unhandledDragDisposable = api.value.onUnhandledDragOverEvent((event: any) => {
                event.accept();
            });

            disposables.push(panelDragDisposable, groupDragDisposable, unhandledDragDisposable);
        };

        onUnmounted(() => {
            disposables.forEach(d => d?.dispose?.());
        });

        const onReady = (event: DockviewReadyEvent) => {
            api.value = event.api;

            event.api.addPanel({
                id: 'panel_1',
                component: 'default',
                params: { title: 'Panel 1' },
            });

            event.api.addPanel({
                id: 'panel_2',
                component: 'default',
                params: { title: 'Panel 2' },
            });

            event.api.addPanel({
                id: 'panel_3',
                component: 'default',
                params: { title: 'Panel 3' },
            });

            event.api.addPanel({
                id: 'panel_4',
                component: 'default',
                params: { title: 'Panel 4' },
                position: { referencePanel: 'panel_1', direction: 'right' },
            });

            setupDragListeners();
        };

        const onDidDrop = (event: DockviewDidDropEvent) => {
            event.api.addPanel({
                id: 'test',
                component: 'default',
                position: {
                    direction: positionToDirection(event.position),
                    referenceGroup: event.group || undefined,
                },
            });
        };

        const onDrop = (event: DragEvent) => {
            const dataTransfer = event.dataTransfer;
            if (!dataTransfer) return;

            let text = 'The following dataTransfer data was found:\n';
            
            for (let i = 0; i < dataTransfer.items.length; i++) {
                const item = dataTransfer.items[i];
                const value = dataTransfer.getData(item.type);
                text += `type=${item.type},data=${value}\n`;
            }

            alert(text);
        };

        return {
            components,
            onReady,
            onDidDrop,
            onDrop,
        };
    },
    template: `
        <div style="display: flex; flex-direction: column; height: 100vh;">
            <div style="margin: 2px 0px;">
                <draggable-element />
                <div 
                    style="padding: 0px 4px; background-color: black; border-radius: 2px; color: white;"
                    @drop="onDrop">
                    Drop a tab or group here to inspect the attached metadata
                </div>
            </div>
            <dockview-vue
                :components="components"
                class-name="dockview-theme-abyss"
                :dnd-edges="{ size: { value: 100, type: 'pixels' }, activationSize: { value: 5, type: 'percentage' } }"
                @ready="onReady"
                @didDrop="onDidDrop">
            </dockview-vue>
        </div>
    `
};

createApp(App).mount('#app');