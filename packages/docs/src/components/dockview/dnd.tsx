import {
    DockviewDndOverlayEvent,
    DockviewDropEvent,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return (
            <div style={{ padding: '20px' }}>
                <div>{props.params.title}</div>
            </div>
        );
    },
};

export const DndDockview = (props: { renderVisibleOnly: boolean }) => {
    const onReady = (event: DockviewReadyEvent) => {
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
    };

    const onDidDrop = (event: DockviewDropEvent) => {
        const { group } = event;

        event.api.addPanel({
            id: 'test',
            component: 'default',
            position: {
                referencePanel: group.activePanel.id,
                direction: 'within',
            },
        });
    };

    const showDndOverlay = (event: DockviewDndOverlayEvent) => {
        return true;
    };

    return (
        <>
            <div
                style={{
                    backgroundColor: 'orange',
                    padding: '0px 8px',
                    borderRadius: '4px',
                    width: '100px',
                    cursor: 'pointer',
                }}
                draggable={true}
            >
                Drag me
            </div>
            <div
                style={{
                    height: '300px',
                    backgroundColor: 'rgb(30,30,30)',
                    color: 'white',
                    margin: '20px 0px',
                }}
            >
                <DockviewReact
                    components={components}
                    onReady={onReady}
                    className="dockview-theme-abyss"
                    onDidDrop={onDidDrop}
                    showDndOverlay={showDndOverlay}
                />
            </div>
        </>
    );
};
