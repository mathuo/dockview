import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-react';
import React from 'react';

const Default = (props: IDockviewPanelProps) => {
    return <div style={{ padding: 8 }}>{props.api.title}</div>;
};

const components = {
    default: Default,
};

// Below 600px the three side-by-side groups collapse into a single tabbed
// group; above 680px they expand back out. Resize this pane to see it — the
// reflow reacts to the *container* width, not the viewport.
const responsive = {
    breakpoints: [
        { name: 'lg', maxWidth: Infinity },
        {
            name: 'sm',
            maxWidth: 600,
            exitAt: 680,
            rules: [{ kind: 'collapseToTabs' as const }],
        },
    ],
};

export default () => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'sidebar',
            component: 'default',
            title: 'Sidebar',
        });
        event.api.addPanel({
            id: 'editor',
            component: 'default',
            title: 'Editor',
            position: { direction: 'right', referencePanel: 'sidebar' },
        });
        event.api.addPanel({
            id: 'inspector',
            component: 'default',
            title: 'Inspector',
            position: { direction: 'right', referencePanel: 'editor' },
        });
    };

    return (
        <DockviewReact
            className={'dockview-theme-abyss'}
            onReady={onReady}
            components={components}
            responsive={responsive}
        />
    );
};
