import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewHeaderActionsProps,
    IDockviewPanelProps,
    SerializedDockview,
    DockviewPanelApi,
    DockviewGroupLocation,
} from 'dockview';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from './utils';
import { PopoverMenu } from './popover';

function usePopoutWindowContext(api: DockviewPanelApi): Window {
    const [location, setLocation] = React.useState<DockviewGroupLocation>(
        api.location
    );

    React.useEffect(() => {
        const disposable = api.onDidLocationChange((event) => {
            setLocation(event.location);
        });

        return () => {
            disposable.dispose();
        };
    });

    const windowContext = React.useMemo(() => {
        if (location.type === 'popout') {
            return location.getWindow();
        }
        return window;
    }, [location]);

    return windowContext;
}

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        const windowContext = usePopoutWindowContext(props.api);

        React.useEffect(() => {
            setTimeout(() => {
                const a = windowContext.document.createElement('div');
                a.className = 'aaa';
                windowContext.document.body.appendChild(a);
            }, 5000);
        }, [windowContext]);

        const [reset, setReset] = React.useState<boolean>(false);

        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                }}
            >
                <button
                    onClick={() => {
                        console.log(windowContext);
                        setReset(true);
                        setTimeout(() => {
                            setReset(false);
                        }, 2000);
                    }}
                >
                    Print
                </button>
                {!reset && <PopoverMenu api={props.api} />}
                {props.api.title}
            </div>
        );
    },
};

function loadDefaultLayout(api: DockviewApi) {
    api.addPanel({
        id: 'panel_1',
        component: 'default',
    });

    // api.addPanel({
    //     id: 'panel_2',
    //     component: 'default',
    // });

    // api.addPanel({
    //     id: 'panel_3',
    //     component: 'default',
    // });

    // api.addPanel({
    //     id: 'panel_4',
    //     component: 'default',
    // });

    // api.addPanel({
    //     id: 'panel_5',
    //     component: 'default',
    //     position: { direction: 'right' },
    // });

    // api.addPanel({
    //     id: 'panel_6',
    //     component: 'default',
    // });
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
    const [popout, setPopout] = React.useState<boolean>(
        props.api.location === 'popout'
    );

    React.useEffect(() => {
        const disposable = props.group.api.onDidLocationChange((event) => [
            setPopout(event.location === 'popout'),
        ]);

        return () => {
            disposable.dispose();
        };
    }, [props.group.api]);

    const onClick = () => {
        if (popout) {
            const group = props.containerApi.addGroup();
            props.group.api.moveTo({ group });
        } else {
            const window = props.containerApi.addPopoutGroup(props.group, {
                popoutUrl: '/popout/index.html',
            });
        }
    };

    return (
        <div style={{ height: '100%', color: 'white', padding: '0px 4px' }}>
            <Icon
                onClick={onClick}
                icon={popout ? 'jump_to_element' : 'back_to_tab'}
            />
        </div>
    );
};

export default App;

const Watermark = () => {
    return <div style={{ color: 'white', padding: '8px' }}>watermark</div>;
};
