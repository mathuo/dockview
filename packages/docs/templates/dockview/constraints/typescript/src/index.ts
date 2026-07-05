import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    DockviewApi,
    GridConstraintChangeEvent,
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
        this._element.style.height = '100%';
        this._element.style.padding = '20px';
        this._element.style.background =
            'var(--dv-group-view-background-color)';
        this._element.style.color = 'white';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const button = document.createElement('button');
        button.textContent = 'Set';
        button.addEventListener('click', () => {
            parameters.api.group.api.setConstraints({
                maximumWidth: 300,
                maximumHeight: 300,
            });
        });

        const output = document.createElement('div');
        output.style.fontSize = '13px';

        const render = (constraints: GridConstraintChangeEvent): void => {
            output.replaceChildren();

            const row = (label: string, value: number): void => {
                const container = document.createElement('div');
                container.style.border = '1px solid grey';
                container.style.margin = '2px';
                container.style.padding = '1px';

                const key = document.createElement('span');
                key.style.color = 'grey';
                key.textContent = `${label}: `;

                const val = document.createElement('span');
                val.textContent = `${value}px`;

                container.append(key, val);
                output.appendChild(container);
            };

            if (typeof constraints.maximumHeight === 'number') {
                row('Maximum Height', constraints.maximumHeight);
            }
            if (typeof constraints.minimumHeight === 'number') {
                row('Minimum Height', constraints.minimumHeight);
            }
            if (typeof constraints.maximumWidth === 'number') {
                row('Maximum Width', constraints.maximumWidth);
            }
            if (typeof constraints.minimumWidth === 'number') {
                row('Minimum Width', constraints.minimumWidth);
            }
        };

        parameters.api.group.api.onDidConstraintsChange((event) => {
            render(event);
        });

        this._element.append(button, output);
    }
}

const api: DockviewApi = createDockview(document.getElementById('app')!, {
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
    position: {
        referencePanel: panel1,
        direction: 'right',
    },
});

const panel3 = api.addPanel({
    id: 'panel_3',
    component: 'default',
    position: {
        referencePanel: panel2,
        direction: 'right',
    },
});

const panel4 = api.addPanel({
    id: 'panel_4',
    component: 'default',
    position: {
        direction: 'below',
    },
});
