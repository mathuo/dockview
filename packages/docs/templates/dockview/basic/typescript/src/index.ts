import 'dockview-core/dist/styles/dockview.css';
import {
    DockviewApi,
    DockviewComponent,
    GroupPanelPartInitParameters,
    IContentRenderer,
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

document.getElementById('app').className = 'dockview-theme-abyss';

const dockview = new DockviewComponent({
    parentElement: document.getElementById('app'),
    components: { default: Panel },
});

const api = new DockviewApi(dockview);

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
