import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    DockviewApi,
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
        this._element.style.padding = '20px';
        this._element.style.color = 'white';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.params.title;
    }
}

const root = document.getElementById('app')!;
root.style.height = '100%';
root.style.display = 'flex';
root.style.flexDirection = 'column';

// A slider drives the size of the wrapper the dock lives in. Dockview watches
// its container and resizes automatically, so the layout tracks the container.
const slider = document.createElement('input');
slider.type = 'range';
slider.min = '1';
slider.max = '100';
slider.value = '50';

const dockWrapper = document.createElement('div');

const applySize = (value: string): void => {
    dockWrapper.style.height = `${value}%`;
    dockWrapper.style.width = `${value}%`;
};
applySize(slider.value);

slider.addEventListener('input', () => applySize(slider.value));

root.append(slider, dockWrapper);

const api: DockviewApi = createDockview(dockWrapper, {
    theme: themeAbyss,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

const panel = api.addPanel({
    id: 'panel_1',
    component: 'default',
    params: {
        title: 'Panel 1',
    },
});

panel.group.locked = true;
panel.group.header.hidden = true;

api.addPanel({
    id: 'panel_2',
    component: 'default',
    params: {
        title: 'Panel 2',
    },
});

api.addPanel({
    id: 'panel_3',
    component: 'default',
    params: {
        title: 'Panel 3',
    },
});

api.addPanel({
    id: 'panel_4',
    component: 'default',
    params: {
        title: 'Panel 4',
    },
    position: { referencePanel: 'panel_1', direction: 'right' },
});

api.addPanel({
    id: 'panel_5',
    component: 'default',
    params: {
        title: 'Panel 5',
    },
    position: { referencePanel: 'panel_3', direction: 'right' },
});

api.addPanel({
    id: 'panel_6',
    component: 'default',
    params: {
        title: 'Panel 6',
    },
    position: { referencePanel: 'panel_5', direction: 'below' },
});

api.addPanel({
    id: 'panel_7',
    component: 'default',
    params: {
        title: 'Panel 7',
    },
    position: { referencePanel: 'panel_6', direction: 'right' },
});
