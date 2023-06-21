import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    SerializedDockview,
} from 'dockview';
import * as React from 'react';

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

const counter = (() => {
    let i = 0;

    return {
        next: () => ++i,
    };
})();

function loadDefaultLayout(api: DockviewApi) {
    api.addPanel({
        id: 'panel_1',
        component: 'default',
    });

    api.addPanel({
        id: 'panel_2',
        component: 'default',
    });

    api.addPanel({
        id: 'panel_3',
        component: 'default',
    });

    const panel4 = api.addPanel({
        id: 'panel_4',
        component: 'default',
        floating: true,
    });

    api.addPanel({
        id: 'panel_5',
        component: 'default',
        floating: false,
        position: { referencePanel: panel4 },
    });

    api.addPanel({
        id: 'panel_6',
        component: 'default',
    });
}

let panelCount = 0;

function addFloatingPanel(api: DockviewApi) {
    api.addPanel({
        id: (++panelCount).toString(),
        title: `Tab ${panelCount}`,
        component: 'default',
        floating: true,
    });
}

function addFloatingPanel2(api: DockviewApi) {
    api.addPanel({
        id: (++panelCount).toString(),
        title: `Tab ${panelCount}`,
        component: 'default',
        floating: { width: 250, height: 150, x: 50, y: 50 },
    });
}

function safeParse<T>(value: any): T | null {
    try {
        return JSON.parse(value) as T;
    } catch (err) {
        return null;
    }
}

const useLocalStorage = <T,>(
    key: string
): [T | null, (setter: T | null) => void] => {
    const [state, setState] = React.useState<T | null>(
        safeParse(localStorage.getItem(key))
    );

    React.useEffect(() => {
        const _state = localStorage.getItem('key');
        try {
            if (_state !== null) {
                setState(JSON.parse(_state));
            }
        } catch (err) {
            //
        }
    }, [key]);

    return [
        state,
        (_state: T | null) => {
            if (_state === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(_state));
                setState(_state);
            }
        },
    ];
};

export const DockviewPersistance = () => {
    const [api, setApi] = React.useState<DockviewApi>();
    const [layout, setLayout] =
        useLocalStorage<SerializedDockview>('floating.layout');

    const load = (api: DockviewApi) => {
        api.clear();
        if (layout) {
            try {
                api.fromJSON(layout);
            } catch (err) {
                console.error(err);
                api.clear();
                loadDefaultLayout(api);
            }
        } else {
            loadDefaultLayout(api);
        }
    };

    const onReady = (event: DockviewReadyEvent) => {
        load(event.api);
        setApi(event.api);
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
                <button
                    onClick={() => {
                        if (api) {
                            setLayout(api.toJSON());
                        }
                    }}
                >
                    Save
                </button>
                <button
                    onClick={() => {
                        if (api) {
                            load(api);
                        }
                    }}
                >
                    Load
                </button>
                <button
                    onClick={() => {
                        api!.clear();
                        setLayout(null);
                    }}
                >
                    Clear
                </button>
                <button
                    onClick={() => {
                        addFloatingPanel2(api!);
                    }}
                >
                    Add Layout
                </button>
            </div>
            <div
                style={{
                    flexGrow: 1,
                    overflow: 'hidden',
                }}
            >
                <DockviewReact
                    onReady={onReady}
                    components={components}
                    watermarkComponent={Watermark}
                    className="dockview-theme-abyss"
                />
            </div>
        </div>
    );
};

export default DockviewPersistance;

const Watermark = () => {
    return <div style={{ color: 'white', padding: '8px' }}>watermark</div>;
};
