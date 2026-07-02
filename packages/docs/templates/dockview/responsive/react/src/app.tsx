import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    LayoutPriority,
} from 'dockview-react';
import React from 'react';

/**
 * A "complex" responsive demo that exercises all three reflow transforms as the
 * container narrows — driven by the *container* width, not the viewport. Resize
 * this pane and watch the status bar:
 *
 *   lg  (>900px)      canonical — four groups side by side
 *   md  (640–900px)   restack           — flipped from columns to rows
 *   sm  (440–640px)   restack + hide    — low-priority groups parked
 *   xs  (<440px)      collapseToTabs    — everything folded into one tabbed group
 *
 * Group LayoutPriority drives the transforms: `hide` parks the `Low` groups
 * (Explorer, Terminal); both `hide` and `collapseToTabs` keep/merge into the
 * highest-priority group (the `Fill` Editor).
 */

const TINTS: Record<string, string> = {
    Files: '#1f6feb',
    'app.ts': '#238636',
    'styles.css': '#238636',
    Properties: '#8957e5',
    Output: '#9e6a03',
};

const Default = (props: IDockviewPanelProps) => {
    const title = props.api.title ?? '';
    return (
        <div
            style={{
                height: '100%',
                padding: 12,
                boxSizing: 'border-box',
                color: 'white',
                borderTop: `2px solid ${TINTS[title] ?? '#484f58'}`,
            }}
        >
            {title}
        </div>
    );
};

const components = { default: Default };

const BANDS: Record<string, string> = {
    lg: 'lg · ≥900px · canonical — four groups side by side',
    md: 'md · 640–900px · restack — flipped from columns to rows',
    sm: 'sm · 440–640px · restack + hide — low-priority groups parked',
    xs: 'xs · <440px · collapseToTabs — one tabbed group',
};

const responsive = {
    breakpoints: [
        { name: 'lg', maxWidth: Infinity },
        {
            name: 'md',
            maxWidth: 900,
            exitAt: 980,
            rules: [{ kind: 'restack' as const }],
        },
        {
            name: 'sm',
            maxWidth: 640,
            exitAt: 720,
            rules: [{ kind: 'restack' as const }, { kind: 'hide' as const }],
        },
        {
            name: 'xs',
            maxWidth: 440,
            exitAt: 520,
            rules: [{ kind: 'collapseToTabs' as const }],
        },
    ],
};

export default () => {
    const [band, setBand] = React.useState('lg');

    const onReady = (event: DockviewReadyEvent) => {
        const api = event.api;
        api.onDidBreakpointChange((e) => setBand(e.to));

        const explorer = api.addPanel({
            id: 'files',
            component: 'default',
            title: 'Files',
        });
        explorer.group.api.priority = LayoutPriority.Low;

        const editor = api.addPanel({
            id: 'editor',
            component: 'default',
            title: 'app.ts',
            position: { direction: 'right', referencePanel: 'files' },
        });
        editor.group.api.priority = LayoutPriority.Fill;
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
        terminal.group.api.priority = LayoutPriority.Low;

        editor.api.setActive();
        setBand(api.activeBreakpoint ?? 'lg');
    };

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div
                style={{
                    flex: '0 0 auto',
                    padding: '6px 10px',
                    font: '12px/1.4 ui-monospace, monospace',
                    color: '#e6edf3',
                    background: '#161b22',
                    borderBottom: '1px solid #30363d',
                }}
            >
                {BANDS[band] ?? `breakpoint: ${band}`}
            </div>
            <div style={{ flex: '1 1 auto', minHeight: 0 }}>
                <DockviewReact
                    className={'dockview-theme-abyss'}
                    onReady={onReady}
                    components={components}
                    responsive={responsive}
                />
            </div>
        </div>
    );
};
