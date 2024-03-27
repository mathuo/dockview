import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import React from 'react';

const Default = (props: IDockviewPanelProps) => {
    return <div>{props.api.title}</div>;
};

const components = {
    default: Default,
};

export default () => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            position: {
                direction: 'right',
                referencePanel: 'panel_1',
            },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: {
                direction: 'below',
                referencePanel: 'panel_1',
            },
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
        });
    };

    return (
        <DockviewReact
            className={'dockview-theme-abyss'}
            onReady={onReady}
            components={components}
        />
    );
};
