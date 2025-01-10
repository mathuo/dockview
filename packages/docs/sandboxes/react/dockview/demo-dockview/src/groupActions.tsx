import {
    DockviewApi,
    DockviewGroupLocation,
    DockviewGroupPanel,
} from 'dockview';
import * as React from 'react';

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

        return () => {
            disposable.dispose();
        };
    }, [props.api, props.groupId]);

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

        return () => {
            disposable.dispose();
            disposable2.dispose();
            disposable3.dispose();
        };
    }, [group]);

    return (
        <div className="button-action">
            <div style={{ display: 'flex' }}>
                <button
                    onClick={onClick}
                    className={
                        isActive ? 'demo-button selected' : 'demo-button'
                    }
                >
                    {props.groupId}
                </button>
            </div>
            <div style={{ display: 'flex' }}>
                <button
                    className={
                        location?.type === 'floating'
                            ? 'demo-icon-button selected'
                            : 'demo-icon-button'
                    }
                    onClick={() => {
                        if (group) {
                            props.api.addFloatingGroup(group, {
                                width: 400,
                                height: 300,
                                x: 50,
                                y: 50,
                                position: {
                                    bottom: 50,
                                    right: 50,
                                },
                            });
                        }
                    }}
                >
                    <span className="material-symbols-outlined">ad_group</span>
                </button>
                <button
                    className={
                        location?.type === 'popout'
                            ? 'demo-icon-button selected'
                            : 'demo-icon-button'
                    }
                    onClick={() => {
                        if (group) {
                            props.api.addPopoutGroup(group);
                        }
                    }}
                >
                    <span className="material-symbols-outlined">
                        open_in_new
                    </span>
                </button>
                <button
                    className={
                        isMaximized
                            ? 'demo-icon-button selected'
                            : 'demo-icon-button'
                    }
                    onClick={() => {
                        if (group) {
                            if (group.api.isMaximized()) {
                                group.api.exitMaximized();
                            } else {
                                group.api.maximize();
                            }
                        }
                    }}
                >
                    <span className="material-symbols-outlined">
                        fullscreen
                    </span>
                </button>
                <button
                    className="demo-icon-button"
                    onClick={() => {
                        console.log(group);
                        if (group) {
                            if (group.api.isVisible) {
                                group.api.setVisible(false);
                            } else {
                                group.api.setVisible(true);
                            }
                        }
                    }}
                >
                    <span className="material-symbols-outlined">
                        {isVisible ? 'visibility' : 'visibility_off'}
                    </span>
                </button>
                <button
                    className="demo-icon-button"
                    onClick={() => {
                        const panel = props.api?.getGroup(props.groupId);
                        panel?.api.close();
                    }}
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
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
        <div className="action-container">
            {props.groups.map((groupId) => {
                return (
                    <GroupAction key={groupId} {...props} groupId={groupId} />
                );
            })}
        </div>
    );
};
