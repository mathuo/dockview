import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    GroupPanelPartInitParameters,
    IContentRenderer,
    themeAbyss,
} from 'dockview';

class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.padding = '10px';
        this._element.style.color = 'white';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.title ?? 'Panel';
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
});

api.addEdgeGroup('left', {
    id: 'left',
    initialSize: 220,
    minimumSize: 150,
});

api.addEdgeGroup('bottom', {
    id: 'bottom',
    initialSize: 180,
    minimumSize: 100,
});

api.addEdgeGroup('right', {
    id: 'right',
    initialSize: 220,
    minimumSize: 150,
    collapsed: true,
});

api.addPanel({
    id: 'explorer',
    component: 'default',
    title: 'Explorer',
    position: { referenceGroup: 'left' },
});

api.addPanel({
    id: 'search',
    component: 'default',
    title: 'Search',
    position: { referenceGroup: 'left' },
});

api.addPanel({
    id: 'terminal',
    component: 'default',
    title: 'Terminal',
    position: { referenceGroup: 'bottom' },
});

api.addPanel({
    id: 'output',
    component: 'default',
    title: 'Output',
    position: { referenceGroup: 'bottom' },
});

api.addPanel({
    id: 'outline',
    component: 'default',
    title: 'Outline',
    position: { referenceGroup: 'right' },
});

api.addPanel({
    id: 'panel_1',
    component: 'default',
    title: 'Editor',
});

api.addPanel({
    id: 'panel_2',
    component: 'default',
    title: 'Preview',
    position: { direction: 'right', referencePanel: 'panel_1' },
});
