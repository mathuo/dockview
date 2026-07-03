import { LicenseManager } from 'dockview-enterprise';
import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    GroupPanelPartInitParameters,
    IContentRenderer,
    themeAbyss,
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
        this._element.style.padding = '20px';
        this._element.style.color = 'white';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.api.title ?? '';
    }
}

const api = createDockview(document.getElementById('app')!, {
    theme: themeAbyss,
    // Enable pinned tabs, which stay ahead of the other tabs and never overflow.
    pinnedTabs: { enabled: true },
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

const home = api.addPanel({ id: 'home', component: 'default', title: 'Home' });
api.addPanel({ id: 'panel_1', component: 'default', title: 'Panel 1' });
api.addPanel({ id: 'panel_2', component: 'default', title: 'Panel 2' });
api.addPanel({ id: 'panel_3', component: 'default', title: 'Panel 3' });
api.addPanel({ id: 'panel_4', component: 'default', title: 'Panel 4' });

// Pin the "Home" tab so it always renders first and never overflows.
home.api.setPinned(true);
