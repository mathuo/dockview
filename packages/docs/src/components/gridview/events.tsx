import {
    IGridviewPanelProps,
    Orientation,
    GridviewReact,
    GridviewReadyEvent,
    GridviewApi,
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
    const [checked, setChecked] = React.useState<boolean>(false);

    const [api, setApi] = React.useState<GridviewApi | undefined>();

    React.useEffect(() => {
        if (!api) {
            return () => {
                //noop
            };
        }

        const disposables = [
            api.onDidAddPanel((panel) => {
                setLines((lines) => [
                    ...lines,
                    {
                        timestamp: new Date(),
                        text: `onDidAddPanel: ${panel.id}`,
                    },
                ]);
            }),
            api.onDidRemovePanel((panel) => {
                setLines((lines) => [
                    ...lines,
                    {
                        timestamp: new Date(),
                        text: `onDidRemovePanel: ${panel.id}`,
                    },
                ]);
            }),
            api.onDidActivePanelChange((panel) => {
                setLines((lines) => [
                    ...lines,
                    {
                        timestamp: new Date(),
                        text: `onDidActivePanelChange: ${panel?.id}`,
                    },
                ]);
            }),
            api.onDidLayoutChange((panel) => {
                setLines((lines) => [
                    ...lines,
                    { timestamp: new Date(), text: `onDidLayoutChange` },
                ]);
            }),
            api.onDidLayoutFromJSON((panel) => {
                setLines((lines) => [
                    ...lines,
                    { timestamp: new Date(), text: `onDidLayoutFromJSON` },
                ]);
            }),
        ];

        return () => {
            disposables.forEach((disposable) => disposable.dispose());
        };
    }, [api]);

    React.useEffect(() => {
        if (!api) {
            return;
        }

        setLines((lines) => [
            ...lines,
            {
                timestamp: new Date(),
                text: `Rebuilding view fromJSON:${checked}`,
                css: { color: 'yellow', backgroundColor: 'grey' },
            },
        ]);

        if (checked) {
            api.fromJSON({
                grid: {
                    root: {
                        type: 'branch',
                        data: [
                            {
                                type: 'branch',
                                data: [
                                    {
                                        type: 'leaf',
                                        data: {
                                            id: 'panel_3',
                                            component: 'default',
                                            params: { title: 'Panel 3' },
                                            snap: false,
                                        },
                                        size: 394,
                                    },
                                    {
                                        type: 'branch',
                                        data: [
                                            {
                                                type: 'leaf',
                                                data: {
                                                    id: 'panel_5',
                                                    component: 'default',
                                                    params: {
                                                        title: 'Panel 5',
                                                    },
                                                    snap: false,
                                                },
                                                size: 50,
                                            },
                                            {
                                                type: 'branch',
                                                data: [
                                                    {
                                                        type: 'leaf',
                                                        data: {
                                                            id: 'panel_6',
                                                            component:
                                                                'default',
                                                            params: {
                                                                title: 'Panel 6',
                                                            },
                                                            minimumWidth: 10,
                                                            snap: false,
                                                        },
                                                        size: 131,
                                                    },
                                                    {
                                                        type: 'leaf',
                                                        data: {
                                                            id: 'panel_8',
                                                            component:
                                                                'default',
                                                            params: {
                                                                title: 'Panel 8',
                                                            },
                                                            minimumWidth: 10,
                                                            snap: false,
                                                        },
                                                        size: 131,
                                                    },
                                                    {
                                                        type: 'leaf',
                                                        data: {
                                                            id: 'panel_7',
                                                            component:
                                                                'default',
                                                            params: {
                                                                title: 'Panel 7',
                                                            },
                                                            minimumWidth: 10,
                                                            snap: false,
                                                        },
                                                        size: 132,
                                                    },
                                                ],
                                                size: 50,
                                            },
                                        ],
                                        size: 394,
                                    },
                                ],
                                size: 100,
                            },
                            {
                                type: 'leaf',
                                data: {
                                    id: 'panel_2',
                                    component: 'default',
                                    params: { title: 'Panel 2' },
                                    snap: false,
                                },
                                size: 100,
                            },
                            {
                                type: 'branch',
                                data: [
                                    {
                                        type: 'leaf',
                                        data: {
                                            id: 'panel_1',
                                            component: 'default',
                                            params: { title: 'Panel 1' },
                                            snap: false,
                                        },
                                        size: 394,
                                    },
                                    {
                                        type: 'leaf',
                                        data: {
                                            id: 'panel_4',
                                            component: 'default',
                                            params: { title: 'Panel 4' },
                                            snap: false,
                                        },
                                        size: 394,
                                    },
                                ],
                                size: 100,
                            },
                        ],
                        size: 788,
                    },
                    width: 788,
                    height: 300,
                    orientation: Orientation.VERTICAL,
                },
                activePanel: 'panel_8',
            });
            return;
        }

        api.clear();
        api.orientation = Orientation.VERTICAL;

        api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
        });

        api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
        });

        api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
        });

        console.log('sdf');

        api.addPanel({
            id: 'panel_4',
            component: 'default',
            params: {
                title: 'Panel 4',
            },
            position: { referencePanel: 'panel_1', direction: 'right' },
        });

        api.addPanel({
            id: 'panel_5',
            component: 'default',
            params: {
                title: 'Panel 5',
            },
            position: { referencePanel: 'panel_3', direction: 'right' },
        });

        api.addPanel({
            id: 'panel_6',
            component: 'default',
            params: {
                title: 'Panel 6',
            },
            position: { referencePanel: 'panel_5', direction: 'below' },
            minimumWidth: 10,
        });

        api.addPanel({
            id: 'panel_7',
            component: 'default',
            params: {
                title: 'Panel 7',
            },
            position: { referencePanel: 'panel_6', direction: 'right' },
            minimumWidth: 10,
        });

        api.addPanel({
            id: 'panel_8',
            component: 'default',
            params: {
                title: 'Panel 8',
            },
            position: { referencePanel: 'panel_6', direction: 'right' },
            minimumWidth: 10,
        });
    }, [api, checked]);

    const onReady = (event: GridviewReadyEvent) => {
        setApi(event.api);
    };

    return (
        <>
            <label>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                />
                <span>{'fromJSON'}</span>
            </label>
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
                    className="dockview-theme-abyss"
                />
            </div>

            <Console lines={lines} />
        </>
    );
};
