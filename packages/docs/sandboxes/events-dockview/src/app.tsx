import {
    Orientation,
    DockviewReact,
    DockviewReadyEvent,
    DockviewApi,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';
import { Console, Line } from './console';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
};

const EventsDockview = (props: { theme?: string }) => {
    const [lines, setLines] = React.useState<Line[]>([]);
    const [checked, setChecked] = React.useState<boolean>(false);

    const [api, setApi] = React.useState<DockviewApi | undefined>();

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
            api.onDidAddGroup((panel) => {
                setLines((lines) => [
                    ...lines,
                    {
                        timestamp: new Date(),
                        text: `onDidAddGroup: ${panel.id}`,
                    },
                ]);
            }),
            api.onDidRemoveGroup((panel) => {
                setLines((lines) => [
                    ...lines,
                    {
                        timestamp: new Date(),
                        text: `onDidRemoveGroup: ${panel.id}`,
                    },
                ]);
            }),
            api.onDidActiveGroupChange((panel) => {
                setLines((lines) => [
                    ...lines,
                    {
                        timestamp: new Date(),
                        text: `onDidActiveGroupChange: ${panel?.id}`,
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
                                type: 'leaf',
                                data: {
                                    views: ['panel_1', 'panel_2', 'panel_3'],
                                    activeView: 'panel_3',
                                    id: '77',
                                },
                                size: 262,
                            },
                            {
                                type: 'branch',
                                data: [
                                    {
                                        type: 'leaf',
                                        data: {
                                            views: ['panel_5'],
                                            activeView: 'panel_5',
                                            id: '79',
                                        },
                                        size: 100,
                                    },
                                    {
                                        type: 'leaf',
                                        data: {
                                            views: ['panel_6', 'panel_8'],
                                            activeView: 'panel_8',
                                            id: '80',
                                        },
                                        size: 100,
                                    },
                                    {
                                        type: 'leaf',
                                        data: {
                                            views: ['panel_7'],
                                            activeView: 'panel_7',
                                            id: '81',
                                        },
                                        size: 100,
                                    },
                                ],
                                size: 262,
                            },
                            {
                                type: 'leaf',
                                data: {
                                    views: ['panel_4'],
                                    activeView: 'panel_4',
                                    id: '78',
                                },
                                size: 263.75,
                            },
                        ],
                        size: 300,
                    },
                    width: 787.75,
                    height: 300,
                    orientation: Orientation.HORIZONTAL,
                },
                panels: {
                    panel_1: {
                        id: 'panel_1',
                        contentComponent: 'default',
                        params: { title: 'Panel 1' },
                        title: 'panel_1',
                    },
                    panel_2: {
                        id: 'panel_2',
                        contentComponent: 'default',
                        params: { title: 'Panel 2' },
                        title: 'panel_2',
                    },
                    panel_3: {
                        id: 'panel_3',
                        contentComponent: 'default',
                        params: { title: 'Panel 3' },
                        title: 'panel_3',
                    },
                    panel_4: {
                        id: 'panel_4',
                        contentComponent: 'default',
                        params: { title: 'Panel 4' },
                        title: 'panel_4',
                    },
                    panel_5: {
                        id: 'panel_5',
                        contentComponent: 'default',
                        params: { title: 'Panel 5' },
                        title: 'panel_5',
                    },
                    panel_6: {
                        id: 'panel_6',
                        contentComponent: 'default',
                        params: { title: 'Panel 6' },
                        title: 'panel_6',
                    },
                    panel_8: {
                        id: 'panel_8',
                        contentComponent: 'default',
                        params: { title: 'Panel 8' },
                        title: 'panel_8',
                    },
                    panel_7: {
                        id: 'panel_7',
                        contentComponent: 'default',
                        params: { title: 'Panel 7' },
                        title: 'panel_7',
                    },
                },
                activeGroup: '80',
            });
            return;
        }

        api.clear();

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
        });

        api.addPanel({
            id: 'panel_7',
            component: 'default',
            params: {
                title: 'Panel 7',
            },
            position: { referencePanel: 'panel_6', direction: 'below' },
        });

        api.addPanel({
            id: 'panel_8',
            component: 'default',
            params: {
                title: 'Panel 8',
            },
            position: { referencePanel: 'panel_6', direction: 'within' },
        });
    }, [api, checked]);

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            <label>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                />
                <span>{'fromJSON'}</span>
            </label>
            <div style={{ flexGrow: 1 }}>
                <DockviewReact
                    components={components}
                    onReady={onReady}
                    className={`${props.theme || 'dockview-theme-abyss'}`}
                />
            </div>
            <div style={{ flexGrow: 1, paddingTop: '5px' }}>
                <Console lines={lines} />
            </div>
        </div>
    );
};

export default EventsDockview;
