import 'dockview-core/dist/styles/dockview.css';
import {
    createDockview,
    GroupPanelPartInitParameters,
    IContentRenderer,
    themeAbyss,
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

const api = createDockview(document.getElementById('app'), {
    theme: themeAbyss,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
    disableFloatingGroups: true,
});

api.onWillShowOverlay((e) => {
    if (e.kind === 'header_space' || e.kind === 'tab') {
        return;
    }
    e.preventDefault();
});

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

api.addPanel({
    id: 'panel_4',
    component: 'default',
});

api.addPanel({
    id: 'panel_5',
    component: 'default',
});
