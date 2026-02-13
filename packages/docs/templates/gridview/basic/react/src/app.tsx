import {
    GridviewReact,
    GridviewReadyEvent,
    IGridviewPanelProps,
} from 'dockview';
import React from 'react';

const Default = (props: IGridviewPanelProps) => {
    return (
        <div style={{ 
            padding: '10px', 
            color: 'white', 
            background: '#1e1e1e', 
            border: '1px solid #333',
            height: '100%'
        }}>
            Panel {props.api.id}
        </div>
    );
};

const components = {
    default: Default,
};

export default () => {
    const onReady = (event: GridviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            position: { referencePanel: 'panel_1', direction: 'right' },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: { referencePanel: 'panel_1', direction: 'below' },
        });

        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            position: { referencePanel: 'panel_2', direction: 'below' },
        });
    };

    return (
        <GridviewReact
            className={'dockview-theme-abyss'}
            onReady={onReady}
            components={components}
        />
    );
};