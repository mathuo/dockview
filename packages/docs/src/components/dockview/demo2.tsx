import {
    GridviewReact,
    GridviewReadyEvent,
    IGridviewPanelProps,
    IPaneviewPanelProps,
    PaneviewReact,
    PaneviewReadyEvent,
} from 'dockview';
import * as React from 'react';
import { BrowserHeader } from '../browserHeader';
import './demo2.scss';

const paneComponents = {
    default: (props: IPaneviewPanelProps) => {
        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
};

const components = {
    default: (props: IGridviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
    panes: (props: IGridviewPanelProps) => {
        const onReady = (event: PaneviewReadyEvent) => {
            event.api.addPanel({
                id: 'pane_1',
                component: 'default',
                title: 'Pane 1',
                isExpanded: false,
            });

            event.api.addPanel({
                id: 'pane_2',
                component: 'default',
                title: 'Pane 2',
                isExpanded: true,
            });

            event.api.addPanel({
                id: 'pane_3',
                component: 'default',
                title: 'Pane 3',
                isExpanded: true,
            });

            event.api.addPanel({
                id: 'pane_4',
                component: 'default',
                title: 'Pane 4',
                isExpanded: false,
            });
        };

        return (
            <PaneviewReact
                onReady={onReady}
                components={paneComponents}
                className="paneview-background"
            />
        );
    },
};

export const DockviewDemo2 = () => {
    const onReady = (event: GridviewReadyEvent) => {
        event.api.addPanel({
            id: 'panes',
            component: 'panes',
            minimumHeight: 100,
            minimumWidth: 100,
        });

        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            position: { referencePanel: 'panes', direction: 'right' },
            minimumHeight: 100,
            minimumWidth: 100,
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            position: { referencePanel: 'panel_1', direction: 'below' },
            minimumHeight: 100,
            minimumWidth: 100,
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: { referencePanel: 'panel_2', direction: 'below' },
            minimumHeight: 100,
            minimumWidth: 100,
        });
    };

    return (
        <div
            style={{
                height: '530px',
                margin: '40px 0px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <BrowserHeader />
            <div style={{ flexGrow: 1 }}>
                <GridviewReact
                    onReady={onReady}
                    components={components}
                    className="dockview-theme-abyss"
                />
            </div>
        </div>
    );
};
