import {
    DockviewDefaultTab,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    DockviewApi,
} from 'dockview';
import * as React from 'react';
import './app.scss';
import { defaultConfig } from './defaultLayout';
import { GridActions } from './gridActions';
import { PanelActions } from './panelActions';
import { GroupActions } from './groupActions';
import { LeftControls, PrefixHeaderControls, RightControls } from './controls';
import { Table, usePanelApiMetadata } from './debugPanel';

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
                <Table data={metadata} />
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

const DockviewDemo = (props: { theme?: string }) => {
    const [logLines, setLogLines] = React.useState<any[]>([]);

    const [panels, setPanels] = React.useState<string[]>([]);
    const [groups, setGroups] = React.useState<string[]>([]);
    const [api, setApi] = React.useState<DockviewApi>();

    const [activePanel, setActivePanel] = React.useState<string>();
    const [activeGroup, setActiveGroup] = React.useState<string>();

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
                event.api.fromJSON(JSON.parse(state));
                return;
            } catch {
                localStorage.removeItem('dv-demo-state');
            }
            return;
        }

        defaultConfig(event.api);
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
