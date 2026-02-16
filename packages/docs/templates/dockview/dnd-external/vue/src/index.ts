import { createApp, ref, onUnmounted, defineComponent, PropType } from 'vue';
import { DockviewVue, DockviewReadyEvent, DockviewApi, positionToDirection, DockviewDidDropEvent, IDockviewPanelProps } from 'dockview-vue';
import 'dockview-core/dist/styles/dockview.css';

const DefaultPanel = defineComponent({
    name: 'DefaultPanel',
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
        <div style="padding: 20px;">
            <div>{{ title || 'Panel' }}</div>
        </div>
    `
});

const DraggableElement = defineComponent({
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
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        default: DefaultPanel,
        'draggable-element': DraggableElement,
    },
    setup() {
        const api = ref<DockviewApi | null>(null);
        const disposables: any[] = [];

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
            onReady,
            onDidDrop,
            onDrop,
        };
    },
    template: `
        <div style="display: flex; flex-direction: column; height: 100%;">
            <div style="margin: 2px 0px;">
                <draggable-element />
                <div
                    style="padding: 0px 4px; background-color: black; border-radius: 2px; color: white;"
                    @drop="onDrop">
                    Drop a tab or group here to inspect the attached metadata
                </div>
            </div>
            <dockview-vue
                style="width: 100%; flex-grow: 1"
                class="dockview-theme-abyss"
                :dnd-edges="{ size: { value: 100, type: 'pixels' }, activationSize: { value: 5, type: 'percentage' } }"
                @ready="onReady"
                @didDrop="onDidDrop">
            </dockview-vue>
        </div>
    `
});

createApp(App).mount('#app');
