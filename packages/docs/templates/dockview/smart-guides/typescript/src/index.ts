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
    // Snap floating groups to each other (and to container edges) when dragged
    // within 8px of an alignment.
    smartGuides: { snapDistance: 8 },
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

// A docked base panel to fill the container.
api.addPanel({ id: 'panel_1', component: 'default', title: 'Panel 1' });

// Two floating groups so alignment + snapping is demonstrable: drag one near
// the other (or towards a container edge) to see the guides.
api.addPanel({
    id: 'float_1',
    component: 'default',
    title: 'Floating 1',
    floating: { width: 220, height: 140, position: { top: 40, left: 60 } },
});

api.addPanel({
    id: 'float_2',
    component: 'default',
    title: 'Floating 2',
    floating: { width: 220, height: 140, position: { top: 220, left: 340 } },
});
