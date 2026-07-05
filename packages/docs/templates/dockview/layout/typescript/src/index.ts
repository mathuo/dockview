import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    DockviewApi,
    GroupPanelPartInitParameters,
    IContentRenderer,
    IWatermarkRenderer,
    themeAbyss,
} from 'dockview';

const STORAGE_KEY = 'dockview_persistence_layout';

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
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.params.title ?? '';
    }
}

class Watermark implements IWatermarkRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.color = 'white';
        this._element.style.padding = '8px';
        this._element.textContent = 'watermark';
    }

    init(): void {
        //
    }
}

function loadDefaultLayout(api: DockviewApi): void {
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
}

const root = document.getElementById('app')!;
root.style.display = 'flex';
root.style.flexDirection = 'column';
root.style.height = '100%';

const toolbar = document.createElement('div');
toolbar.style.height = '25px';

const resetButton = document.createElement('button');
resetButton.textContent = 'Reset Layout';
toolbar.append(resetButton);

const dockElement = document.createElement('div');
dockElement.style.flexGrow = '1';
dockElement.style.overflow = 'hidden';

root.append(toolbar, dockElement);

const api: DockviewApi = createDockview(dockElement, {
    theme: themeAbyss,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
    createWatermarkComponent: () => new Watermark(),
});

// Restore any previously persisted layout, otherwise start from the default.
const layoutString = localStorage.getItem(STORAGE_KEY);
let restored = false;

if (layoutString) {
    try {
        api.fromJSON(JSON.parse(layoutString));
        restored = true;
    } catch (err) {
        console.error(err);
    }
}

if (!restored) {
    loadDefaultLayout(api);
}

// Persist the layout on every change.
api.onDidLayoutChange(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(api.toJSON()));
});

resetButton.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    api.clear();
    loadDefaultLayout(api);
});
