import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    IDockviewHeaderActionsProps,
} from 'dockview';
import React from 'react';

const Default = (props: IDockviewPanelProps) => {
    return (
        <div style={{ padding: 10 }}>
            <div>{props.api.title}</div>
        </div>
    );
};

const components = {
    default: Default,
};

const RightActions = (props: IDockviewHeaderActionsProps) => {
    if (props.location?.type !== 'edge') {
        return null;
    }

    const [collapsed, setCollapsed] = React.useState(props.api.isCollapsed());

    React.useEffect(() => {
        const disposable = props.api.onDidCollapsedChange((isCollapsed) => {
            setCollapsed(isCollapsed);
        });
        return () => disposable.dispose();
    }, [props.api]);

    return (
        <button
            style={{
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                color: 'inherit',
                padding: '0 4px',
            }}
            onClick={() =>
                collapsed ? props.api.expand() : props.api.collapse()
            }
        >
            {collapsed ? '+' : '-'}
        </button>
    );
};

export default () => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addEdgeGroup('left', {
            id: 'left',
            initialSize: 220,
            minimumSize: 150,
        });

        event.api.addEdgeGroup('bottom', {
            id: 'bottom',
            initialSize: 180,
            minimumSize: 100,
        });

        event.api.addEdgeGroup('right', {
            id: 'right',
            initialSize: 220,
            minimumSize: 150,
            collapsed: true,
        });

        event.api.addPanel({
            id: 'explorer',
            component: 'default',
            title: 'Explorer',
            position: { referenceGroup: 'left' },
        });

        event.api.addPanel({
            id: 'search',
            component: 'default',
            title: 'Search',
            position: { referenceGroup: 'left' },
        });

        event.api.addPanel({
            id: 'terminal',
            component: 'default',
            title: 'Terminal',
            position: { referenceGroup: 'bottom' },
        });

        event.api.addPanel({
            id: 'output',
            component: 'default',
            title: 'Output',
            position: { referenceGroup: 'bottom' },
        });

        event.api.addPanel({
            id: 'outline',
            component: 'default',
            title: 'Outline',
            position: { referenceGroup: 'right' },
        });

        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Editor',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Preview',
            position: { direction: 'right', referencePanel: 'panel_1' },
        });
    };

    return (
        <DockviewReact
            className={'dockview-theme-abyss'}
            onReady={onReady}
            components={components}
            rightHeaderActionsComponent={RightActions}
        />
    );
};
