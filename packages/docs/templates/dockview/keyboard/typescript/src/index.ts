import { LicenseManager } from 'dockview-enterprise';
import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    DockviewApi,
    GroupPanelPartInitParameters,
    IContentRenderer,
    themeAbyss,
} from 'dockview';

// dockview.dev docs license key — replace with your own key in production.
LicenseManager.setLicenseKey(
    '[KeyId:DOCKVIEW-DOCS]_[Company:Dockview]_[Plan:team]_[AppName:Dockview_Docs]_[Email:enterprise@dockview.dev]_[ValidFrom:01_Jan_2025]_[ValidUntil:01_Jan_2099]__aaa294ecec1eed47'
);

const shortcutStyle =
    'background-color:lightblue;color:black;padding:2px 4px;border-radius:4px;white-space:nowrap;';

class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.color = 'white';
        this._element.style.padding = '20px';
        this._element.style.fontSize = '13px';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const title = document.createElement('div');
        title.style.padding = '10px 0px';
        title.textContent = parameters.api.title ?? '';

        const description = document.createElement('div');
        description.style.padding = '10px 0px';
        description.innerHTML = `<span style="${shortcutStyle}">Ctrl+]</span> <span style="${shortcutStyle}">Ctrl+[</span> switch tabs · <span style="${shortcutStyle}">F6</span> <span style="${shortcutStyle}">Shift+F6</span> move between groups · <span style="${shortcutStyle}">Ctrl+M</span> dock with the keyboard.`;

        this._element.appendChild(title);
        this._element.appendChild(description);
    }
}

const container = document.getElementById('app')!;

const api: DockviewApi = createDockview(container, {
    theme: themeAbyss,
    // Enable the built-in enterprise keymap: Ctrl+]/Ctrl+[ to switch tabs,
    // F6/Shift+F6 to move between groups, Ctrl+M to dock.
    keyboardNavigation: true,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

// A couple of groups so F6 group-switching and Ctrl+] tab-switching are both
// demonstrable.
api.addPanel({ id: 'panel_1', component: 'default', title: 'Panel 1' });
api.addPanel({ id: 'panel_2', component: 'default', title: 'Panel 2' });
api.addPanel({ id: 'panel_3', component: 'default', title: 'Panel 3' });
api.addPanel({
    id: 'panel_4',
    component: 'default',
    title: 'Panel 4',
    position: { referencePanel: 'panel_3', direction: 'right' },
});
api.addPanel({
    id: 'panel_5',
    component: 'default',
    title: 'Panel 5',
    position: { referencePanel: 'panel_4', direction: 'within' },
});

api.getPanel('panel_1')!.api.setActive();
