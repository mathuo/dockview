import {
    DockviewDefaultTab,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    IDockviewHeaderActionsProps,
    DockviewPanelApi,
    DockviewPanelRenderer,
    DockviewGroupLocation,
    DockviewApi,
} from 'dockview';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { v4 } from 'uuid';
import './app.scss';

interface PanelApiMetadata {
    isActive: {
        value: boolean;
        count: number;
    };
    isVisible: {
        value: boolean;
        count: number;
    };
    isHidden: {
        value: boolean;
        count: number;
    };
    renderer: {
        value: DockviewPanelRenderer;
        count: number;
    };
    isGroupActive: {
        value: boolean;
        count: number;
    };
    groupChanged: {
        count: number;
    };
    location: {
        value: DockviewGroupLocation;
        count: number;
    };
    didFocus: {
        count: number;
    };
    dimensions: {
        count: number;
        height: number;
        width: number;
    };
}

function usePanelApiMetadata(api: DockviewPanelApi): PanelApiMetadata {
    const [state, setState] = React.useState<PanelApiMetadata>({
        isActive: { value: api.isActive, count: 0 },
        isVisible: { value: api.isVisible, count: 0 },
        isHidden: { value: api.isHidden, count: 0 },
        renderer: { value: api.renderer, count: 0 },
        isGroupActive: { value: api.isGroupActive, count: 0 },
        groupChanged: { count: 0 },
        location: { value: api.location, count: 0 },
        didFocus: { count: 0 },
        dimensions: { count: 0, height: api.height, width: api.width },
    });

    React.useEffect(() => {
        const d1 = api.onDidActiveChange((event) => {
            setState((_) => ({
                ..._,
                isActive: {
                    value: event.isActive,
                    count: _.isActive.count + 1,
                },
            }));
        });
        const d2 = api.onDidActiveGroupChange((event) => {
            setState((_) => ({
                ..._,
                isGroupActive: {
                    value: event.isActive,
                    count: _.isGroupActive.count + 1,
                },
            }));
        });
        const d3 = api.onDidDimensionsChange((event) => {
            setState((_) => ({
                ..._,
                dimensions: {
                    count: _.dimensions.count + 1,
                    height: event.height,
                    width: event.width,
                },
            }));
        });
        const d4 = api.onDidFocusChange((event) => {
            setState((_) => ({
                ..._,
                didFocus: {
                    count: _.didFocus.count + 1,
                },
            }));
        });
        const d5 = api.onDidGroupChange((event) => {
            setState((_) => ({
                ..._,
                groupChanged: {
                    count: _.groupChanged.count + 1,
                },
            }));
        });
        const d6 = api.onDidHiddenChange((event) => {
            setState((_) => ({
                ..._,
                isHidden: {
                    value: event.isHidden,
                    count: _.isHidden.count + 1,
                },
            }));
        });
        const d7 = api.onDidLocationChange((event) => {
            setState((_) => ({
                ..._,
                location: {
                    value: event.location,
                    count: _.location.count + 1,
                },
            }));
        });
        const d8 = api.onDidRendererChange((event) => {
            setState((_) => ({
                ..._,
                renderer: {
                    value: event.renderer,
                    count: _.renderer.count + 1,
                },
            }));
        });
        const d9 = api.onDidVisibilityChange((event) => {
            setState((_) => ({
                ..._,
                isVisible: {
                    value: event.isVisible,
                    count: _.isVisible.count + 1,
                },
            }));
        });

        return () => {
            d1.dispose();
            d2.dispose();
            d3.dispose();
            d4.dispose();
            d5.dispose();
            d6.dispose();
            d7.dispose();
            d8.dispose();
            d9.dispose();
        };
    }, [api]);

    return state;
}

const components = {
    default: (props: IDockviewPanelProps) => {
        const metadata = usePanelApiMetadata(props.api);

        return (
            <div
                style={{
                    height: '100%',
                    overflow: 'auto',
                    color: 'white',
                    position: 'relative',
                }}
            >
                <pre style={{ fontSize: '11px' }}>
                    {JSON.stringify(metadata, null, 4)}
                </pre>
                <span
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%,-50%)',
                        pointerEvents: 'none',
                        fontSize: '42px',
                        opacity: 0.5,
                    }}
                >
                    {props.api.title}
                </span>
            </div>
        );
    },
    iframe: () => {
        return (
            <iframe
                style={{
                    width: '100%',
                    height: '100%',
                }}
                src="https://dockview.dev"
            />
        );
    },
};

const headerComponents = {
    default: (props: IDockviewPanelHeaderProps) => {
        const onContextMenu = (event: React.MouseEvent) => {
            event.preventDefault();
            alert('context menu');
        };
        return <DockviewDefaultTab onContextMenu={onContextMenu} {...props} />;
    },
};

const Icon = (props: {
    icon: string;
    title?: string;
    onClick?: (event: React.MouseEvent) => void;
}) => {
    return (
        <div title={props.title} className="action" onClick={props.onClick}>
            <span
                style={{ fontSize: 'inherit' }}
                className="material-symbols-outlined"
            >
                {props.icon}
            </span>
        </div>
    );
};

const groupControlsComponents: Record<string, React.FC> = {
    panel_1: () => {
        return <Icon icon="file_download" />;
    },
};

const RightControls = (props: IDockviewHeaderActionsProps) => {
    const Component = React.useMemo(() => {
        if (!props.isGroupActive || !props.activePanel) {
            return null;
        }

        return groupControlsComponents[props.activePanel.id];
    }, [props.isGroupActive, props.activePanel]);

    const [isMaximized, setIsMaximized] = React.useState<boolean>(
        props.containerApi.hasMaximizedGroup()
    );

    const [isPopout, setIsPopout] = React.useState<boolean>(
        props.api.location.type === 'popout'
    );

    React.useEffect(() => {
        const disposable = props.containerApi.onDidMaximizedGroupChange(() => {
            setIsMaximized(props.containerApi.hasMaximizedGroup());
        });

        const disposable2 = props.api.onDidLocationChange(() => {
            setIsPopout(props.api.location.type === 'popout');
        });

        return () => {
            disposable.dispose();
            disposable2.dispose();
        };
    }, [props.containerApi]);

    const onClick = () => {
        if (props.containerApi.hasMaximizedGroup()) {
            props.containerApi.exitMaximizedGroup();
        } else {
            props.activePanel?.api.maximize();
        }
    };

    const onClick2 = () => {
        if (props.api.location.type !== 'popout') {
            props.containerApi.addPopoutGroup(props.group);
        } else {
            props.api.moveTo({ position: 'right' });
        }
    };

    return (
        <div
            className="group-control"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0px 8px',
                height: '100%',
                color: 'var(--dv-activegroup-visiblepanel-tab-color)',
            }}
        >
            {props.isGroupActive && <Icon icon="star" />}
            {Component && <Component />}
            <Icon
                title={isPopout ? 'Close Window' : 'Open In New Window'}
                icon={isPopout ? 'close_fullscreen' : 'open_in_new'}
                onClick={onClick2}
            />
            {!isPopout && (
                <Icon
                    title={isMaximized ? 'Minimize View' : 'Maximize View'}
                    icon={isMaximized ? 'collapse_content' : 'expand_content'}
                    onClick={onClick}
                />
            )}
        </div>
    );
};

let counter = 0;

const LeftControls = (props: IDockviewHeaderActionsProps) => {
    const onClick = () => {
        props.containerApi.addPanel({
            id: `id_${Date.now().toString()}`,
            component: 'default',
            title: `Tab ${counter++}`,
            position: {
                referenceGroup: props.group,
            },
        });
    };

    return (
        <div
            className="group-control"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0px 8px',
                height: '100%',
                color: 'var(--dv-activegroup-visiblepanel-tab-color)',
            }}
        >
            <Icon onClick={onClick} icon="add" />
        </div>
    );
};

const PrefixHeaderControls = (props: IDockviewHeaderActionsProps) => {
    return (
        <div
            className="group-control"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0px 8px',
                height: '100%',
                color: 'var(--dv-activegroup-visiblepanel-tab-color)',
            }}
        >
            <Icon icon="Menu" />
        </div>
    );
};

function defaultConfig(api: DockviewApi) {
    const panel1 = api.addPanel({
        id: 'panel_1',
        component: 'iframe',
        renderer: 'always',
        title: 'Panel 1',
    });

    api.addPanel({
        id: 'panel_2',
        component: 'default',
        title: 'Panel 2',
        position: { referencePanel: panel1 },
    });

    api.addPanel({
        id: 'panel_3',
        component: 'default',
        title: 'Panel 3',
        position: { referencePanel: panel1 },
    });

    const panel4 = api.addPanel({
        id: 'panel_4',
        component: 'default',
        title: 'Panel 4',
        position: { referencePanel: panel1, direction: 'right' },
    });

    const panel5 = api.addPanel({
        id: 'panel_5',
        component: 'default',
        title: 'Panel 5',
        position: { referencePanel: panel4 },
    });

    const panel6 = api.addPanel({
        id: 'panel_6',
        component: 'default',
        title: 'Panel 6',
        position: { referencePanel: panel5, direction: 'below' },
    });

    const panel7 = api.addPanel({
        id: 'panel_7',
        component: 'default',
        title: 'Panel 7',
        position: { referencePanel: panel6, direction: 'left' },
    });

    api.addPanel({
        id: 'panel8',
        component: 'default',
        title: 'Panel 8',
        position: { referencePanel: panel7, direction: 'below' },
    });

    panel1.api.setActive();
}

const DockviewDemo = (props: { theme?: string }) => {
    const [logLines, setLogLines] = React.useState<any[]>([]);

    const [panels, setPanels] = React.useState<string[]>([]);
    const [groups, setGroups] = React.useState<string[]>([]);
    const [api, setApi] = React.useState<DockviewApi>();

    const [activePanel, setActivePanel] = React.useState<string>();
    const [activeGroup, setActiveGroup] = React.useState<string>();

    const onClear = () => {
        api?.clear();
    };

    const onLoad = () => {
        const state = localStorage.getItem('dv-demo-state');
        if (state) {
            try {
                api?.fromJSON(JSON.parse(state));
            } catch {
                localStorage.removeItem('dv-demo-state');
            }
        }
    };

    const onSave = () => {
        if (api) {
            localStorage.setItem('dv-demo-state', JSON.stringify(api.toJSON()));
        }
    };

    const onReset = () => {
        if (api) {
            api.clear();
            defaultConfig(api);
        }
    };

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);

        event.api.onDidAddPanel((event) => {
            setPanels((_) => [..._, event.id]);
            setLogLines((line) => [`Panel Added ${event.id}`, ...line]);
        });
        event.api.onDidActivePanelChange((event) => {
            setActivePanel(event?.id);
            setLogLines((line) => [`Panel Activated ${event?.id}`, ...line]);
        });
        event.api.onDidRemovePanel((event) => {
            setPanels((_) => {
                const next = [..._];
                next.splice(
                    next.findIndex((x) => x === event.id),
                    1
                );

                return next;
            });
            setLogLines((line) => [`Panel Removed ${event.id}`, ...line]);
        });

        event.api.onDidAddGroup((event) => {
            setGroups((_) => [..._, event.id]);
            setLogLines((line) => [`Group Added ${event.id}`, ...line]);
        });

        event.api.onDidRemoveGroup((event) => {
            setGroups((_) => {
                const next = [..._];
                next.splice(
                    next.findIndex((x) => x === event.id),
                    1
                );

                return next;
            });
            setLogLines((line) => [`Group Removed ${event.id}`, ...line]);
        });

        event.api.onDidActiveGroupChange((event) => {
            setActiveGroup(event?.id);
            setLogLines((line) => [`Group Activated ${event?.id}`, ...line]);
        });

        const state = localStorage.getItem('dv-demo-state');
        if (state) {
            try {
                api?.fromJSON(JSON.parse(state));
                return;
            } catch {
                localStorage.removeItem('dv-demo-state');
            }
        }

        defaultConfig(event.api);
    };

    const onAddPanel = () => {
        api?.addPanel({
            id: `id_${Date.now().toString()}`,
            component: 'default',
            title: `Tab ${counter++}`,
        });
    };

    const onAddGroup = () => {
        api?.addGroup();
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
            }}
        >
            <div>
                <div
                    style={{
                        display: 'flex',
                        height: '25px',
                        padding: '2px 0px',
                    }}
                >
                    <button onClick={onAddPanel}>Add Panel</button>
                    <button onClick={onAddGroup}>Add Group</button>
                    <button onClick={onClear}>Clear</button>
                    <button onClick={onLoad}>Load</button>
                    <button onClick={onSave}>Save</button>
                    <button onClick={onReset}>Reset</button>
                </div>
                <div
                    style={{
                        display: 'flex',
                        height: '25px',
                        padding: '2px 0px',
                    }}
                >
                    {panels.map((x) => {
                        const onClick = () => {
                            api?.getPanel(x)?.focus();
                        };
                        return (
                            <>
                                <button
                                    onClick={onClick}
                                    style={{
                                        minWidth: '50px',
                                        border: 'none',
                                        margin: '0px 2px',
                                        padding: '0px 2px',
                                        backgroundColor:
                                            activePanel === x
                                                ? 'blueviolet'
                                                : 'dodgerblue',
                                        borderRadius: '2px',
                                    }}
                                >
                                    {x}
                                </button>
                                <button
                                    onClick={() => {
                                        const panel = api?.getPanel(x);
                                        if (panel) {
                                            api?.addFloatingGroup(panel);
                                        }
                                    }}
                                >
                                    float
                                </button>
                                <button
                                    onClick={() => {
                                        const panel = api?.getPanel(x);
                                        if (panel) {
                                            api?.addPopoutGroup(panel);
                                        }
                                    }}
                                >
                                    pop
                                </button>
                            </>
                        );
                    })}
                </div>
                <div
                    style={{
                        display: 'flex',
                        height: '25px',
                        padding: '2px 0px',
                    }}
                >
                    {groups.map((x) => {
                        const onClick = () => {
                            api?.getGroup(x)?.focus();
                        };
                        return (
                            <>
                                <button
                                    onClick={onClick}
                                    style={{
                                        minWidth: '50px',
                                        border: 'none',
                                        margin: '0px 2px',
                                        padding: '0px 2px',
                                        backgroundColor:
                                            activeGroup === x
                                                ? 'blueviolet'
                                                : 'dodgerblue',
                                        borderRadius: '2px',
                                    }}
                                >
                                    {x}
                                </button>
                                <button
                                    onClick={() => {
                                        const panel = api?.getGroup(x);
                                        if (panel) {
                                            api?.addFloatingGroup(panel);
                                        }
                                    }}
                                >
                                    float
                                </button>
                                <button
                                    onClick={() => {
                                        const panel = api?.getGroup(x);
                                        if (panel) {
                                            api?.addPopoutGroup(panel);
                                        }
                                    }}
                                >
                                    pop
                                </button>
                                <button
                                    onClick={() => {
                                        const panel = api?.getGroup(x);
                                        if (panel?.api.isMaximized()) {
                                            panel.api.exitMaximized();
                                        } else {
                                            panel?.api.maximize();
                                        }
                                    }}
                                >
                                    max
                                </button>
                            </>
                        );
                    })}
                </div>
            </div>
            <div
                style={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    // flexBasis: 0
                    height: 0,
                }}
            >
                <DockviewReact
                    components={components}
                    defaultTabComponent={headerComponents.default}
                    rightHeaderActionsComponent={RightControls}
                    leftHeaderActionsComponent={LeftControls}
                    prefixHeaderActionsComponent={PrefixHeaderControls}
                    onReady={onReady}
                    className={props.theme || 'dockview-theme-abyss'}
                />
            </div>
            <div
                style={{
                    height: '200px',
                    backgroundColor: 'black',
                    color: 'white',
                    overflow: 'auto',
                }}
            >
                {logLines.map((line, i) => {
                    return (
                        <div key={i}>
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: '30px',
                                    color: 'gray',
                                    borderRight: '1px solid gray',
                                    marginRight: '4px',
                                }}
                            >
                                {logLines.length - i}
                            </span>
                            <span>{line}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DockviewDemo;
