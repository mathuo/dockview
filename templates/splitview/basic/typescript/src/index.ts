import 'dockview-core/dist/styles/dockview.css';
import {
    createSplitview,
    ISplitviewPanelProps,
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
    }

    init(parameters: ISplitviewPanelProps): void {
        this._element.textContent = `Panel ${parameters.id}`;
    }
}

const api = createSplitview(document.getElementById('app'), {
    theme: themeAbyss,
    orientation: 'horizontal',
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
    size: 200,
});

api.addPanel({
    id: 'panel_2',
    component: 'default',
    size: 300,
});

api.addPanel({
    id: 'panel_3',
    component: 'default',
    size: 200,
});