import {
    DockviewApi,
    DockviewGroupPanel,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewHeaderActionsProps,
    IDockviewPanelProps,
    SerializedDockview,
} from 'dockview';
import * as React from 'react';
import { Icon } from './utils';

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

    api.addPanel({
        id: 'panel_4',
        component: 'default',
    });

    api.addPanel({
        id: 'panel_5',
        component: 'default',
        position: { direction: 'right' },
    });

    api.addPanel({
        id: 'panel_6',
        component: 'default',
    });
}

let panelCount = 0;

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

export const App = (props: { theme?: string }) => {
    const [api, setApi] = React.useState<DockviewApi>();
    const [layout, setLayout] =
        useLocalStorage<SerializedDockview>('floating.layout');

    const [disableFloatingGroups, setDisableFloatingGroups] =
        React.useState<boolean>(false);

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

    const [options, setOptions] = React.useState<
        'boundedWithinViewport' | undefined
    >(undefined);

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
            </div>
            <div
                style={{
                    flexGrow: 1,
                }}
            >
                <DockviewReact
                    onReady={onReady}
                    components={components}
                    watermarkComponent={Watermark}
                    leftHeaderActionsComponent={LeftComponent}
                    rightHeaderActionsComponent={RightComponent}
                    disableFloatingGroups={disableFloatingGroups}
                    floatingGroupBounds={options}
                    className={`${props.theme || 'dockview-theme-abyss'}`}
                />
            </div>
        </div>
    );
};

const LeftComponent = (props: IDockviewHeaderActionsProps) => {
    const onClick = () => {
        props.containerApi.addPanel({
            id: (++panelCount).toString(),
            title: `Tab ${panelCount}`,
            component: 'default',
            position: { referenceGroup: props.group },
        });
    };
    return (
        <div style={{ height: '100%', color: 'white', padding: '0px 4px' }}>
            <Icon onClick={onClick} icon={'add'} />
        </div>
    );
};

const RightComponent = (props: IDockviewHeaderActionsProps) => {
    const [maximized, setMaximized] = React.useState<boolean>(
        props.api.isMaximized()
    );

    React.useEffect(() => {
        const disposable = props.containerApi.onDidMaximizedGroupChange(() => {
            setMaximized(props.api.isMaximized());
        });

        return () => {
            disposable.dispose();
        };
    }, [props.containerApi]);

    const onClick = () => {
        if (maximized) {
            props.api.exitMaximized();
        } else {
            props.api.maximize();
        }
    };

    return (
        <div style={{ height: '100%', color: 'white', padding: '0px 4px' }}>
            <Icon
                onClick={onClick}
                icon={maximized ? 'jump_to_element' : 'back_to_tab'}
            />
        </div>
    );
};

export default App;

const Watermark = () => {
    return <div style={{ color: 'white', padding: '8px' }}>watermark</div>;
};
