import {
    DockviewDndOverlayEvent,
    DockviewDropEvent,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';
import './app.scss';

const InnerDockview = () => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
        });
    };

    return (
        <DockviewReact
            onReady={onReady}
            components={components}
            className="nested-dockview"
        />
    );
};

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
    innerDockview: InnerDockview,
};

const NestedDockview = (props: { theme?: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'innerDockview',
            position: { referencePanel: 'panel_2', direction: 'right' },
        });
    };

    const showDndOverlay = (event: DockviewDndOverlayEvent) => {
        // console.log(event.getData());

        return false;
    };

    const onDidDrop = (event: DockviewDropEvent) => {
        // event.getData();
    };

    return (
        <DockviewReact
            onReady={onReady}
            components={components}
            className={`${props.theme || 'dockview-theme-abyss'}`}
            showDndOverlay={showDndOverlay}
            onDidDrop={onDidDrop}
        />
    );
};

export default NestedDockview;
