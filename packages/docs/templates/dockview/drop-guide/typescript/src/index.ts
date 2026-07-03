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
    // Show the aim-at-a-cell drop guide while dragging tabs.
    dndGuide: true,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

// A small docked layout with panels on every side so that, while dragging a
// tab, the drop guide can be seen resolving to each cell.
const panel1 = api.addPanel({
    id: 'panel_1',
    component: 'default',
    title: 'Panel 1',
});

api.addPanel({
    id: 'panel_2',
    component: 'default',
    title: 'Panel 2',
    position: { referencePanel: panel1, direction: 'right' },
});

api.addPanel({
    id: 'panel_3',
    component: 'default',
    title: 'Panel 3',
    position: { referencePanel: panel1, direction: 'below' },
});

api.addPanel({
    id: 'panel_4',
    component: 'default',
    title: 'Panel 4',
    position: { referencePanel: panel1, direction: 'within' },
});
