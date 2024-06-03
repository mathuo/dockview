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

function addPanel(api: DockviewApi) {
    api.addPanel({
        id: (++panelCount).toString(),
        title: `Tab ${panelCount}`,
        component: 'default',
    });
}

function addFloatingPanel2(api: DockviewApi) {
    api.addPanel({
        id: (++panelCount).toString(),
        title: `Tab ${panelCount}`,
        component: 'default',
        floating: { width: 250, height: 150, left: 50, top: 50 },
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

export const DockviewPersistence = (props: { theme?: string }) => {
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
                <button
                    onClick={() => {
                        addFloatingPanel2(api!);
                    }}
                >
                    Add Floating Group
                </button>
                <button
                    onClick={() => {
                        setOptions(
                            options === undefined
                                ? 'boundedWithinViewport'
                                : undefined
                        );
                    }}
                >
                    {`Bounds: ${options ? 'Within' : 'Overflow'}`}
                </button>
                <button
                    onClick={() => {
                        setDisableFloatingGroups((x) => !x);
                    }}
                >
                    {`${disableFloatingGroups ? 'Enable' : 'Disable'
                        } floating groups`}
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
        addPanel(props.containerApi);
    };
    return (
        <div style={{ height: '100%', color: 'white', padding: '0px 4px' }}>
            <Icon onClick={onClick} icon={'add'} />
        </div>
    );
};

const RightComponent = (props: IDockviewHeaderActionsProps) => {
    const [floating, setFloating] = React.useState<boolean>(
        props.api.location.type === 'floating'
    );

    React.useEffect(() => {
        const disposable = props.group.api.onDidLocationChange(
            (event) => {
                setFloating(event.location.type === 'floating');
            }
        );

        return () => {
            disposable.dispose();
        };
    }, [props.group.api]);

    const onClick = () => {
        if (floating) {
            const group = props.containerApi.addGroup();
            props.group.api.moveTo({ group });
        } else {
            props.containerApi.addFloatingGroup(props.group, undefined, {
                position: {
                    width: 400,
                    height: 300,
                    bottom: 50,
                    right: 50,
                }
            });
        }
    };

    return (
        <div style={{ height: '100%', color: 'white', padding: '0px 4px' }}>
            <Icon
                onClick={onClick}
                icon={floating ? 'jump_to_element' : 'back_to_tab'}
            />
        </div>
    );
};

export default DockviewPersistence;

const Watermark = () => {
    return <div style={{ color: 'white', padding: '8px' }}>watermark</div>;
};
