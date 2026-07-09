import { LicenseManager } from 'dockview-enterprise';
import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    DockviewApi,
    GroupPanelPartInitParameters,
    IContentRenderer,
    themeAbyss,
    themeLight,
} from 'dockview';

// dockview.dev docs license key — replace with your own key in production.
LicenseManager.setLicenseKey(
    '[KeyId:DOCKVIEW-DOCS]_[Company:Dockview]_[Plan:team]_[AppName:Dockview_Docs]_[Email:enterprise@dockview.dev]_[ValidFrom:01_Jan_2025]_[ValidUntil:01_Jan_2099]__aaa294ecec1eed47'
);

class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.className = 'example-panel';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.api.title ?? '';
    }
}

const layout = document.getElementById('app')!;
layout.className = 'example-layout';

const controls = document.createElement('div');
controls.className = 'example-controls';

const addButton = document.createElement('button');
addButton.textContent = 'Add Tab';

let mode: 'wrap' | 'dropdown' = 'wrap';
const modeButton = document.createElement('button');
modeButton.textContent = 'Switch to dropdown mode';

controls.append(addButton, modeButton);

const dockElement = document.createElement('div');
dockElement.className = 'example-dock';

layout.append(controls, dockElement);

const api: DockviewApi = createDockview(dockElement, {
    theme: (window as any).__dockviewColorMode === 'light' ? themeLight : themeAbyss,
    // Wrap tabs onto multiple rows when they no longer fit on one row.
    overflow: { mode: 'wrap' },
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

let counter = 0;

function addPanel(): void {
    counter++;
    api.addPanel({
        id: `panel_${counter}`,
        component: 'default',
        title: `Panel ${counter}`,
    });
}

addButton.addEventListener('click', () => addPanel());

modeButton.addEventListener('click', () => {
    mode = mode === 'wrap' ? 'dropdown' : 'wrap';
    api.updateOptions({ overflow: { mode } });
    modeButton.textContent =
        mode === 'wrap' ? 'Switch to dropdown mode' : 'Switch to wrap mode';
});

// Open enough panels in a single group that the tabs no longer fit on one row.
for (let i = 0; i < 12; i++) {
    addPanel();
}
