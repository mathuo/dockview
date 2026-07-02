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
        this._element.style.color = 'white';
        this._element.style.padding = '20px';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.api.title ?? '';
    }
}

const api: DockviewApi = createDockview(document.getElementById('app')!, {
    theme: themeAbyss,
    // Wrap tabs onto multiple rows when they no longer fit on one row.
    overflow: { mode: 'wrap' },
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

// Open enough panels in a single group that the tabs no longer fit on one row.
for (let i = 1; i <= 12; i++) {
    api.addPanel({
        id: `panel_${i}`,
        component: 'default',
        title: `Panel ${i}`,
    });
}
