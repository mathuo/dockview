import {
    IGroupPanelInitParameters,
    IContentRenderer,
    PanelUpdateEvent,
    Parameters,
    ITabRenderer,
    DockviewComponent,
} from 'dockview-core';
import './app.scss';

class DefaultPanel implements IContentRenderer {
    private _element: HTMLElement;
    private _titleElement: HTMLElement;
    private _paramsElement: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.display = 'flex';
        this._element.style.justifyContent = 'center';
        this._element.style.alignItems = 'center';
        this._element.style.color = 'white';
        this._element.style.height = '100%';

        this._titleElement = document.createElement('span');
        this._paramsElement = document.createElement('span');

        this._element.appendChild(this._titleElement);
    }

    init(params: IGroupPanelInitParameters): void {
        this.render(params.params);
    }

    update(event: PanelUpdateEvent<Parameters>): void {
        this.render(event.params);
    }

    private render(params: Record<string, any>) {
        this._titleElement.textContent = params.title;

        if (params.x) {
            if (!this._paramsElement.parentElement) {
                this._element.appendChild(this._paramsElement);
            }
            this._paramsElement.textContent = params.x;
        } else {
            this._paramsElement.parentElement?.removeChild(this._paramsElement);
        }
    }
}

class DefaultTab implements ITabRenderer {
    private _element: HTMLElement;
    private _title: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.className = 'my-custom-tab';

        this._title = document.createElement('span');

        const spacer = document.createElement('span');
        spacer.style.flexGrow = '1';

        const btn1 = document.createElement('span');
        btn1.className = 'my-custom-tab-icon material-symbols-outlined';
        btn1.textContent = 'minimize';

        const btn2 = document.createElement('span');
        btn2.className = 'my-custom-tab-icon material-symbols-outlined';
        btn2.textContent = 'maximize';

        const btn3 = document.createElement('span');
        btn3.className = 'my-custom-tab-icon material-symbols-outlined';
        btn3.textContent = 'close';

        this._element.appendChild(this._title);
        this._element.appendChild(spacer);
        this._element.appendChild(btn1);
        this._element.appendChild(btn2);
        this._element.appendChild(btn3);
    }

    init(params: IGroupPanelInitParameters): void {
        this.render(params.params);
    }

    update(event: PanelUpdateEvent<Parameters>): void {
        this.render(event.params);
    }

    private render(params: Record<string, any>) {
        this._title = params.title;
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
        tabComponents: {
            default: DefaultTab,
        },
        singleTabMode: 'fullwidth',
        parentElement: element,
    });

    parent.appendChild(element);

    const { clientWidth, clientHeight } = parent;
    dockview.layout(clientWidth, clientHeight);

    const panel1 = dockview.addPanel({
        id: 'panel_1',
        component: 'default',
        tabComponent: 'default',
        params: {
            title: 'Window 1',
        },
    });
    panel1.group.locked = true;

    const panel2 = dockview.addPanel({
        id: 'panel_2',
        component: 'default',
        tabComponent: 'default',
        params: {
            title: 'Window 2',
        },
        position: {
            direction: 'right',
        },
    });
    panel2.group.locked = true;

    const panel3 = dockview.addPanel({
        id: 'panel_3',
        component: 'default',
        tabComponent: 'default',
        params: {
            title: 'Window 3',
        },
        position: {
            direction: 'below',
        },
    });
    panel3.group.locked = true;

    return {
        dispose: () => {
            dockview.dispose();
            element.remove();
        },
    };
}
