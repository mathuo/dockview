import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-react';
import React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
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

let counter = 0;

function addPanel(api: DockviewApi) {
    counter++;
    api.addPanel({
        id: `panel_${counter}`,
        component: 'default',
        title: `Panel ${counter}`,
        params: { title: `Panel ${counter}` },
    });
}

export const App = (props: { theme?: string }) => {
    const [api, setApi] = React.useState<DockviewApi>();
    const [mode, setMode] = React.useState<'wrap' | 'dropdown'>('wrap');

    const onReady = (event: DockviewReadyEvent) => {
        counter = 0;
        // Open enough panels in a single group that the tabs no longer fit on
        // one row.
        for (let i = 0; i < 12; i++) {
            addPanel(event.api);
        }
        setApi(event.api);
    };

    const toggleMode = () => {
        // The `overflow` prop below is bound to `mode`, so flipping the state
        // re-applies the option through the React wrapper — no manual
        // `updateOptions` call needed (and a hard-coded prop would revert it).
        setMode((m) => (m === 'wrap' ? 'dropdown' : 'wrap'));
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            <div style={{ height: '25px' }}>
                <button onClick={() => api && addPanel(api)}>Add Tab</button>
                <button onClick={toggleMode}>
                    {mode === 'wrap'
                        ? 'Switch to dropdown mode'
                        : 'Switch to wrap mode'}
                </button>
            </div>
            <div style={{ flexGrow: 1 }}>
                <DockviewReact
                    onReady={onReady}
                    components={components}
                    overflow={{ mode }}
                    className={`${props.theme || 'dockview-theme-abyss'}`}
                />
            </div>
        </div>
    );
};

export default App;
