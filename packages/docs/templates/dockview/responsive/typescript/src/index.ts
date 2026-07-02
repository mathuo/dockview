import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
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
        this._element.style.padding = '8px';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this._element.textContent = parameters.title;
    }
}

const api = createDockview(document.getElementById('app'), {
    theme: themeAbyss,
    createComponent: (options) => {
        switch (options.name) {
            case 'default':
                return new Panel();
        }
    },
    // Below 600px the three side-by-side groups collapse into one tabbed group;
    // above 680px they expand back out. The reflow reacts to the *container*
    // width, not the viewport — resize this pane to see it.
    responsive: {
        breakpoints: [
            { name: 'lg', maxWidth: Infinity },
            {
                name: 'sm',
                maxWidth: 600,
                exitAt: 680,
                rules: [{ kind: 'collapseToTabs' }],
            },
        ],
    },
});

api.addPanel({ id: 'sidebar', component: 'default', title: 'Sidebar' });
api.addPanel({
    id: 'editor',
    component: 'default',
    title: 'Editor',
    position: { referencePanel: 'sidebar', direction: 'right' },
});
api.addPanel({
    id: 'inspector',
    component: 'default',
    title: 'Inspector',
    position: { referencePanel: 'editor', direction: 'right' },
});
