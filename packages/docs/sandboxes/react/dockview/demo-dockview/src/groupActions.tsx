import {
    DockviewApi,
    DockviewGroupLocation,
    DockviewGroupPanel,
    DockviewHeaderPosition,
} from 'dockview-react';
import * as React from 'react';
import { SB } from './sidebarTheme';
import { IconBtn } from './sidebarKit';

const selectStyle: React.CSSProperties = {
    padding: '5px 8px',
    fontSize: 11,
    fontFamily: SB.ui,
    border: `1px solid ${SB.border}`,
    borderRadius: SB.radiusSm,
    background: SB.surface,
    color: SB.text,
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
        <div style={{ padding: '3px 0' }}>
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
                        padding: '5px 10px',
                        fontSize: 11.5,
                        fontWeight: isActive ? 600 : 500,
                        fontFamily: SB.ui,
                        border: `1px solid ${isActive ? SB.accent : SB.border}`,
                        borderRadius: SB.radiusSm,
                        background: isActive ? SB.accent : SB.surface,
                        color: isActive ? SB.accentContrast : SB.text,
                        boxShadow: isActive ? SB.glow : 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {props.groupId}
                </button>
                <div style={{ display: 'flex', gap: 3 }}>
                    <IconBtn
                        icon="ad_group"
                        title="Float"
                        active={location?.type === 'floating'}
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
                    />
                    <IconBtn
                        icon="open_in_new"
                        title="Popout"
                        active={location?.type === 'popout'}
                        onClick={() => {
                            if (group) props.api.addPopoutGroup(group);
                        }}
                    />
                    <IconBtn
                        icon="fullscreen"
                        title="Maximize"
                        active={isMaximized}
                        onClick={() => {
                            if (group) {
                                if (group.api.isMaximized()) {
                                    group.api.exitMaximized();
                                } else {
                                    group.api.maximize();
                                }
                            }
                        }}
                    />
                    <IconBtn
                        icon={isVisible ? 'visibility' : 'visibility_off'}
                        title="Toggle visibility"
                        onClick={() => {
                            if (group) {
                                group.api.setVisible(!group.api.isVisible);
                            }
                        }}
                    />
                    <IconBtn
                        icon="close"
                        title="Close"
                        onClick={() => {
                            props.api?.getGroup(props.groupId)?.api.close();
                        }}
                    />
                </div>
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    paddingTop: 6,
                    paddingBottom: 2,
                }}
            >
                <span
                    style={{
                        fontSize: 12,
                        color: SB.text,
                        fontFamily: SB.ui,
                    }}
                >
                    Header
                </span>
                <select
                    className="dv-sb-input"
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
