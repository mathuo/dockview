import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    TabContextMenuEvent,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
};

const CustomTab = (
    props: IDockviewPanelHeaderProps & React.DOMAttributes<HTMLDivElement>
) => {
    const onClose = React.useCallback(
        (event: React.MouseEvent<HTMLSpanElement>) => {
            event.stopPropagation();
            props.api.close();
        },
        [props.api]
    );

    const onClick = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            props.api.setActive();

            if (props.onClick) {
                props.onClick(event);
            }
        },
        [props.api, props.onClick]
    );

    return (
        <div {...props} onClick={onClick} className="dockview-react-tab">
            <span className="dockview-react-tab-title">{props.api.title}</span>
            <span onClick={onClose} className="dockview-react-tab-action">
                {'✕'}
            </span>
        </div>
    );
};

const Test = (props: IDockviewPanelHeaderProps) => {
    const onContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        alert('hiya');
    };
    return <CustomTab onContextMenu={onContextMenu} {...props} />;
};

const tabComponents = {
    default: Test,
};

export const ContextMenuDockview = () => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Panel 1',
            },
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Panel 2',
            },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Panel 3',
            },
        });

        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Panel 4',
            },
            position: { referencePanel: 'panel_1', direction: 'right' },
        });
    };

    const onContextMenu = (event: TabContextMenuEvent) => {
        event.event.preventDefault();
        alert(`Content appear event fired for panel ${event.panel.id}`);
    };

    return (
        <DockviewReact
            components={components}
            tabComponents={tabComponents}
            onReady={onReady}
            className="dockview-theme-abyss"
            onTabContextMenu={onContextMenu}
        />
    );
};
