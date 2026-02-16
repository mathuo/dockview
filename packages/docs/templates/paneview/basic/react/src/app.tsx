import {
    PaneviewReact,
    PaneviewReadyEvent,
    IPaneviewPanelProps,
} from 'dockview';
import React from 'react';

const Default = (props: IPaneviewPanelProps) => {
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
    const onReady = (event: PaneviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
            size: 150,
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
            size: 200,
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
            size: 180,
        });
    };

    return (
        <PaneviewReact
            className={'dockview-theme-abyss'}
            orientation="VERTICAL"
            onReady={onReady}
            components={components}
        />
    );
};