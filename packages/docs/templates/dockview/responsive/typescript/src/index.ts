import 'dockview/dist/styles/dockview.css';
import {
    createDockview,
    DockviewApi,
    GroupPanelPartInitParameters,
    IContentRenderer,
    LayoutPriority,
    themeAbyss,
} from 'dockview';

/**
 * A "complex" responsive demo that exercises all three reflow transforms as the
 * container narrows — driven purely by the *container* width, not the viewport.
 * Resize this pane and watch the status bar:
 *
 *   lg  (>900px)      canonical — four groups side by side
 *   md  (640–900px)   restack           — flipped from columns to rows
 *   sm  (440–640px)   restack + hide    — low-priority groups parked
 *   xs  (<440px)      collapseToTabs    — everything folded into one tabbed group
 *
 * Group LayoutPriority drives the transforms: `hide` parks the `Low` groups
 * (Explorer, Terminal) and both `hide` and `collapseToTabs` keep/merge into the
 * highest-priority group (the `Fill` Editor).
 */

const TINTS: Record<string, string> = {
    Files: '#1f6feb',
    'app.ts': '#238636',
    'styles.css': '#238636',
    Properties: '#8957e5',
    Output: '#9e6a03',
};

class Panel implements IContentRenderer {
    private readonly _element = document.createElement('div');

    get element(): HTMLElement {
        return this._element;
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const title = parameters.title ?? '';
        this._element.style.height = '100%';
        this._element.style.padding = '12px';
        this._element.style.boxSizing = 'border-box';
        this._element.style.color = 'white';
        this._element.style.borderTop = `2px solid ${TINTS[title] ?? '#484f58'}`;
        this._element.textContent = title;
    }
}

const BANDS: Record<string, string> = {
    lg: 'lg · ≥900px · canonical — four groups side by side',
    md: 'md · 640–900px · restack — flipped from columns to rows',
    sm: 'sm · 440–640px · restack + hide — low-priority groups parked',
    xs: 'xs · <440px · collapseToTabs — one tabbed group',
};

// Build the surrounding chrome: a status bar above the dockview host.
const host = document.getElementById('app')!;
host.style.display = 'flex';
host.style.flexDirection = 'column';

const status = document.createElement('div');
status.style.cssText =
    'flex:0 0 auto;padding:6px 10px;font:12px/1.4 ui-monospace,monospace;' +
    'color:#e6edf3;background:#161b22;border-bottom:1px solid #30363d;';
const dockviewHost = document.createElement('div');
dockviewHost.style.cssText = 'flex:1 1 auto;min-height:0;';
host.append(status, dockviewHost);

const api: DockviewApi = createDockview(dockviewHost, {
    theme: themeAbyss,
    createComponent: () => new Panel(),
    responsive: {
        breakpoints: [
            { name: 'lg', maxWidth: Infinity },
            {
                name: 'md',
                maxWidth: 900,
                exitAt: 980,
                rules: [{ kind: 'restack' }],
            },
            {
                name: 'sm',
                maxWidth: 640,
                exitAt: 720,
                rules: [{ kind: 'restack' }, { kind: 'hide' }],
            },
            {
                name: 'xs',
                maxWidth: 440,
                exitAt: 520,
                rules: [{ kind: 'collapseToTabs' }],
            },
        ],
    },
});

const setStatus = (bp: string | undefined) => {
    status.textContent = BANDS[bp ?? 'lg'] ?? `breakpoint: ${bp}`;
};
api.onDidBreakpointChange((e) => setStatus(e.to));

// --- the canonical (wide) layout: four groups with distinct priorities ---

const explorer = api.addPanel({
    id: 'files',
    component: 'default',
    title: 'Files',
});
explorer.group.api.priority = LayoutPriority.Low; // parked first on `hide`

const editor = api.addPanel({
    id: 'editor',
    component: 'default',
    title: 'app.ts',
    position: { direction: 'right', referencePanel: 'files' },
});
editor.group.api.priority = LayoutPriority.Fill; // hosts the merge / always kept
api.addPanel({
    id: 'styles',
    component: 'default',
    title: 'styles.css',
    position: { referenceGroup: editor.group },
});

const inspector = api.addPanel({
    id: 'inspector',
    component: 'default',
    title: 'Properties',
    position: { direction: 'right', referenceGroup: editor.group },
});

const terminal = api.addPanel({
    id: 'terminal',
    component: 'default',
    title: 'Output',
    position: { direction: 'right', referenceGroup: inspector.group },
});
terminal.group.api.priority = LayoutPriority.Low; // parked on `hide`

editor.api.setActive();
setStatus(api.activeBreakpoint);
