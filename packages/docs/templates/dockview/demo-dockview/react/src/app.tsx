import {
    DockviewDefaultTab,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    DockviewApi,
} from 'dockview';
import React from 'react';
import './app.css';
import { defaultConfig } from './defaultLayout.ts';
import { GridActions } from './gridActions.tsx';
import { PanelActions } from './panelActions.tsx';
import { GroupActions } from './groupActions.tsx';
import {
    LeftControls,
    PrefixHeaderControls,
    RightControls,
} from './controls.tsx';
import { usePanelApiMetadata } from './debugPanel.tsx';
import { LogLine, LogLines } from './logLines.tsx';

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
                {/* <Table data={metadata} /> */}
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
    iframe: (props: IDockviewPanelProps) => {
        return (
            <iframe
                onMouseDown={() => {
                    if (!props.api.isActive) {
                        props.api.setActive();
                    }
                }}
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

const colors = [
    'rgba(255,0,0,0.2)',
    'rgba(0,255,0,0.2)',
    'rgba(0,0,255,0.2)',
    'rgba(255,255,0,0.2)',
    'rgba(0,255,255,0.2)',
    'rgba(255,0,255,0.2)',
];
let count = 0;

const DockviewDemo = (props: { theme?: string }) => {
    const [logLines, setLogLines] = React.useState<LogLine[]>([]);
    const [emittedLogsOnCurrentStackFrame, setEmittedLogsOnCurrentStackFrame] =
        React.useState<LogLine[]>([]);

    const [panels, setPanels] = React.useState<string[]>([]);
    const [groups, setGroups] = React.useState<string[]>([]);
    const [api, setApi] = React.useState<DockviewApi>();

    const [activePanel, setActivePanel] = React.useState<string>();
    const [activeGroup, setActiveGroup] = React.useState<string>();

    const addLogLine = (message: string) => {
        setEmittedLogsOnCurrentStackFrame((line) => [
            { text: message, timestamp: new Date() },
            ...line,
        ]);
    };

    React.useLayoutEffect(() => {
        if (emittedLogsOnCurrentStackFrame.length === 0) {
            return;
        }
        const color = colors[count++ % colors.length];
        setLogLines((lines) => [
            ...emittedLogsOnCurrentStackFrame.map((_) => ({
                ..._,
                backgroundColor: color,
            })),
            ...lines,
        ]);
        setEmittedLogsOnCurrentStackFrame([]);
    }, [emittedLogsOnCurrentStackFrame]);

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);
        setPanels([]);
        setGroups([]);
        setActivePanel(undefined);
        setActiveGroup(undefined);
        addLogLine(`Dockview Is Ready`);
    };

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

        let success = false;

        const state = localStorage.getItem('dv-demo-state');
        if (state) {
            try {
                api.fromJSON(JSON.parse(state));
                success = true;
            } catch {
                localStorage.removeItem('dv-demo-state');
            }
        }

        if (!success) {
            defaultConfig(api);
        }

        return disposables.forEach((disposable) => disposable.dispose());
    }, [api]);

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                padding: '8px',
                backgroundColor: 'rgba(0,0,50,0.25)',
                borderRadius: '8px',
            }}
        >
            <div>
                <GridActions api={api} />
                <PanelActions
                    api={api}
                    panels={panels}
                    activePanel={activePanel}
                />
                <GroupActions
                    api={api}
                    groups={groups}
                    activeGroup={activeGroup}
                />
            </div>
            <div
                style={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    // flexBasis: 0
                    height: 0,
                    display: 'flex',
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
                <div
                    style={{
                        width: '300px',
                        backgroundColor: 'black',
                        color: 'white',
                        overflow: 'auto',
                    }}
                >
                    <LogLines lines={logLines} />
                </div>
            </div>
        </div>
    );
};

export default DockviewDemo;
