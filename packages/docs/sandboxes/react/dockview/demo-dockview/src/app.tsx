import {
    DockviewDefaultTab,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    DockviewApi,
    DockviewTheme,
    themeAbyss,
    IContextMenuItemComponentProps,
    GetTabContextMenuItemsParams,
    TAB_GROUP_COLORS,
    TabGroupColor,
} from 'dockview';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './app.scss';
import { defaultConfig } from './defaultLayout';
import { LeftControls, PrefixHeaderControls, RightControls } from './controls';
import { Table, usePanelApiMetadata } from './debugPanel';
import { SettingsModal } from './settingsModal';
import { OrdersPanel } from './ordersPanel';
import { OrderBookPanel } from './orderBookPanel';
import { EventLogPanel } from './eventLogPanel';
import { LayoutInspectorPanel } from './layoutInspectorPanel';
import { PanelDebugPanel } from './panelDebugPanel';
import { MarketProvider } from './marketContext';
import { WatchlistPanel } from './watchlistPanel';
import { PriceAlertPanel } from './priceAlertPanel';
import { PositionSummaryPanel } from './positionSummaryPanel';
import { PanelColorsContext, DARK_COLORS, LIGHT_COLORS } from './panelTheme';
import {
    ThemeBuilderState,
    ThemeCssOverrides,
    buildEffectiveTheme,
    getInitialStateFromTheme,
} from './themeBuilder';
import { ThemeBuilderModal } from './themeBuilderModal';

export const ApiContext = React.createContext<DockviewApi | undefined>(
    undefined
);

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
    vesselfinder: (props: IDockviewPanelProps) => {
        const srcdoc = `<!DOCTYPE html>
<html><head><style>html,body{margin:0;padding:0;height:100%;overflow:hidden;}</style></head>
<body>
<script>var width="100%";var height="100%";var latitude="51.5";var longitude="-0.12";var zoom="8";var names=false;</script>
<script src="https://www.vesselfinder.com/aismap.js"></script>
</body></html>`;
        return (
            <iframe
                onMouseDown={() => {
                    if (!props.api.isActive) {
                        props.api.setActive();
                    }
                }}
                srcDoc={srcdoc}
                style={{
                    border: 'none',
                    width: '100%',
                    height: '100%',
                }}
            />
        );
    },
    debuginfo: (props: IDockviewPanelProps) => <PanelDebugPanel {...props} />,
    orders: () => <OrdersPanel />,
    orderbook: () => <OrderBookPanel />,
    watchlist: () => <WatchlistPanel />,
    pricealert: () => <PriceAlertPanel />,
    positionsummary: () => <PositionSummaryPanel />,
    eventlog: () => {
        const api = React.useContext(ApiContext);
        if (!api) return null;
        return <EventLogPanel api={api} />;
    },
    layoutinspector: () => {
        const api = React.useContext(ApiContext);
        if (!api) return null;
        return <LayoutInspectorPanel api={api} />;
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
        return <DockviewDefaultTab {...props} />;
    },
};

const FloatMenuItem = ({
    panel,
    api,
    close,
}: IContextMenuItemComponentProps) => {
    return (
        <div
            className="dv-context-menu-item"
            onClick={() => {
                api.addFloatingGroup(panel);
                close();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
            <span
                className="material-symbols-outlined"
                style={{ fontSize: '14px' }}
            >
                ad_group
            </span>
            Float tab
        </div>
    );
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

const DockviewDemo = (props: {
    theme?: DockviewTheme;
    showSettings?: boolean;
    onCloseSettings?: () => void;
    showThemeBuilder?: boolean;
    onCloseThemeBuilder?: () => void;
    onChangeTheme?: (theme: DockviewTheme) => void;
}) => {
    const [logLines, setLogLines] = React.useState<
        { text: string; timestamp?: Date; backgroundColor?: string }[]
    >([]);

    const [panels, setPanels] = React.useState<string[]>([]);
    const [groups, setGroups] = React.useState<string[]>([]);
    const [api, setApi] = React.useState<DockviewApi>();
    const [layoutReady, setLayoutReady] = React.useState(false);

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
            defaultConfig(api);
            setLayoutReady(true);
        };

        loadLayout();

        return () => {
            disposables.forEach((disposable) => disposable.dispose());
        };
    }, [api]);

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);
    };

    const [builderState, setBuilderState] = React.useState<ThemeBuilderState>(
        () => getInitialStateFromTheme(props.theme ?? themeAbyss)
    );

    const prevTheme = React.useRef(props.theme);
    React.useEffect(() => {
        if (prevTheme.current !== props.theme) {
            prevTheme.current = props.theme;
            setBuilderState(
                getInitialStateFromTheme(props.theme ?? themeAbyss)
            );
        }
    }, [props.theme]);

    const updateBuilder = (patch: Partial<ThemeBuilderState>) =>
        setBuilderState((s) => ({ ...s, ...patch }));

    const updateCss = (patch: Partial<ThemeCssOverrides>) =>
        setBuilderState((s) => {
            const next = { ...s.cssOverrides };
            for (const [k, v] of Object.entries(patch)) {
                if (v === undefined || v === '') {
                    delete (next as Record<string, unknown>)[k];
                } else {
                    (next as Record<string, unknown>)[k] = v;
                }
            }
            return { ...s, cssOverrides: next };
        });

    const effectiveTheme = React.useMemo(
        () => buildEffectiveTheme(props.theme ?? themeAbyss, builderState),
        [props.theme, builderState]
    );

    const containerRef = React.useRef<HTMLDivElement>(null);
    const prevCssOverrideKeys = React.useRef<string[]>([]);

    React.useEffect(() => {
        const dvRoot = containerRef.current?.querySelector(
            '[class*="dockview-theme"]'
        ) as HTMLElement | null;
        if (!dvRoot) return;

        for (const k of prevCssOverrideKeys.current) {
            if (!(k in builderState.cssOverrides)) {
                dvRoot.style.removeProperty(k);
            }
        }
        for (const [k, v] of Object.entries(builderState.cssOverrides)) {
            dvRoot.style.setProperty(k, v as string);
        }
        prevCssOverrideKeys.current = Object.keys(builderState.cssOverrides);
    }, [builderState.cssOverrides]);

    const panelColors = React.useMemo(
        () =>
            effectiveTheme.colorScheme === 'light' ? LIGHT_COLORS : DARK_COLORS,
        [effectiveTheme]
    );

    const getTabContextMenuItems = React.useCallback(
        ({ panel, group }: GetTabContextMenuItemsParams) => {
            const items: (
                | 'close'
                | 'closeOthers'
                | 'closeAll'
                | 'separator'
                | { component: React.FC<IContextMenuItemComponentProps> }
                | { label: string; action: () => void }
            )[] = [
                'close',
                'closeOthers',
                'closeAll',
                'separator',
                { component: FloatMenuItem },
            ];

            if (api) {
                const groupId = group.id;
                const panelId = panel.id;
                const tabGroup = api.getTabGroupForPanel({ groupId, panelId });
                const allTabGroups = api.getTabGroups(groupId);
                const otherTabGroups = allTabGroups.filter(
                    (tg) => tg.id !== tabGroup?.id
                );

                items.push('separator');

                if (tabGroup) {
                    items.push({
                        label: `Remove from "${tabGroup.label || tabGroup.id}"`,
                        action: () =>
                            api.removePanelFromTabGroup({ groupId, panelId }),
                    });
                }

                for (const tg of otherTabGroups) {
                    items.push({
                        label: `Add to "${tg.label || tg.id}"`,
                        action: () =>
                            api.addPanelToTabGroup({
                                groupId,
                                tabGroupId: tg.id,
                                panelId,
                            }),
                    });
                }

                items.push({
                    label: 'Add to new group',
                    action: () => {
                        const label = window.prompt('Group name:') || '';
                        const color = TAB_GROUP_COLORS[
                            Math.floor(Math.random() * TAB_GROUP_COLORS.length)
                        ] as TabGroupColor;
                        const newGroup = api.createTabGroup({
                            groupId,
                            label,
                            color,
                        });
                        api.addPanelToTabGroup({
                            groupId,
                            tabGroupId: newGroup.id,
                            panelId,
                        });
                    },
                });
            }

            return items;
        },
        [api]
    );

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
                backgroundColor: 'rgba(0,0,50,0.25)',
                borderRadius: '8px',
                position: 'relative',
                ...css,
            }}
        >
            <div
                style={{
                    flexGrow: 1,
                    height: 0,
                    display: 'flex',
                }}
            >
                <div
                    ref={containerRef}
                    style={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        visibility: layoutReady ? 'visible' : 'hidden',
                    }}
                >
                    <PanelColorsContext.Provider value={panelColors}>
                        <MarketProvider>
                            <ApiContext.Provider value={api}>
                                <DebugContext.Provider value={debug}>
                                    <ThemeContext.Provider
                                        value={effectiveTheme}
                                    >
                                        <DockviewReact
                                            components={components}
                                            // tabAnimation={'smooth'}
                                            defaultTabComponent={
                                                headerComponents.default
                                            }
                                            rightHeaderActionsComponent={
                                                RightControls
                                            }
                                            leftHeaderActionsComponent={
                                                LeftControls
                                            }
                                            prefixHeaderActionsComponent={
                                                PrefixHeaderControls
                                            }
                                            watermarkComponent={
                                                watermark
                                                    ? WatermarkComponent
                                                    : undefined
                                            }
                                            onReady={onReady}
                                            theme={effectiveTheme}
                                            getTabContextMenuItems={
                                                getTabContextMenuItems
                                            }
                                        />
                                    </ThemeContext.Provider>
                                </DebugContext.Provider>
                            </ApiContext.Provider>
                        </MarketProvider>
                    </PanelColorsContext.Provider>
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
                <ThemeBuilderModal
                    open={props.showThemeBuilder ?? false}
                    onClose={props.onCloseThemeBuilder ?? (() => {})}
                    state={builderState}
                    onChange={updateBuilder}
                    onCssChange={updateCss}
                    onReset={() =>
                        setBuilderState(
                            getInitialStateFromTheme(props.theme ?? themeAbyss)
                        )
                    }
                    baseTheme={props.theme ?? themeAbyss}
                    containerEl={containerRef.current}
                />
            </div>

            <SettingsModal
                open={props.showSettings ?? false}
                onClose={props.onCloseSettings ?? (() => {})}
                api={api}
                panels={panels}
                groups={groups}
                activePanel={activePanel}
                activeGroup={activeGroup}
                hasCustomWatermark={watermark}
                toggleCustomWatermark={() => setWatermark(!watermark)}
                debug={debug}
                onToggleDebug={() => setDebug(!debug)}
                showLogs={showLogs}
                onToggleShowLogs={() => setShowLogs(!showLogs)}
                onClearLogs={() => setLogLines([])}
            />
        </div>
    );
};

export default DockviewDemo;
