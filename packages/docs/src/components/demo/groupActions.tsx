import {
    DockviewApi,
    DockviewGroupLocation,
    DockviewGroupPanel,
} from 'dockview';
import * as React from 'react';
import { Button, ButtonGroup } from '@chakra-ui/react';

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
                <Button
                    onClick={onClick}
                    variant={isActive ? "solid" : "outline"}
                    colorPalette={isActive ? "blue" : undefined}
                    size="sm"
                >
                    {props.groupId}
                </Button>
            </div>
            <div style={{ display: 'flex' }}>
                <ButtonGroup size="sm" variant="outline">
                    <Button
                        variant={location?.type === 'floating' ? "solid" : "outline"}
                        colorPalette={location?.type === 'floating' ? "blue" : undefined}
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
                    </Button>
                    <Button
                        variant={location?.type === 'popout' ? "solid" : "outline"}
                        colorPalette={location?.type === 'popout' ? "blue" : undefined}
                        onClick={() => {
                            if (group) {
                                props.api.addPopoutGroup(group);
                            }
                        }}
                    >
                        <span className="material-symbols-outlined">open_in_new</span>
                    </Button>
                    <Button
                        variant={isMaximized ? "solid" : "outline"}
                        colorPalette={isMaximized ? "blue" : undefined}
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
                        <span className="material-symbols-outlined">fullscreen</span>
                    </Button>
                    <Button
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
                    </Button>
                    <Button
                        onClick={() => {
                            const panel = props.api?.getGroup(props.groupId);
                            panel?.api.close();
                        }}
                    >
                        <span className="material-symbols-outlined">close</span>
                    </Button>
                </ButtonGroup>
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
