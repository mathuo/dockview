import React from 'react';
import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';

const TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

const components = {
    fixedHeightContainer: (props: IDockviewPanelProps<{ title: string }>) => {
        return (
            <div style={{ height: '100%', color: 'white' }}>
                {[TEXT, '\n\n'].join('').repeat(20)}
            </div>
        );
    },
    overflowContainer: (props: IDockviewPanelProps<{ title: string }>) => {
        return (
            <div style={{ height: '2000px', overflow: 'auto', color: 'white' }}>
                {[TEXT, '\n\n'].join('').repeat(20)}
            </div>
        );
    },
    userDefinedOverflowContainer: (
        props: IDockviewPanelProps<{ title: string }>
    ) => {
        return (
            <div style={{ height: '100%', color: 'white' }}>
                <div
                    style={{
                        height: '100%',
                        color: 'white',
                        overflow: 'auto',
                    }}
                >
                    {[TEXT, '\n\n'].join('').repeat(20)}
                </div>
            </div>
        );
    },
};

const DockviewComponent = (props: { theme?: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'fixedHeightContainer',
            title: 'Panel 1',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'overflowContainer',
            title: 'Panel 2',
            position: { direction: 'right' },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'userDefinedOverflowContainer',
            title: 'Panel 3',
            position: { direction: 'right' },
        });
    };

    return (
        <DockviewReact
            components={components}
            onReady={onReady}
            className={props.theme || 'dockview-theme-abyss'}
        />
    );
};

export default DockviewComponent;
