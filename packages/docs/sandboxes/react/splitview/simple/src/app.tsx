import {
    SplitviewReact,
    SplitviewReadyEvent,
    ISplitviewPanelProps,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: ISplitviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    padding: '10px',
                    height: '100%',
                }}
            >
                {props.params.title}
            </div>
        );
    },
};

export const App: React.FC = (props: { theme?: string }) => {
    const onReady = (event: SplitviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
        });
    };

    return (
        <SplitviewReact
            components={components}
            onReady={onReady}
            className={props.theme || 'dockview-theme-abyss'}
        />
    );
};

export default App;
