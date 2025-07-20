import 'dockview-core/dist/styles/dockview.css';
import {
    createDockview,
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
    PanelUpdateEvent,
    Parameters,
    themeAbyss,
} from 'dockview-core';

class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;

    private readonly e1: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.color = 'white';

        this.e1 = document.createElement('div');

        this.element.append(this.e1);
    }

    init(parameters: GroupPanelPartInitParameters): void {
        parameters.api.onDidTitleChange((event) => {
            this.e1.textContent = event.title;
        });

        this.e1.textContent = parameters.api.title;
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
    locked: true,
});

api.addPanel({
    id: 'panel_1',
    component: 'default',
});

api.addPanel({
    id: 'panel_2',
    component: 'default',
    position: {
        direction: 'right',
        referencePanel: 'panel_1',
    },
});

api.addPanel({
    id: 'panel_3',
    component: 'default',
    position: {
        direction: 'below',
        referencePanel: 'panel_1',
    },
});

api.addPanel({
    id: 'panel_4',
    component: 'default',
});

api.addPanel({
    id: 'panel_5',
    component: 'default',
});
