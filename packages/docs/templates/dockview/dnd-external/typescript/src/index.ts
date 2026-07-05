import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    DockviewApi,
    GroupPanelPartInitParameters,
    IContentRenderer,
    positionToDirection,
    themeAbyss,
} from 'dockview';

class Panel implements IContentRenderer {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor() {
        this._element = document.createElement('div');
        this._element.style.padding = '20px';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const inner = document.createElement('div');
        inner.textContent = parameters.params.title ?? '';
        this._element.appendChild(inner);
    }
}

const root = document.getElementById('app')!;
root.style.display = 'flex';
root.style.flexDirection = 'column';
root.style.height = '100%';

// A native (non-dockview) draggable element that can be dropped into the dock.
const controls = document.createElement('div');
controls.style.margin = '2px 0px';

const draggable = document.createElement('span');
draggable.tabIndex = -1;
draggable.draggable = true;
draggable.textContent = 'Drag me into the dock';
draggable.style.backgroundColor = 'orange';
draggable.style.padding = '0px 8px';
draggable.style.borderRadius = '4px';
draggable.style.width = '100px';
draggable.style.cursor = 'pointer';
draggable.addEventListener('dragstart', (event) => {
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', 'nothing');
    }
});

// A native drop zone that inspects any dockview tab/group dropped onto it.
const dropZone = document.createElement('div');
dropZone.textContent =
    'Drop a tab or group here to inspect the attached metadata';
dropZone.style.padding = '0px 4px';
dropZone.style.backgroundColor = 'black';
dropZone.style.borderRadius = '2px';
dropZone.style.color = 'white';
dropZone.addEventListener('drop', (event) => {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) {
        return;
    }

    let text = 'The following dataTransfer data was found:\n';

    for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        const value = dataTransfer.getData(item.type);
        text += `type=${item.type},data=${value}\n`;
    }

    alert(text);
});

controls.append(draggable, dropZone);

const dockElement = document.createElement('div');
dockElement.style.flexGrow = '1';

root.append(controls, dockElement);

const api: DockviewApi = createDockview(dockElement, {
    theme: themeAbyss,
    dndEdges: {
        size: { value: 100, type: 'pixels' },
        activationSize: { value: 5, type: 'percentage' },
    },
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
});

api.addPanel({
    id: 'panel_1',
    component: 'default',
    params: {
        title: 'Panel 1',
    },
});

api.addPanel({
    id: 'panel_2',
    component: 'default',
    params: {
        title: 'Panel 2',
    },
});

api.addPanel({
    id: 'panel_3',
    component: 'default',
    params: {
        title: 'Panel 3',
    },
});

api.addPanel({
    id: 'panel_4',
    component: 'default',
    params: {
        title: 'Panel 4',
    },
    position: { referencePanel: 'panel_1', direction: 'right' },
});

// Pointer (touch) drags can't bridge to external HTML5 drop
// zones outside dockview; narrow before reading `dataTransfer`.
api.onWillDragPanel((event) => {
    if (!(event.nativeEvent instanceof DragEvent)) {
        return;
    }
    const dataTransfer = event.nativeEvent.dataTransfer;

    if (dataTransfer) {
        dataTransfer.setData(
            'text/plain',
            'Some custom panel data transfer data'
        );
        dataTransfer.setData(
            'text/json',
            '{text: "Some custom panel data transfer data"}'
        );
    }
});

api.onWillDragGroup((event) => {
    if (!(event.nativeEvent instanceof DragEvent)) {
        return;
    }
    const dataTransfer = event.nativeEvent.dataTransfer;

    if (dataTransfer) {
        dataTransfer.setData(
            'text/plain',
            'Some custom group data transfer data'
        );
        dataTransfer.setData(
            'text/json',
            '{text: "Some custom group data transfer data"}'
        );
    }
});

api.onUnhandledDragOver((event) => {
    event.accept();
});

api.onDidDrop((event) => {
    event.api.addPanel({
        id: 'test',
        component: 'default',
        position: {
            direction: positionToDirection(event.position),
            referenceGroup: event.group || undefined,
        },
    });
});
