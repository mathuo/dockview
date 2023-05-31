import {
    DockviewDefaultTab,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';

interface CustomProps {
    valueA: string;
}

const components = {
    default: (props: IDockviewPanelProps<CustomProps>) => {
        return <div style={{ padding: '20px' }}>{props.api.title}</div>;
    },
};

const headerComponents = {
    default: (props: IDockviewPanelHeaderProps<CustomProps>) => {
        const onContextMenu = (event: React.MouseEvent) => {
            event.preventDefault();
            alert(
                `This custom header was parsed the params ${JSON.stringify(
                    props.params
                )}`
            );
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
            params: {
                valueA: 'test value',
            },
        });
        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
            params: {
                valueA: 'test value',
            },
        });
        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
            params: {
                valueA: 'test value',
            },
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            title: 'Panel 4',
            position: { referencePanel: 'panel_3', direction: 'right' },
            params: {
                valueA: 'test value',
            },
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            title: 'Panel 5',
            position: { referencePanel: 'panel_4', direction: 'within' },
            params: {
                valueA: 'test value',
            },
        });
        const panel6 = event.api.addPanel({
            id: 'panel_6',
            component: 'default',
            title: 'Panel 6',
            position: { referencePanel: 'panel_4', direction: 'below' },
            params: {
                valueA: 'test value',
            },
        });
        panel6.group.locked = true;
        panel6.group.header.hidden = true;
        event.api.addPanel({
            id: 'panel_7',
            component: 'default',
            title: 'Panel 7',
            position: { referencePanel: 'panel_6', direction: 'right' },
            params: {
                valueA: 'test value',
            },
        });
        event.api.addPanel({
            id: 'panel_8',
            component: 'default',

            title: 'Panel 8',
            position: { referencePanel: 'panel_7', direction: 'within' },
            params: {
                valueA: 'test value',
            },
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
