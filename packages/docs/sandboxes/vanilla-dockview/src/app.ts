import {
    DockviewComponent,
    IContentRenderer,
    IGroupPanelInitParameters,
} from 'dockview';

class DefaultPanel implements IContentRenderer {
    private _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
    }

    init(params: IGroupPanelInitParameters): void {
        //
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

    const panel1 = dockview.addPanel({
        id: 'panel_1',
        title: 'Panel 1',
        component: 'default',
    });

    const panel2 = dockview.addPanel({
        id: 'panel_2',
        title: 'Panel 2',
        component: 'default',
        position: {
            referencePanel: panel1,
            direction: 'right',
        },
    });

    const panel3 = dockview.addPanel({
        id: 'panel_3',
        title: 'Panel 3',
        component: 'default',
        position: {
            referenceGroup: panel2.group,
        },
    });

    const pane4 = dockview.addPanel({
        id: 'panel_4',
        title: 'Panel 4',
        component: 'default',
        position: {
            direction: 'below',
        },
    });

    return {
        dispose: () => {
            dockview.dispose();
            element.remove();
        },
    };
}
