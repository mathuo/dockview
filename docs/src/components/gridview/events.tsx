import {
    IGridviewPanelProps,
    Orientation,
    GridviewReact,
    GridviewReadyEvent,
} from 'dockview';
import * as React from 'react';
import { Console, Line } from '../console/console';

const components = {
    default: (props: IGridviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
};

export const EventsGridview = () => {
    const [lines, setLines] = React.useState<Line[]>([]);

    const onReady = (event: GridviewReadyEvent) => {
        const disposables = [
            event.api.onDidAddPanel((panel) => {
                setLines((lines) => [
                    ...lines,
                    {
                        timestamp: new Date(),
                        text: `onDidAddPanel: ${panel.id}`,
                    },
                ]);
            }),
            event.api.onDidRemovePanel((panel) => {
                setLines((lines) => [
                    ...lines,
                    {
                        timestamp: new Date(),
                        text: `onDidRemovePanel: ${panel.id}`,
                    },
                ]);
            }),
            event.api.onDidActivePanelChange((panel) => {
                setLines((lines) => [
                    ...lines,
                    {
                        timestamp: new Date(),
                        text: `onDidActivePanelChange: ${panel?.id}`,
                    },
                ]);
            }),
            event.api.onDidLayoutChange((panel) => {
                setLines((lines) => [
                    ...lines,
                    { timestamp: new Date(), text: `onDidLayoutChange` },
                ]);
            }),
            event.api.onDidLayoutFromJSON((panel) => {
                setLines((lines) => [
                    ...lines,
                    { timestamp: new Date(), text: `onDidLayoutFromJSON` },
                ]);
            }),
        ];

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
        <>
            <div
                style={{
                    height: '300px',
                    backgroundColor: 'rgb(30,30,30)',
                    color: 'white',
                    margin: '20px 0px',
                }}
            >
                <GridviewReact
                    components={components}
                    onReady={onReady}
                    proportionalLayout={false}
                    orientation={Orientation.VERTICAL}
                    className="dockview-theme-dark"
                />
            </div>
            <Console lines={lines} />
        </>
    );
};
