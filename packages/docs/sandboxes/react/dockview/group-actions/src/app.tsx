import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewHeaderActionsProps,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';
import './app.scss';

const components = {
    default: (props: IDockviewPanelProps<{ title: string; x?: number }>) => {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'gray',
                    height: '100%',
                }}
            >
                <span>{`${props.api.title}`}</span>
            </div>
        );
    },
};

const RightHeaderActions = (props: IDockviewHeaderActionsProps) => {
    const isGroupActive = props.isGroupActive;

    return (
        <div className="dockview-groupcontrol-demo">
            <span
                className="dockview-groupcontrol-demo-group-active"
                style={{
                    background: isGroupActive ? 'green' : 'red',
                }}
            >
                {isGroupActive ? 'Group Active' : 'Group Inactive'}
            </span>
        </div>
    );
};

const LeftHeaderActions = (props: IDockviewHeaderActionsProps) => {
    const activePanel = props.activePanel;

    return (
        <div className="dockview-groupcontrol-demo">
            <span className="dockview-groupcontrol-demo-active-panel">{`activePanel: ${
                activePanel?.id || 'null'
            }`}</span>
        </div>
    );
};

const PrefixHeader = (props: IDockviewHeaderActionsProps) => {
    const activePanel = props.activePanel;

    return <div className="dockview-groupcontrol-demo">{'🌲'}</div>;
};

const DockviewGroupControl = (props: { theme: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
            position: {
                direction: 'right',
            },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
            position: {
                direction: 'below',
            },
        });
    };

    return (
        <DockviewReact
            onReady={onReady}
            components={components}
            prefixHeaderActionsComponent={PrefixHeader}
            leftHeaderActionsComponent={LeftHeaderActions}
            rightHeaderActionsComponent={RightHeaderActions}
            className={`${props.theme || 'dockview-theme-abyss'}`}
        />
    );
};

export default DockviewGroupControl;
