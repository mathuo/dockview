import {
    SplitviewReact,
    SplitviewReadyEvent,
    ISplitviewPanelProps,
} from 'dockview';
import React from 'react';

const Default = (props: ISplitviewPanelProps) => {
    return (
        <div style={{ height: '100%', padding: '10px', color: 'white', background: '#1e1e1e' }}>
            Panel {props.api.id}
        </div>
    );
};

const components = {
    default: Default,
};

export default () => {
    const onReady = (event: SplitviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            size: 200,
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            size: 300,
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            size: 200,
        });
    };

    return (
        <SplitviewReact
            className={'dockview-theme-abyss'}
            orientation="VERTICAL"
            onReady={onReady}
            components={components}
        />
    );
};