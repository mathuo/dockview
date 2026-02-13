import {
    DockviewDefaultTab,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    DockviewApi,
    DockviewTheme,
} from 'dockview';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './app.scss';
import { defaultConfig } from './defaultLayout';
import { GridActions } from './gridActions';
import { PanelActions } from './panelActions';
import { GroupActions } from './groupActions';
import { LeftControls, PrefixHeaderControls, RightControls } from './controls';
import { Table, usePanelApiMetadata } from './debugPanel';

const DebugContext = React.createContext<boolean>(false);

const Option = (props: {
    title: string;
    onClick: () => void;
    value: string;
}) => {
    return (
        <div>
            <span>{`${props.title}: `}</span>
            <button onClick={props.onClick}>{props.value}</button>
        </div>
    );
};

const ShadowIframe = (props: IDockviewPanelProps) => {
    return (
        <iframe
            onMouseDown={() => {
                if (!props.api.isActive) {
                    props.api.setActive();
                }
            }}
            style={{ border: 'none', width: '100%', height: '100%' }}
            src="https://dockview.dev"
        />
    );
};

const components = {
    default: (props: IDockviewPanelProps) => {
        const isDebug = React.useContext(DebugContext);
        const metadata = usePanelApiMetadata(props.api);

        const [firstRender, setFirstRender] = React.useState<string>('');

        React.useEffect(() => {
            setFirstRender(new Date().toISOString());
        }, []);

        return (
            <div
                style={{
                    height: '100%',
                    overflow: 'auto',
                    position: 'relative',
                    padding: 5,
                    border: isDebug ? '2px dashed orange' : '',
                }}
            >
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

                <div>{firstRender}</div>

                {isDebug && (
                    <div style={{ fontSize: '0.8em' }}>
                        <Option
                            title="Panel Rendering Mode"
                            value={metadata.renderer.value}
                            onClick={() =>
                                props.api.setRenderer(
                                    props.api.renderer === 'always'
                                        ? 'onlyWhenVisible'
                                        : 'always'
                                )
                            }
                        />

                        <Table data={metadata} />
                    </div>
                )}
            </div>
        );
    },
    nested: (props: IDockviewPanelProps) => {
        const theme = React.useContext(ThemeContext);
        return (
            <DockviewReact
                components={components}
                onReady={(event: DockviewReadyEvent) => {
                    event.api.addPanel({ id: 'panel_1', component: 'default' });
                    event.api.addPanel({ id: 'panel_2', component: 'default' });
                    event.api.addPanel({
                        id: 'panel_3',
                        component: 'default',
                    });

                    event.api.onDidRemovePanel((e) => {
                        console.log('remove', e);
                    });
                }}
                theme={theme}
            />
        );
    },
    iframe: (props: IDockviewPanelProps) => {
        return (
            <iframe
                onMouseDown={() => {
                    if (!props.api.isActive) {
                        props.api.setActive();
                    }
                }}
                style={{
                    border: 'none',
                    width: '100%',
                    height: '100%',
                }}
                src="https://dockview.dev"
            />
        );
    },
    shadowDom: (props: IDockviewPanelProps) => {
        const ref = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
            if (!ref.current) {
                return;
            }

            const shadow = ref.current.attachShadow({
                mode: 'open',
            });

            const shadowRoot = document.createElement('div');
            shadowRoot.style.height = '100%';
            shadow.appendChild(shadowRoot);

            const root = ReactDOM.createRoot(shadowRoot);

            root.render(<ShadowIframe {...props} />);

            return () => {
                root.unmount();
            };
        }, []);

        return <div style={{ height: '100%' }} ref={ref}></div>;
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

const colors = [
    'rgba(255,0,0,0.2)',
    'rgba(0,255,0,0.2)',
    'rgba(0,0,255,0.2)',
    'rgba(255,255,0,0.2)',
    'rgba(0,255,255,0.2)',
    'rgba(255,0,255,0.2)',
];
let count = 0;

const WatermarkComponent = () => {
    return <div>custom watermark</div>;
};

const ThemeContext = React.createContext<DockviewTheme | undefined>(undefined);

const DockviewDemo = (props: { theme?: DockviewTheme }) => {
    const [logLines, setLogLines] = React.useState<
        { text: string; timestamp?: Date; backgroundColor?: string }[]
    >([]);

    const [panels, setPanels] = React.useState<string[]>([]);
    const [groups, setGroups] = React.useState<string[]>([]);
    const [api, setApi] = React.useState<DockviewApi>();

    const [activePanel, setActivePanel] = React.useState<string>();
    const [activeGroup, setActiveGroup] = React.useState<string>();

    const [pending, setPending] = React.useState<
        { text: string; timestamp?: Date }[]
    >([]);

    const addLogLine = (message: string) => {
        setPending((line) => [
            { text: message, timestamp: new Date() },
            ...line,
        ]);
    };

    React.useLayoutEffect(() => {
        if (pending.length === 0) {
            return;
        }
        const color = colors[count++ % colors.length];
        setLogLines((lines) => [
            ...pending.map((_) => ({ ..._, backgroundColor: color })),
            ...lines,
        ]);
        setPending([]);
    }, [pending]);

    React.useEffect(() => {
        if (!api) {
            return;
        }

        const disposables = [
            api.onDidAddPanel((event) => {
                setPanels((_) => [..._, event.id]);
                addLogLine(`Panel Added ${event.id}`);
            }),
            api.onDidActivePanelChange((event) => {
                setActivePanel(event?.id);
                addLogLine(`Panel Activated ${event?.id}`);
            }),
            api.onDidRemovePanel((event) => {
                setPanels((_) => {
                    const next = [..._];
                    next.splice(
                        next.findIndex((x) => x === event.id),
                        1
                    );

                    return next;
                });
                addLogLine(`Panel Removed ${event.id}`);
            }),

            api.onDidAddGroup((event) => {
                setGroups((_) => [..._, event.id]);
                addLogLine(`Group Added ${event.id}`);
            }),

            api.onDidMovePanel((event) => {
                addLogLine(`Panel Moved ${event.panel.id}`);
            }),

            api.onDidMaximizedGroupChange((event) => {
                addLogLine(
                    `Group Maximized Changed ${event.group.api.id} [${event.isMaximized}]`
                );
            }),

            api.onDidRemoveGroup((event) => {
                setGroups((_) => {
                    const next = [..._];
                    next.splice(
                        next.findIndex((x) => x === event.id),
                        1
                    );

                    return next;
                });
                addLogLine(`Group Removed ${event.id}`);
            }),

            api.onDidActiveGroupChange((event) => {
                setActiveGroup(event?.id);
                addLogLine(`Group Activated ${event?.id}`);
            }),
        ];

        const loadLayout = () => {
            const state = localStorage.getItem('dv-demo-state');

            if (state) {
                try {
                    api.fromJSON(JSON.parse(state));
                    return;
                } catch {
                    localStorage.removeItem('dv-demo-state');
                }
                return;
            }

            defaultConfig(api);
        };

        loadLayout();

        return () => {
            disposables.forEach((disposable) => disposable.dispose());
        };
    }, [api]);

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);
    };

    const [watermark, setWatermark] = React.useState<boolean>(false);

    const [gapCheck, setGapCheck] = React.useState<boolean>(false);

    const css = React.useMemo(() => {
        if (!gapCheck) {
            return {};
        }

        return {
            '--dv-group-gap-size': '0.5rem',
            '--demo-border': '5px dashed purple',
        } as React.CSSProperties;
    }, [gapCheck]);

    const [showLogs, setShowLogs] = React.useState<boolean>(false);
    const [debug, setDebug] = React.useState<boolean>(false);

    return (
        <div
            className="dockview-demo"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                padding: '8px',
                backgroundColor: 'rgba(0,0,50,0.25)',
                borderRadius: '8px',
                position: 'relative',
                ...css,
            }}
        >
            <div>
                <GridActions
                    api={api}
                    toggleCustomWatermark={() => setWatermark(!watermark)}
                    hasCustomWatermark={watermark}
                />
                {api && (
                    <PanelActions
                        api={api}
                        panels={panels}
                        activePanel={activePanel}
                    />
                )}
                {api && (
                    <GroupActions
                        api={api}
                        groups={groups}
                        activeGroup={activeGroup}
                    />
                )}
                {/* <div>
                    <button
                        onClick={() => {
                            setGapCheck(!gapCheck);
                        }}
                    >
                        {gapCheck ? 'Disable Gap Check' : 'Enable Gap Check'}
                    </button>
                </div> */}
            </div>
            <div
                className="action-container"
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    padding: '4px',
                }}
            >
                <button
                    onClick={() => {
                        setDebug(!debug);
                    }}
                >
                    <span className="material-symbols-outlined">
                        engineering
                    </span>
                </button>
                {showLogs && (
                    <button
                        onClick={() => {
                            setLogLines([]);
                        }}
                    >
                        <span className="material-symbols-outlined">undo</span>
                    </button>
                )}
                <button
                    onClick={() => {
                        setShowLogs(!showLogs);
                    }}
                >
                    <span style={{ paddingRight: '4px' }}>
                        {`${showLogs ? 'Hide' : 'Show'} Events Log`}
                    </span>
                    <span className="material-symbols-outlined">terminal</span>
                </button>
            </div>
            <div
                style={{
                    flexGrow: 1,
                    height: 0,
                    display: 'flex',
                }}
            >
                <div
                    style={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        display: 'flex',
                    }}
                >
                    <DebugContext.Provider value={debug}>
                        <ThemeContext.Provider value={props.theme}>
                            <DockviewReact
                                components={components}
                                defaultTabComponent={headerComponents.default}
                                rightHeaderActionsComponent={RightControls}
                                leftHeaderActionsComponent={LeftControls}
                                prefixHeaderActionsComponent={
                                    PrefixHeaderControls
                                }
                                watermarkComponent={
                                    watermark ? WatermarkComponent : undefined
                                }
                                onReady={onReady}
                                theme={props.theme}
                            />
                        </ThemeContext.Provider>
                    </DebugContext.Provider>
                </div>

                {showLogs && (
                    <div
                        style={{
                            width: '400px',
                            backgroundColor: 'black',
                            color: 'white',
                            overflow: 'hidden',
                            fontFamily: 'monospace',
                            marginLeft: '10px',
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ flexGrow: 1, overflow: 'auto' }}>
                            {logLines.map((line, i) => {
                                return (
                                    <div
                                        style={{
                                            height: '30px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',

                                            backgroundColor:
                                                line.backgroundColor,
                                        }}
                                        key={i}
                                    >
                                        <span
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                minWidth: '20px',
                                                maxWidth: '20px',
                                                color: 'gray',
                                                borderRight: '1px solid gray',
                                                marginRight: '4px',
                                                paddingLeft: '4px',
                                                height: '100%',
                                            }}
                                        >
                                            {logLines.length - i}
                                        </span>
                                        <span>
                                            {line.timestamp && (
                                                <span
                                                    style={{
                                                        fontSize: '0.7em',
                                                        padding: '0px 2px',
                                                    }}
                                                >
                                                    {line.timestamp
                                                        .toISOString()
                                                        .substring(11, 23)}
                                                </span>
                                            )}
                                            <span>{line.text}</span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div
                            style={{
                                padding: '4px',
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <button onClick={() => setLogLines([])}>
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DockviewDemo;
