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
        this._element.style.height = '100%';
        this._element.style.padding = '20px';
        this._element.style.color = 'white';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.title;
    }
}

const root = document.getElementById('app')!;
root.style.display = 'flex';
root.style.flexDirection = 'column';

const toolbar = document.createElement('div');
toolbar.style.height = '25px';
toolbar.style.display = 'flex';
toolbar.style.gap = '4px';

const undoButton = document.createElement('button');
undoButton.textContent = 'Undo';
const redoButton = document.createElement('button');
redoButton.textContent = 'Redo';
const addButton = document.createElement('button');
addButton.textContent = 'Add Panel';
toolbar.append(undoButton, redoButton, addButton);

const dockElement = document.createElement('div');
dockElement.style.flexGrow = '1';

root.append(toolbar, dockElement);

const api: DockviewApi = createDockview(dockElement, {
    theme: themeAbyss,
    layoutHistory: { enabled: true, undoableProgrammaticMutations: true },
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

let panelCount = 5;

api.addPanel({ id: 'panel_1', component: 'default', title: 'Panel 1' });
api.addPanel({ id: 'panel_2', component: 'default', title: 'Panel 2' });
api.addPanel({ id: 'panel_3', component: 'default', title: 'Panel 3' });
api.addPanel({
    id: 'panel_4',
    component: 'default',
    title: 'Panel 4',
    position: { direction: 'right' },
});
api.addPanel({ id: 'panel_5', component: 'default', title: 'Panel 5' });

// The seed layout shouldn't be undoable — start with a clean history.
api.clearHistory();

// Drive the toolbar's disabled state from the history stack.
const sync = (): void => {
    undoButton.disabled = !api.canUndo;
    redoButton.disabled = !api.canRedo;
};
sync();
api.onDidChangeHistory(sync);

undoButton.addEventListener('click', () => api.undo());
redoButton.addEventListener('click', () => api.redo());
addButton.addEventListener('click', () =>
    api.addPanel({
        id: `panel_${++panelCount}`,
        component: 'default',
        title: `Panel ${panelCount}`,
    })
);
