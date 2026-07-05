import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    DockviewApi,
    DockviewGroupPanel,
    DockviewPanelApi,
    GroupPanelPartInitParameters,
    IContentRenderer,
    IGroupHeaderProps,
    IHeaderActionsRenderer,
    IWatermarkRenderer,
    themeAbyss,
} from 'dockview';

const STORAGE_KEY = 'floating.layout';

// A show/hide popover menu, closing when clicking outside. The active document
// is provided lazily so the outside-click handler follows the panel's window
// when the group is popped out.
class PopoverMenu {
    private readonly _element: HTMLElement;
    private readonly _button: HTMLButtonElement;
    private readonly _menu: HTMLUListElement;
    private _open = false;
    private _outsideHandler?: (event: Event) => void;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(private readonly getWindow: () => Window) {
        this._element = document.createElement('span');

        this._button = document.createElement('button');
        this._button.style.position = 'relative';
        this._button.textContent = 'Show';

        this._menu = this.createMenu();
        this._menu.style.display = 'none';
        this._button.appendChild(this._menu);

        this._button.addEventListener('click', () => this.toggle());
        this._element.appendChild(this._button);
    }

    private createMenu(): HTMLUListElement {
        const menu = document.createElement('ul');
        Object.assign(menu.style, {
            position: 'absolute',
            top: '-120px',
            right: '0',
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            listStyle: 'none',
            padding: '8px 0',
            margin: '0',
            minWidth: '120px',
            zIndex: '1000',
        } as CSSStyleDeclaration);

        for (let i = 1; i <= 4; i++) {
            const item = document.createElement('li');
            item.style.padding = '8px 16px';
            item.style.cursor = 'pointer';
            item.textContent = `Item ${i}`;
            item.addEventListener(
                'mouseenter',
                () => (item.style.backgroundColor = '#f5f5f5')
            );
            item.addEventListener(
                'mouseleave',
                () => (item.style.backgroundColor = 'transparent')
            );
            menu.appendChild(item);
        }

        return menu;
    }

    private toggle(): void {
        this._open ? this.close() : this.open();
    }

    private open(): void {
        this._open = true;
        this._button.firstChild!.textContent = 'Hide';
        this._menu.style.display = '';

        const doc = this.getWindow()?.document ?? document;
        this._outsideHandler = (event: Event) => {
            if (!this._button.contains(event.target as Node)) {
                this.close();
            }
        };
        doc.addEventListener('mousedown', this._outsideHandler);
    }

    close(): void {
        if (!this._open) {
            return;
        }
        this._open = false;
        this._button.firstChild!.textContent = 'Show';
        this._menu.style.display = 'none';

        if (this._outsideHandler) {
            const doc = this.getWindow()?.document ?? document;
            doc.removeEventListener('mousedown', this._outsideHandler);
            this._outsideHandler = undefined;
        }
    }
}

class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;
    private readonly _disposables: (() => void)[] = [];
    private _window!: Window;

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
        const api: DockviewPanelApi = parameters.api;

        this._window = api.getWindow();
        const locationDisposable = api.onDidLocationChange(() => {
            this._window = api.getWindow();
        });
        this._disposables.push(() => locationDisposable.dispose());

        const printButton = document.createElement('button');
        printButton.textContent = 'Print';

        const popover = new PopoverMenu(() => this._window);

        printButton.addEventListener('click', () => {
            console.log(this._window);
            // Briefly hide the popover, mirroring the React `reset` behaviour.
            popover.close();
            popover.element.style.display = 'none';
            setTimeout(() => {
                popover.element.style.display = '';
            }, 2000);
        });

        const title = document.createElement('span');
        title.textContent = api.title ?? '';
        const titleDisposable = api.onDidTitleChange(() => {
            title.textContent = api.title ?? '';
        });
        this._disposables.push(() => titleDisposable.dispose());

        this._element.append(printButton, popover.element, title);
    }

    dispose(): void {
        this._disposables.forEach((dispose) => dispose());
    }
}

class Watermark implements IWatermarkRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.color = 'white';
        this._element.style.padding = '8px';
        this._element.textContent = 'watermark';
    }

    init(): void {
        //
    }
}

// Renders a single clickable material-symbols icon, mirroring the React `Icon`.
function createIcon(icon: string, onClick: () => void): HTMLElement {
    const container = document.createElement('div');
    container.style.height = '100%';
    container.style.color = 'white';
    container.style.padding = '0px 4px';

    const button = document.createElement('div');
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.width = '30px';
    button.style.height = '100%';
    button.style.fontSize = '18px';

    const span = document.createElement('span');
    span.className = 'material-symbols-outlined';
    span.style.fontSize = 'inherit';
    span.style.cursor = 'pointer';
    span.textContent = icon;

    button.appendChild(span);
    button.addEventListener('click', onClick);
    container.appendChild(button);

    return container;
}

let panelCount = 0;

// Left header action: add a new panel to the group.
class LeftHeaderActions implements IHeaderActionsRenderer {
    private readonly _element: HTMLElement = document.createElement('div');

    get element(): HTMLElement {
        return this._element;
    }

    init(parameters: IGroupHeaderProps): void {
        const icon = createIcon('add', () => {
            parameters.containerApi.addPanel({
                id: (++panelCount).toString(),
                title: `Tab ${panelCount}`,
                component: 'default',
                position: { referenceGroup: parameters.group.id },
            });
        });
        this._element.appendChild(icon);
    }

    dispose(): void {
        //
    }
}

// Right header action: pop the group out into its own window, or redock it.
class RightHeaderActions implements IHeaderActionsRenderer {
    private readonly _element: HTMLElement = document.createElement('div');
    private readonly _disposables: (() => void)[] = [];

    get element(): HTMLElement {
        return this._element;
    }

    init(parameters: IGroupHeaderProps): void {
        const render = () => {
            const popout = parameters.api.location.type === 'popout';
            this._element.innerHTML = '';
            const icon = createIcon(
                popout ? 'jump_to_element' : 'back_to_tab',
                () => {
                    if (parameters.api.location.type === 'popout') {
                        const group = parameters.containerApi.addGroup();
                        parameters.group.api.moveTo({ group });
                    } else {
                        parameters.containerApi.addPopoutGroup(
                            parameters.group as DockviewGroupPanel,
                            {
                                popoutUrl: '/popout/index.html',
                            }
                        );
                    }
                }
            );
            this._element.appendChild(icon);
        };

        render();

        const disposable = parameters.group.api.onDidLocationChange(() =>
            render()
        );
        this._disposables.push(() => disposable.dispose());
    }

    dispose(): void {
        this._disposables.forEach((dispose) => dispose());
    }
}

function loadDefaultLayout(api: DockviewApi): void {
    api.addPanel({
        id: 'panel_1',
        component: 'default',
    });
}

function load(api: DockviewApi): void {
    api.clear();
    const layoutString = localStorage.getItem(STORAGE_KEY);
    if (layoutString) {
        try {
            api.fromJSON(JSON.parse(layoutString));
        } catch (err) {
            console.error(err);
            api.clear();
            loadDefaultLayout(api);
        }
    } else {
        loadDefaultLayout(api);
    }
}

const root = document.getElementById('app')!;
root.style.display = 'flex';
root.style.flexDirection = 'column';
root.style.height = '100%';

const toolbar = document.createElement('div');
toolbar.style.height = '25px';

const saveButton = document.createElement('button');
saveButton.textContent = 'Save';
const loadButton = document.createElement('button');
loadButton.textContent = 'Load';
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
toolbar.append(saveButton, loadButton, clearButton);

const dockElement = document.createElement('div');
dockElement.style.flexGrow = '1';

root.append(toolbar, dockElement);

const api: DockviewApi = createDockview(dockElement, {
    theme: themeAbyss,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
    createWatermarkComponent: () => new Watermark(),
    createLeftHeaderActionComponent: () => new LeftHeaderActions(),
    createRightHeaderActionComponent: () => new RightHeaderActions(),
});

load(api);

saveButton.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(api.toJSON()));
});

loadButton.addEventListener('click', () => {
    load(api);
});

clearButton.addEventListener('click', () => {
    api.clear();
    localStorage.removeItem(STORAGE_KEY);
});
