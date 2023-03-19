import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    Position,
    Direction,
    IDockviewPanelHeaderProps,
} from 'dockview';
import * as React from 'react';
import './native.scss';

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
    isolatedApp: (
        props: IDockviewPanelProps<{ title: string; x?: number }>
    ) => {
        const onReady = (event: DockviewReadyEvent) => {
            const panel1 = event.api.addPanel({
                id: 'panel_1',
                component: 'default',
                params: {
                    title: 'Tab 1',
                },
            });
            const panel2 = event.api.addPanel({
                id: 'panel_2',
                component: 'default',
                params: {
                    title: 'Tab 2',
                },
            });
            const panel3 = event.api.addPanel({
                id: 'panel_3',
                component: 'default',
                params: {
                    title: 'Tab 3',
                },
            });
        };
        return (
            <DockviewReact
                onReady={onReady}
                components={components}
                className="dockview-theme-abyss"
            />
        );
    },
};

export const DockviewFullWidthTabs = () => {
    const onReady = (event: DockviewReadyEvent) => {
        const panel1 = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Tab 1',
            },
        });

        const panel2 = event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Tab 2',
            },
            position: {
                direction: 'right',
            },
        });

        const panel3 = event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Tab 3',
            },
            position: {
                direction: 'below',
            },
        });

        const panel4 = event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            params: {
                title: 'Tab 3',
            },
            position: {
                referencePanel: panel3,
            },
        });
    };

    return (
        <div
            style={{
                height: '500px',
                display: 'flex',
                padding: '8px',
                flexDirection: 'column',
            }}
        >
            <DockviewReact
                onReady={onReady}
                components={components}
                className="dockview-theme-abyss"
                singleTabMode="fullwidth"
            />
        </div>
    );
};
