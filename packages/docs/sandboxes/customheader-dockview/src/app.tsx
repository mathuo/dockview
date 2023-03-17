import {
    DockviewDefaultTab,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
};

const MyCustomheader = (props: IDockviewPanelHeaderProps) => {
    const onContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        alert('context menu');
    };
    return <DockviewDefaultTab onContextMenu={onContextMenu} {...props} />;
};

const headerComponents = {
    default: (props: IDockviewPanelHeaderProps) => {
        const onContextMenu = (event: React.MouseEvent) => {
            event.preventDefault();
            alert('context menu');
        };
        return <DockviewDefaultTab onContextMenu={onContextMenu} {...props} />;
    },
};

const CustomHeadersDockview = () => {
    const onReady = (event: DockviewReadyEvent) => {
        const d = localStorage.getItem('test');

        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
        });
        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
        });
        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            title: 'Panel 4',
            position: { referencePanel: 'panel_3', direction: 'right' },
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            title: 'Panel 5',
            position: { referencePanel: 'panel_4', direction: 'within' },
        });
        const panel6 = event.api.addPanel({
            id: 'panel_6',
            component: 'default',
            title: 'Panel 6',
            position: { referencePanel: 'panel_4', direction: 'below' },
        });
        panel6.group.locked = true;
        panel6.group.header.hidden = true;
        event.api.addPanel({
            id: 'panel_7',
            component: 'default',
            title: 'Panel 7',
            position: { referencePanel: 'panel_6', direction: 'right' },
        });
        event.api.addPanel({
            id: 'panel_8',
            component: 'default',

            title: 'Panel 8',
            position: { referencePanel: 'panel_7', direction: 'within' },
        });

        event.api.addGroup();
    };

    return (
        <DockviewReact
            components={components}
            defaultTabComponent={headerComponents.default}
            onReady={onReady}
            className="dockview-theme-abyss"
        />
    );
};

export default CustomHeadersDockview;
