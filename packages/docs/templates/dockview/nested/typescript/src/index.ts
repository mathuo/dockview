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
        this._element.style.background =
            'var(--dv-group-view-background-color)';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.params.title ?? '';
    }
}

// A panel whose content is itself a nested dockview instance.
class InnerDockview implements IContentRenderer {
    private readonly _element: HTMLElement;
    private _innerApi?: DockviewApi;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.className = 'nested-dockview';
        this._element.style.height = '100%';
    }

    init(): void {
        this._innerApi = createDockview(this._element, {
            theme: themeAbyss,
            createComponent: (options) => {
                switch (options.name) {
                    case 'default':
                        return new Panel();
                }
            },
        });

        this._innerApi.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        this._innerApi.addPanel({
            id: 'panel_2',
            component: 'default',
        });

        this._innerApi.addPanel({
            id: 'panel_3',
            component: 'default',
        });
    }

    dispose(): void {
        this._innerApi?.dispose();
    }
}

const api: DockviewApi = createDockview(document.getElementById('app')!, {
    theme: themeAbyss,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
            case 'innerDockview':
                return new InnerDockview();
        }
    },
});

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
    component: 'innerDockview',
    position: { referencePanel: 'panel_2', direction: 'right' },
});
