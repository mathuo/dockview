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
                    color: 'white',
                    height: '100%',
                }}
            >
                <span>{`${props.params.title}`}</span>
                {props.params.x && <span>{`  ${props.params.x}`}</span>}
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

const DockviewGroupControl = (props: { theme: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
        const panel1 = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Window 1',
            },
        });

        const panel2 = event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Window 2',
            },
            position: {
                direction: 'right',
            },
        });

        const panel3 = event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Window 3',
            },
            position: {
                direction: 'below',
            },
        });
    };

    return (
        <DockviewReact
            onReady={onReady}
            components={components}
            leftHeaderActionsComponent={LeftHeaderActions}
            rightHeaderActionsComponent={RightHeaderActions}
            className={`${props.theme || 'dockview-theme-abyss'}`}
        />
    );
};

export default DockviewGroupControl;
