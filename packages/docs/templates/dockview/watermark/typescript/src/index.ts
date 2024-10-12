import 'dockview-core/dist/styles/dockview.css';
import {
    createDockview,
    DockviewApi,
    GroupPanelPartInitParameters,
    IContentRenderer,
    IDockviewGroupPanel,
    IWatermarkRenderer,
    WatermarkRendererInitParameters,
} from 'dockview-core';

class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.color = 'white';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = 'Hello World';
    }
}

class Watermark implements IWatermarkRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        const element = document.createElement('div');
        element.style.height = '100%';
        element.style.display = 'flex';
        element.style.justifyContent = 'center';
        element.style.alignItems = 'center';
        element.style.color = 'white';

        this._element = element;
    }

    init(params: WatermarkRendererInitParameters): void {
        this.build(params.containerApi, params.group);
    }

    private build(api: DockviewApi, group?: IDockviewGroupPanel): void {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        const text = document.createElement('span');
        text.textContent =
            'This is a custom watermark. You can change this content.';

        const button = document.createElement('button');
        button.textContent = 'Add New Panel';
        button.addEventListener('click', () => {
            api.addPanel({
                id: Date.now().toString(),
                component: 'default',
            });
        });

        const button2 = document.createElement('button');
        button2.textContent = 'Close Group';
        button2.addEventListener('click', () => {
            api.addPanel({
                id: Date.now().toString(),
                component: 'default',
            });
        });

        container.append(text, button, button2);
        this.element.append(container);

        api.onDidLayoutChange(() => {
            button2.style.display = api.groups.length > 0 ? '' : 'none';
        });

        button2.addEventListener('click', () => {
            group?.api.close();
        });
    }
}

const root = document.createElement('div');
root.style.display = 'flex';
root.style.flexDirection = 'column';
root.style.height = '100%';

const button = document.createElement('button');
button.textContent = 'Add Empty Group';

const container = document.createElement('div');
container.style.flexGrow = '1';

root.append(button, container);

const app = document.getElementById('app');
app.append(root);

const api = createDockview(container, {
    className: 'dockview-theme-abyss',
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
    createWatermarkComponent: () => {
        return new Watermark();
    },
});

api.addPanel({
    id: 'panel_1',
    component: 'default',
    title: 'Panel 1',
});

api.addPanel({
    id: 'panel_2',
    component: 'default',
    position: { referencePanel: 'panel_1', direction: 'right' },
    title: 'Panel 2',
});

button.addEventListener('click', () => {
    api.addGroup();
});
