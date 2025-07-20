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
    private readonly e2: HTMLInputElement;
    private readonly e3: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.color = 'white';
        this._element.style.padding = '20px';

        this.e1 = document.createElement('div');
        this.e2 = document.createElement('input');
        this.e3 = document.createElement('button');
        this.e3.textContent = 'Change';

        this.element.append(this.e1, this.e2, this.e3);
    }

    init(parameters: GroupPanelPartInitParameters): void {
        parameters.api.onDidTitleChange((event) => {
            this.e1.textContent = `props.api.title=${event.title}`;
        });

        this.e1.textContent = `props.api.title=${parameters.api.title}`;

        this.e3.addEventListener('click', () => {
            parameters.api.setTitle(this.e2.value);
        });
    }

    update(event: PanelUpdateEvent<Parameters>): void {
        this.e3.textContent = `value: ${event.params.myValue}`;
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

const panel = api.addPanel({
    id: 'panel_1',
    component: 'default',
    title: 'Panel 1',
});

const panel2 = api.addPanel({
    id: 'panel_2',
    component: 'default',
    title: 'Panel 2',
    position: { referencePanel: panel },
});

const panel3 = api.addPanel({
    id: 'panel_3',
    component: 'default',
    title: 'Panel 3',

    position: { referencePanel: panel, direction: 'right' },
});

const panel4 = api.addPanel({
    id: 'panel_4',
    component: 'default',
    title: 'Panel 4',
    position: { referencePanel: panel3 },
});
