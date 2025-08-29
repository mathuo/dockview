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
import './DockviewDemo.scss';
import { defaultConfig } from './defaultLayout';
import { GridActions } from './gridActions';
import { PanelActions } from './panelActions';
import { GroupActions } from './groupActions';
import { LeftControls, PrefixHeaderControls, RightControls } from './controls';
import { Table, usePanelApiMetadata } from './debugPanel';
import { Button } from './Button';
import {
    ChakraProvider,
    createSystem,
    defaultConfig as chakraDefaultConfig,
} from '@chakra-ui/react';
import { useColorMode } from '@docusaurus/theme-common';

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
        const api = usePanelApiMetadata(props.api);

        const [count, setCount] = React.useState<number>(0);

        const isDebug = React.useContext(DebugContext);

        return (
            <div
                style={{
                    padding: '10px',
                    backgroundColor: 'transparent',
                    color: 'var(--dv-activegroup-visiblepanel-tab-color)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
            >
                {isDebug && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                        }}
                    >
                        <span>{props.api.title}</span>
                        <Button
                            onClick={() => setCount(count + 1)}
                            size="sm"
                            variant="secondary"
                        >
                            count: {count}
                        </Button>
                    </div>
                )}
                {isDebug && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            pointerEvents: 'none',
                            display: 'flex',
                        }}
                    >
                        <div
                            style={{
                                flexGrow: 1,
                                border: '2px dashed red',
                                position: 'relative',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: '2px',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    fontSize: '10px',
                                    padding: '2px 4px',
                                    borderRadius: '2px',
                                }}
                            >
                                {props.api.id}
                            </div>
                        </div>
                    </div>
                )}
                <div
                    style={{
                        flexGrow: 1,
                        minHeight: 0,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {isDebug ? (
                        <Table api={api} />
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: 'var(--dv-activegroup-visiblepanel-tab-color)',
                                fontSize: '14px',
                                textAlign: 'center',
                                padding: '20px',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        marginBottom: '10px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {props.api.title}
                                </div>
                                <div style={{ opacity: 0.7 }}>
                                    Click the engineering button to see debug
                                    info
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    },
    iframe: ShadowIframe,
    shadow: (props: IDockviewPanelProps) => {
        const ref = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
            if (!ref.current) {
                return () => {
                    //
                };
            }

            const element = ref.current;

            const shadow = element.attachShadow({ mode: 'open' });

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

    const addLogLine = (text: string, backgroundColor?: string) => {
        setLogLines((_) => [
            ..._,
            { text, timestamp: new Date(), backgroundColor },
        ]);
    };

    React.useEffect(() => {
        if (!api) {
            return () => {
                //
            };
        }

        const disposables = [
            api.onDidAddPanel((event) => {
                setPanels((_) => [..._, event.id]);
                addLogLine(`Panel Added ${event.id}`);
            }),

            api.onDidActiveGroupChange((event) => {
                setActiveGroup(event?.id);
                addLogLine(`Group Activated ${event?.id}`);
            }),

            api.onDidActivePanelChange((event) => {
                setActivePanel(event?.id);
                addLogLine(
                    `Panel Activated ${event?.id}`,
                    colors[count++ % colors.length]
                );
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
                <Button
                    onClick={() => {
                        setDebug(!debug);
                    }}
                    variant={debug ? 'primary' : 'secondary'}
                    size="sm"
                >
                    <span className="material-symbols-outlined">
                        engineering
                    </span>
                </Button>
                {showLogs && (
                    <Button
                        onClick={() => {
                            setLogLines([]);
                        }}
                        variant="ghost"
                        size="sm"
                    >
                        <span className="material-symbols-outlined">undo</span>
                    </Button>
                )}
                <Button
                    onClick={() => {
                        setShowLogs(!showLogs);
                    }}
                    variant={showLogs ? 'primary' : 'secondary'}
                    size="sm"
                >
                    <span style={{ paddingRight: '4px' }}>
                        {`${showLogs ? 'Hide' : 'Show'} Events Log`}
                    </span>
                    <span className="material-symbols-outlined">terminal</span>
                </Button>
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
                            <Button
                                onClick={() => setLogLines([])}
                                variant="secondary"
                                size="sm"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DockviewDemoWithChakra = (props: { theme?: DockviewTheme }) => {
    const { colorMode } = useColorMode();

    const system = React.useMemo(
        () =>
            createSystem(chakraDefaultConfig, {
                theme: {
                    tokens: {
                        colors: {
                            colorPalette: {
                                fg: {
                                    value:
                                        colorMode === 'dark'
                                            ? 'white'
                                            : 'black',
                                },
                                solid: {
                                    value:
                                        colorMode === 'dark'
                                            ? 'white'
                                            : 'black',
                                },
                            },
                        },
                    },
                    recipes: {
                        button: {
                            variants: {
                                variant: {
                                    outline: {
                                        bg: 'transparent',
                                        border: '1px solid gray',
                                        borderColor:
                                            colorMode === 'dark'
                                                ? 'gray.700'
                                                : 'gray.200',
                                        color:
                                            colorMode === 'dark'
                                                ? 'white'
                                                : 'black',
                                        borderRadius: 'md',
                                        transition: 'all 0.25s ease-in-out',
                                        px: '8px',
                                        py: '2px',
                                        height: '28px',
                                        mr: '4px',
                                        _hover: {
                                            bg:
                                                colorMode === 'dark'
                                                    ? 'whiteAlpha.100'
                                                    : 'blackAlpha.100',
                                            borderColor:
                                                colorMode === 'dark'
                                                    ? 'gray.600'
                                                    : 'gray.300',
                                            color:
                                                colorMode === 'dark'
                                                    ? 'white'
                                                    : 'black',
                                        },
                                        _focus: {
                                            boxShadow: 'outline',
                                            bg: 'transparent',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
        [colorMode]
    );

    return (
        <ChakraProvider value={system}>
            <DockviewDemo {...props} />
        </ChakraProvider>
    );
};

export default DockviewDemoWithChakra;
