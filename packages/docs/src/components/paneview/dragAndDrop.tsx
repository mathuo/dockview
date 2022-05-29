import {
    IPaneviewPanelProps,
    PaneviewDropEvent,
    PaneviewReact,
    PaneviewReadyEvent,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IPaneviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    padding: '10px',
                    height: '100%',
                    backgroundColor: 'rgb(60,60,60)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
};

export const DragAndDropPaneview = () => {
    const onReady = (event: PaneviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
            title: 'Panel 1',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
            title: 'Panel 2',
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
            title: 'Panel 3',
        });
    };

    const onDidDrop = (event: PaneviewDropEvent) => {
        const index = event.api.panels.indexOf(event.panel);

        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            params: {
                title: 'Panel 4',
            },
            title: 'Panel 4',
            index,
        });
    };

    return (
        <div>
            <div>
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
            </div>
            <div
                style={{
                    height: '300px',
                    backgroundColor: 'rgb(30,30,30)',
                    color: 'white',
                    margin: '20px 0px',
                }}
            >
                <PaneviewReact
                    components={components}
                    onReady={onReady}
                    onDidDrop={onDidDrop}
                    className="dockview-theme-dark"
                />
            </div>
        </div>
    );
};
