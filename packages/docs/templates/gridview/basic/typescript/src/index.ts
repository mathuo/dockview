import 'dockview-core/dist/styles/dockview.css';
import {
    createGridview,
    IGridviewPanelProps,
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

    init(parameters: IGridviewPanelProps): void {
        this._element.textContent = `Panel ${parameters.id}`;
    }
}

const api = createGridview(document.getElementById('app'), {
    theme: themeAbyss,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

const panel1 = api.addPanel({
    id: 'panel_1',
    component: 'default',
});

const panel2 = api.addPanel({
    id: 'panel_2',
    component: 'default',
    position: { referencePanel: panel1.id, direction: 'right' },
});

api.addPanel({
    id: 'panel_3',
    component: 'default',
    position: { referencePanel: panel1.id, direction: 'below' },
});

api.addPanel({
    id: 'panel_4',
    component: 'default',
    position: { referencePanel: panel2.id, direction: 'below' },
});