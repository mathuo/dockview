import 'dockview-core/dist/styles/dockview.css';
import {
    createDockview,
    DockviewGroupPanel,
    GroupPanelPartInitParameters,
    IContentRenderer,
    IGroupHeaderProps,
    IHeaderActionsRenderer,
} from 'dockview-core';
import './index.css';

class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.display = 'flex';
        this._element.style.justifyContent = 'center';
        this._element.style.alignItems = 'center';
        this._element.style.color = 'gray';
        this._element.style.height = '100%';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        //
    }
}

class PrefixHeader implements IHeaderActionsRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(group: DockviewGroupPanel) {
        this._element = document.createElement('div');
        this._element.className = 'dockview-groupcontrol-demo';
        this._element.innerText = '🌲';
    }

    init(parameters: IGroupHeaderProps): void {
        //
    }

    dispose(): void {
        //
    }
}

class RightHeaderActions implements IHeaderActionsRenderer {
    private readonly _element: HTMLElement;
    private readonly _disposables: (() => void)[] = [];

    get element(): HTMLElement {
        return this._element;
    }

    constructor(group: DockviewGroupPanel) {
        this._element = document.createElement('div');
        this._element.className = 'dockview-groupcontrol-demo';
    }

    init(parameters: IGroupHeaderProps): void {
        const group = parameters.group;

        const span = document.createElement('span');
        span.className = 'dockview-groupcontrol-demo-group-active';

        this._element.appendChild(span);

        const d1 = group.api.onDidActiveChange(() => {
            span.style.background = group.api.isActive ? 'green' : 'red';
            span.innerText = `${
                group.api.isActive ? 'Group Active' : 'Group Inactive'
            }`;
        });

        span.style.background = group.api.isActive ? 'green' : 'red';
        span.innerText = `${
            group.api.isActive ? 'Group Active' : 'Group Inactive'
        }`;

        this._disposables.push(() => d1.dispose());
    }

    dispose(): void {
        this._disposables.forEach((dispose) => dispose());
    }
}

class LeftHeaderActions implements IHeaderActionsRenderer {
    private readonly _element: HTMLElement;
    private readonly _disposables: (() => void)[] = [];

    get element(): HTMLElement {
        return this._element;
    }

    constructor(group: DockviewGroupPanel) {
        console.log('group', group);
        this._element = document.createElement('div');
        this._element.className = 'dockview-groupcontrol-demo';
    }

    init(parameters: IGroupHeaderProps): void {
        const group = parameters.group;

        const span = document.createElement('span');
        span.className = 'dockview-groupcontrol-demo-active-panel';

        this._element.appendChild(span);

        const d1 = group.api.onDidActivePanelChange((event) => {
            console.log('event', event);
            span.innerText = `activePanel: ${event.panel?.id || 'null'}`;
        });

        console.log('group.activePanel', group.activePanel);

        span.innerText = `activePanel: ${group.activePanel?.id || 'null'}`;

        this._disposables.push(() => d1.dispose());
    }

    dispose(): void {
        this._disposables.forEach((dispose) => dispose());
    }
}

const api = createDockview(document.getElementById('app'), {
    className: 'dockview-theme-abyss',
    createComponent: (options): IContentRenderer => {
        switch (options.name) {
            case 'default':
                return new Panel();
            default:
                throw new Error('Panel not found');
        }
    },
    createPrefixHeaderActionComponent: (group): IHeaderActionsRenderer => {
        return new PrefixHeader(group);
    },
    createLeftHeaderActionComponent: (group): IHeaderActionsRenderer => {
        return new LeftHeaderActions(group);
    },
    createRightHeaderActionComponent: (group): IHeaderActionsRenderer => {
        return new RightHeaderActions(group);
    },
});

api.addPanel({
    id: 'panel_1',
    component: 'default',
    title: 'Panel 1',
});

api.addPanel({
    id: 'panel_2',
    component: 'default',
    title: 'Panel 2',
    position: {
        direction: 'right',
    },
});

api.addPanel({
    id: 'panel_3',
    component: 'default',
    title: 'Panel 3',
    position: {
        direction: 'below',
    },
});
