import {
    DockviewComponent,
    IContentRenderer,
    IGroupPanelInitParameters,
    PanelUpdateEvent,
    Parameters,
} from 'dockview-core';

class DefaultPanel implements IContentRenderer {
    private _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.padding = '20px';
        this._element.style.color = 'white';
    }

    init(params: IGroupPanelInitParameters): void {
        this._element.textContent = params.params.title;
    }

    update(event: PanelUpdateEvent<Parameters>): void {
        this._element.textContent = event.params.title;
    }
}

export function attach(parent: HTMLElement): {
    dispose: () => void;
} {
    const element = document.createElement('div');
    element.className = 'dockview-theme-abyss';
    element.style.height = '100%';
    element.style.width = '100%';

    const dockview = new DockviewComponent({
        components: {
            default: DefaultPanel,
        },
        parentElement: element,
    });

    parent.appendChild(element);

    const { clientWidth, clientHeight } = parent;
    dockview.layout(clientWidth, clientHeight);

    const panel = dockview.addPanel({
        id: 'panel_1',
        component: 'default',
        params: {
            title: 'Panel 1',
        },
    });

    panel.group.locked = true;
    panel.group.header.hidden = true;

    dockview.addPanel({
        id: 'panel_2',
        component: 'default',
        params: {
            title: 'Panel 2',
        },
    });

    dockview.addPanel({
        id: 'panel_3',
        component: 'default',
        params: {
            title: 'Panel 3',
        },
    });

    dockview.addPanel({
        id: 'panel_4',
        component: 'default',
        params: {
            title: 'Panel 4',
        },
        position: { referencePanel: 'panel_1', direction: 'right' },
    });

    const panel5 = dockview.addPanel({
        id: 'panel_5',
        component: 'default',
        params: {
            title: 'Panel 5',
        },
        position: { referencePanel: 'panel_3', direction: 'right' },
    });

    dockview.addPanel({
        id: 'panel_6',
        component: 'default',
        params: {
            title: 'Panel 6',
        },
        position: { referencePanel: 'panel_5', direction: 'below' },
    });

    dockview.addPanel({
        id: 'panel_7',
        component: 'default',
        params: {
            title: 'Panel 7',
        },
        position: { referencePanel: 'panel_6', direction: 'right' },
    });

    return {
        dispose: () => {
            dockview.dispose();
            element.remove();
        },
    };
}
