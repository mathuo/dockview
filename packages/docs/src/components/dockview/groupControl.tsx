import {} from '@site/../dockview/dist/cjs/dnd/droptarget';
import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewGroupControlProps,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';
import './groupControl.scss';

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

const GroupControlComponent = (props: IDockviewGroupControlProps) => {
    const isGroupActive = props.isGroupActive;
    const activePanel = props.activePanel;

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
            <span className="dockview-groupcontrol-demo-active-panel">{`activePanel: ${
                activePanel?.id || 'null'
            }`}</span>
        </div>
    );
};

export const DockviewGroupControl = () => {
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
        <div
            style={{
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <DockviewReact
                onReady={onReady}
                components={components}
                groupControlComponent={GroupControlComponent}
                className="dockview-theme-abyss"
            />
        </div>
    );
};
