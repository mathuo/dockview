import 'dockview-core/dist/styles/dockview.css';
import {
    createPaneview,
    IPaneviewPanelProps,
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
        this._element.style.padding = '10px';
        this._element.style.background = '#1e1e1e';
        this._element.style.border = '1px solid #333';
    }

    init(parameters: IPaneviewPanelProps): void {
        this._element.textContent = `Panel ${parameters.id}`;
    }
}

const api = createPaneview(document.getElementById('app'), {
    theme: themeAbyss,
    orientation: 'vertical',
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

api.addPanel({
    id: 'panel_1',
    component: 'default',
    title: 'Panel 1',
    size: 150,
});

api.addPanel({
    id: 'panel_2',
    component: 'default',
    title: 'Panel 2',
    size: 200,
});

api.addPanel({
    id: 'panel_3',
    component: 'default',
    title: 'Panel 3',
    size: 180,
});