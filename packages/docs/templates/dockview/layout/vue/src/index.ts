import 'dockview-vue/dist/styles/dockview.css';
import { PropType, createApp, defineComponent } from 'vue';
import {
    DockviewVue,
    DockviewApi,
    DockviewReadyEvent,
    IDockviewHeaderActionsProps,
    IDockviewPanelProps,
} from 'dockview-vue';

let panelCount = 0;

function loadDefaultLayout(api: DockviewApi) {
    api.addPanel({
        id: 'panel_1',
        component: 'default',
    });

    api.addPanel({
        id: 'panel_2',
        component: 'default',
    });

    api.addPanel({
        id: 'panel_3',
        component: 'default',
    });
}

const MaterialIcon = defineComponent({
    name: 'MaterialIcon',
    props: {
        icon: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: false,
        },
    },
    emits: ['click'],
    data() {
        return {
            title: this.title,
            icon: this.icon,
        };
    },
    methods: {
        onClick() {
            this.$emit('click');
        },
    },
    template: `
    <div
      @click="onClick"
      title="title"
      style="display:flex;justify-content:center;align-items:center;width:30px;height:100%;font-size:18px;">
        <span class="material-symbols-outlined" style="font-size:inherit;cursor:pointer;">
          {{icon}}
        </span>
    </div>`,
});

const LeftAction = defineComponent({
    name: 'LeftAction',
    props: {
        params: {
            type: Object as PropType<IDockviewHeaderActionsProps>,
            required: true,
        },
    },
    components: {
        'material-icon': MaterialIcon,
    },
    methods: {
        onClick() {
            this.params.containerApi.addPanel({
                id: (++panelCount).toString(),
                title: `Tab ${panelCount}`,
                component: 'default',
            });
        },
    },
    template: `
      <div style="height:100%;color:white;padding:0px 4px;">
        <material-icon @click="onClick" icon="add"></material-icon>
      </div>`,
});

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
            this.title = this.api.title;
        });
        this.title = this.api.title;

        return () => {
            disposable.dispose();
        };
    },
    template: `
      <div style="color:white;">
        <div>{{title}}</div>
      </div>`,
});

const App = defineComponent({
    name: 'App',
    components: {
        'dockview-vue': DockviewVue,
        default: Panel,
        leftAction: LeftAction,
    },
    data() {
        return {
            api: null as DockviewApi | null,
        };
    },
    methods: {
        onLoad() {
            const layoutString = localStorage.getItem(
                'dv-template/dockview/layout/vue'
            );

            let success = false;

            if (layoutString) {
                try {
                    const layout = JSON.parse(layoutString);
                    this.api.fromJSON(layout);
                    success = true;
                } catch (err) {
                    console.error(err);
                }
            }

            if (!success) {
                loadDefaultLayout(this.api);
            }
        },
        onSave() {
            localStorage.setItem(
                'dv-template/dockview/layout/vue',
                JSON.stringify(this.api.toJSON())
            );
        },
        onClear() {
            localStorage.removeItem('dv-template/dockview/layout/vue');
        },
        onReady(event: DockviewReadyEvent) {
            this.api = event.api;
            this.onLoad();
        },
    },
    watch: {
        api(newValue, oldValue) {
            if (!newValue) {
                return;
            }

            const disposable = newValue.onDidLayoutChange(() => {
                const layout = newValue.toJSON();

                localStorage.setItem(
                    'dockview_persistence_layout',
                    JSON.stringify(layout)
                );
            });

            return () => {
                disposable.dispose();
            };
        },
    },
    template: `
    <div style="display:flex;flex-direction:column;height:100%;">
      <div style="height:25px">
        <button @click="onLoad">Load</button>
        <button @click="onSave">Save</button>
        <button @click="onClear">Clear</button>
      </div>
      <div style="flex-grow:1;">
        <dockview-vue
          style="width:100%;height:100%"
          class="dockview-theme-abyss"
          @ready="onReady"
          :floatingGroupBounds="bounds"
          leftHeaderActionsComponent="leftAction"
          :disableFloatingGroups="disableFloatingGroups"
        </dockview-vue>
      </div>
    </div>`,
});

const app = createApp(App);
app.config.errorHandler = (err) => {
    console.log(err);
};
app.mount(document.getElementById('app')!);
