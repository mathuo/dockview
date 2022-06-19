import {
    IGridviewPanelProps,
    Orientation,
    GridviewReact,
    GridviewReadyEvent,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IGridviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
};

export const SimpleGridview = () => {
    const onReady = (event: GridviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
        });

        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            params: {
                title: 'Panel 4',
            },
            position: { referencePanel: 'panel_1', direction: 'right' },
        });

        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            params: {
                title: 'Panel 5',
            },
            position: { referencePanel: 'panel_3', direction: 'right' },
        });

        event.api.addPanel({
            id: 'panel_6',
            component: 'default',
            params: {
                title: 'Panel 6',
            },
            position: { referencePanel: 'panel_5', direction: 'below' },
            minimumWidth: 10,
        });

        event.api.addPanel({
            id: 'panel_7',
            component: 'default',
            params: {
                title: 'Panel 7',
            },
            position: { referencePanel: 'panel_6', direction: 'right' },
            minimumWidth: 10,
        });

        event.api.addPanel({
            id: 'panel_8',
            component: 'default',
            params: {
                title: 'Panel 8',
            },
            position: { referencePanel: 'panel_6', direction: 'right' },
            minimumWidth: 10,
        });
    };

    return (
        <GridviewReact
            components={components}
            onReady={onReady}
            proportionalLayout={false}
            orientation={Orientation.VERTICAL}
            className="dockview-theme-abyss"
        />
    );
};
