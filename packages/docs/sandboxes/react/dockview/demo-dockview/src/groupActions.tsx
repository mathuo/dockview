import {
    DockviewApi,
    DockviewGroupLocation,
    DockviewGroupPanel,
    DockviewHeaderPosition,
} from 'dockview-react';
import * as React from 'react';

const iconBtn = (active?: boolean): React.CSSProperties => ({
    padding: '3px 6px',
    fontSize: 11,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    background: active
        ? 'rgba(72,100,220,0.25)'
        : 'rgba(255,255,255,0.04)',
    color: active ? 'white' : 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const selectStyle: React.CSSProperties = {
    padding: '3px 4px',
    fontSize: 11,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    outline: 'none',
};

const GroupAction = (props: {
    groupId: string;
    groups: string[];
    api: DockviewApi;
    activeGroup?: string;
}) => {
    const onClick = () => {
        props.api?.getGroup(props.groupId)?.focus();
    };

    const isActive = props.activeGroup === props.groupId;

    const [group, setGroup] = React.useState<DockviewGroupPanel | undefined>(
        undefined
    );

    React.useEffect(() => {
        const disposable = props.api.onDidLayoutFromJSON(() => {
            setGroup(props.api.getGroup(props.groupId));
        });

        setGroup(props.api.getGroup(props.groupId));

        return () => disposable.dispose();
    }, [props.api, props.groupId]);

    const [headerPosition, setHeaderPosition] =
        React.useState<DockviewHeaderPosition>(group?.api.getHeaderPosition() ?? 'top');
    const [location, setLocation] =
        React.useState<DockviewGroupLocation | null>(null);
    const [isMaximized, setIsMaximized] = React.useState<boolean>(false);
    const [isVisible, setIsVisible] = React.useState<boolean>(true);

    React.useEffect(() => {
        if (!group) {
            setLocation(null);
            return;
        }

        const disposable = group.api.onDidLocationChange((event) => {
            setLocation(event.location);
        });

        const disposable2 = props.api.onDidMaximizedGroupChange(() => {
            setIsMaximized(group.api.isMaximized());
        });

        const disposable3 = group.api.onDidVisibilityChange(() => {
            setIsVisible(group.api.isVisible);
        });

        setLocation(group.api.location);
        setIsMaximized(group.api.isMaximized());
        setIsVisible(group.api.isVisible);
        setHeaderPosition(group.api.getHeaderPosition());

        return () => {
            disposable.dispose();
            disposable2.dispose();
            disposable3.dispose();
        };
    }, [group]);

    return (
        <div style={{ padding: '3px 16px' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 28,
                }}
            >
                <button
                    onClick={onClick}
                    style={{
                        flex: 1,
                        padding: '3px 8px',
                        fontSize: 11,
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 4,
                        background: isActive
                            ? 'rgba(72,100,220,0.25)'
                            : 'rgba(255,255,255,0.04)',
                        color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {props.groupId}
                </button>
                <div style={{ display: 'flex', gap: 2 }}>
                    <button
                        style={iconBtn(location?.type === 'floating')}
                        onClick={() => {
                            if (group) {
                                props.api.addFloatingGroup(group, {
                                    width: 400,
                                    height: 300,
                                    x: 50,
                                    y: 50,
                                    position: { bottom: 50, right: 50 },
                                });
                            }
                        }}
                        title="Float"
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            ad_group
                        </span>
                    </button>
                    <button
                        style={iconBtn(location?.type === 'popout')}
                        onClick={() => {
                            if (group) props.api.addPopoutGroup(group);
                        }}
                        title="Popout"
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            open_in_new
                        </span>
                    </button>
                    <button
                        style={iconBtn(isMaximized)}
                        onClick={() => {
                            if (group) {
                                if (group.api.isMaximized()) {
                                    group.api.exitMaximized();
                                } else {
                                    group.api.maximize();
                                }
                            }
                        }}
                        title="Maximize"
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            fullscreen
                        </span>
                    </button>
                    <button
                        style={iconBtn()}
                        onClick={() => {
                            if (group) {
                                group.api.setVisible(!group.api.isVisible);
                            }
                        }}
                        title="Toggle visibility"
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            {isVisible ? 'visibility' : 'visibility_off'}
                        </span>
                    </button>
                    <button
                        style={iconBtn()}
                        onClick={() => {
                            props.api?.getGroup(props.groupId)?.api.close();
                        }}
                        title="Close"
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            close
                        </span>
                    </button>
                </div>
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    paddingTop: 4,
                    paddingBottom: 2,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.4)',
                    }}
                >
                    Header
                </span>
                <select
                    style={selectStyle}
                    value={headerPosition}
                    onChange={(e) => {
                        const value = e.target.value as DockviewHeaderPosition;
                        if (group) {
                            group.api.setHeaderPosition(value);
                            setHeaderPosition(value);
                        }
                    }}
                >
                    <option value="top">top</option>
                    <option value="bottom">bottom</option>
                    <option value="left">left</option>
                    <option value="right">right</option>
                </select>
            </div>
        </div>
    );
};

export const GroupActions = (props: {
    groups: string[];
    api: DockviewApi;
    activeGroup?: string;
}) => {
    return (
        <div style={{ padding: '2px 0' }}>
            {props.groups.map((groupId) => (
                <GroupAction key={groupId} {...props} groupId={groupId} />
            ))}
        </div>
    );
};
