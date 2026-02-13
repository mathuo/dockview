import 'dockview-core/dist/styles/dockview.css';
import {
    createPaneview,
    PaneviewPanel,
    IPanePart,
    Orientation,
    themeAbyss,
    PanelUpdateEvent,
    PanePanelComponentInitParameter,
} from 'dockview-core';

class Panel extends PaneviewPanel {
    private readonly _bodyComponent: IPanePart;
    private readonly _headerComponent: IPanePart;

    constructor(id: string, component: string) {
        super({
            id,
            component,
            headerComponent: 'header',
            orientation: Orientation.VERTICAL,
            isExpanded: true,
            isHeaderVisible: true,
            headerSize: 30,
            minimumBodySize: 50,
            maximumBodySize: Number.MAX_SAFE_INTEGER,
        });

        // Create body component
        const bodyElement = document.createElement('div');
        bodyElement.style.color = 'white';
        bodyElement.style.padding = '10px';
        bodyElement.style.background = '#1e1e1e';
        bodyElement.style.border = '1px solid #333';
        bodyElement.textContent = `Panel ${id}`;

        this._bodyComponent = {
            element: bodyElement,
            init: (parameters: PanePanelComponentInitParameter) => {
                bodyElement.textContent = `Panel ${parameters.params?.id}`;
            },
            update: (params: PanelUpdateEvent) => {
                // Update based on parameter changes
                if (params.params) {
                    // Handle parameter updates if needed
                }
            },
            dispose: () => {
                // cleanup if needed
            },
        };

        // Create header component
        const headerElement = document.createElement('div');
        headerElement.style.color = 'white';
        headerElement.style.padding = '5px 10px';
        headerElement.style.background = '#2d2d30';
        headerElement.style.borderBottom = '1px solid #3c3c3c';
        headerElement.style.fontWeight = 'bold';
        headerElement.textContent = `Header ${id}`;

        this._headerComponent = {
            element: headerElement,
            init: (parameters: PanePanelComponentInitParameter) => {
                bodyElement.textContent = `Panel ${parameters.params?.id}`;
            },
            update: (parameters: PanelUpdateEvent) => {
                headerElement.textContent = `Header ${parameters.params?.id || id}`;
            },
            dispose: () => {
                // cleanup if needed
            },
        };
    }

    getBodyComponent(): IPanePart {
        return this._bodyComponent;
    }

    getHeaderComponent(): IPanePart {
        return this._headerComponent;
    }
}

const container = document.getElementById('app');
if (!container) {
    throw new Error('Container element #app not found');
}

const api = createPaneview(container, {
    className: themeAbyss.className,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel(options.id, options.name);
            default:
                throw new Error(`Unsupported component: ${options.name}`);
        }
    },
});

// Layout BEFORE adding panels (critical for paneview)
api.layout(window.innerWidth, window.innerHeight);

api.addPanel({
    id: 'panel_1',
    component: 'default',
    title: 'Panel 1',
    size: 150,
});

api.addPanel({
    id: 'panel_2',
    component: 'default',
    title: 'Panel 2',
    size: 200,
});

api.addPanel({
    id: 'panel_3',
    component: 'default',
    title: 'Panel 3',
    size: 180,
});
