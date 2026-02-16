import { createApp, ref, onMounted, defineComponent, PropType } from 'vue';
import { DockviewVue, DockviewReadyEvent, IDockviewPanelProps } from 'dockview-vue';
import 'dockview-core/dist/styles/dockview.css';

const DefaultPanel = defineComponent({
    name: 'DefaultPanel',
    props: {
        params: {
            type: Object as PropType<IDockviewPanelProps>,
            required: true,
        },
    },
    setup(props) {
        const constraints = ref<any>(null);

        onMounted(() => {
            if (props.params?.api?.group?.api) {
                props.params.api.group.api.onDidConstraintsChange((event: any) => {
                    constraints.value = event;
                });
            }
        });

        const setConstraints = () => {
            if (props.params?.api?.group?.api) {
                props.params.api.group.api.setConstraints({
                    maximumWidth: 300,
                    maximumHeight: 300,
                });
            }
        };

        return {
            constraints,
            setConstraints,
        };
    },
    template: `
        <div style="height: 100%; padding: 20px; background: var(--dv-group-view-background-color); color: white;">
            <button @click="setConstraints">Set</button>
            <div v-if="constraints" style="font-size: 13px;">
                <div v-if="typeof constraints.maximumHeight === 'number'"
                     style="border: 1px solid grey; margin: 2px; padding: 1px;">
                    <span style="color: grey;">Maximum Height: </span>
                    <span>{{ constraints.maximumHeight }}px</span>
                </div>
                <div v-if="typeof constraints.minimumHeight === 'number'"
                     style="border: 1px solid grey; margin: 2px; padding: 1px;">
                    <span style="color: grey;">Minimum Height: </span>
                    <span>{{ constraints.minimumHeight }}px</span>
                </div>
                <div v-if="typeof constraints.maximumWidth === 'number'"
                     style="border: 1px solid grey; margin: 2px; padding: 1px;">
                    <span style="color: grey;">Maximum Width: </span>
                    <span>{{ constraints.maximumWidth }}px</span>
                </div>
                <div v-if="typeof constraints.minimumWidth === 'number'"
                     style="border: 1px solid grey; margin: 2px; padding: 1px;">
                    <span style="color: grey;">Minimum Width: </span>
                    <span>{{ constraints.minimumWidth }}px</span>
                </div>
            </div>
        </div>
    `
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        default: DefaultPanel,
    },
    setup() {
        const onReady = (event: DockviewReadyEvent) => {
            const panel1 = event.api.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = event.api.addPanel({
                id: 'panel_2',
                component: 'default',
                position: {
                    referencePanel: panel1,
                    direction: 'right',
                },
            });

            const panel3 = event.api.addPanel({
                id: 'panel_3',
                component: 'default',
                position: {
                    referencePanel: panel2,
                    direction: 'right',
                },
            });

            const panel4 = event.api.addPanel({
                id: 'panel_4',
                component: 'default',
                position: {
                    direction: 'below',
                },
            });
        };

        return {
            onReady,
        };
    },
    template: `
        <dockview-vue
            class="dockview-theme-abyss"
            @ready="onReady"
            style="height: 100%;">
        </dockview-vue>
    `
});

createApp(App).mount('#app');
