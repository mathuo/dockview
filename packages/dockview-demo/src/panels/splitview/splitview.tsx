import {
    ISplitviewPanelProps,
    Orientation,
    SplitviewApi,
    SplitviewReact,
    SplitviewReadyEvent,
    PanelDimensionChangeEvent,
    ActiveEvent,
    FocusEvent,
    VisibilityEvent,
    PanelConstraintChangeEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';
import { CompositeDisposable } from '../../lifecycle';
import './splitview.scss';

const components = {
    default: (props: ISplitviewPanelProps) => {
        const [active, setActive] = React.useState<boolean>(false);
        const [visible, setVisible] = React.useState<boolean>(false);
        const [focused, setFocused] = React.useState<boolean>(false);
        const [dimension, setDimension] = React.useState<{
            width: number;
            height: number;
        }>({ width: 0, height: 0 });
        const [constraints, setConstraints] = React.useState<{
            maximumSize?: number;
            minimumSize?: number;
        }>({ maximumSize: undefined, minimumSize: undefined });

        React.useEffect(() => {
            const disposable = new CompositeDisposable(
                props.api.onDidActiveChange((event: ActiveEvent) => {
                    setActive(event.isActive);
                }),
                props.api.onDidConstraintsChange(
                    (event: PanelConstraintChangeEvent) => {
                        setConstraints(event);
                    }
                ),
                props.api.onDidDimensionsChange(
                    (event: PanelDimensionChangeEvent) => {
                        setDimension(event);
                    }
                ),
                props.api.onDidFocusChange((event: FocusEvent) => {
                    setFocused(event.isFocused);
                }),
                props.api.onDidVisibilityChange((event: VisibilityEvent) => {
                    setVisible(event.isVisible);
                })
            );

            return () => {
                disposable.dispose();
            };
        }, []);

        const color = React.useMemo(
            () => 'rgba(14, 99, 156,0.4)',
            // `rgb(${Math.floor(256 * Math.random())},${Math.floor(
            //     256 * Math.random()
            // )},${Math.floor(256 * Math.random())})`,
            []
        );

        return (
            <div
                style={{
                    backgroundColor: color,
                    color: '#cccccc',
                }}
                className="splitview-demo-panel"
            >
                <div className="api-parameter">
                    <span>Id</span>
                    <span>{props.api.id}</span>
                    <span>Width</span>
                    <span>{dimension.width}</span>
                    <span>Height</span>
                    <span>{dimension.height}</span>
                    <span>Min. size</span>
                    <span>{constraints.minimumSize}</span>
                    <span>Max. size</span>
                    <span>{constraints.maximumSize}</span>
                    <span>Active</span>
                    <span>{active.toString()}</span>
                    <span>Visible</span>
                    <span>{visible.toString()}</span>
                    <span>Focused</span>
                    <span>{focused.toString()}</span>
                </div>
            </div>
        );
    },
};

export const SplitviewPanel = (props: IDockviewPanelProps) => {
    return (
        <div
            style={{
                overflow: 'auto',
                height: '100%',
                padding: '10px 0px',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ padding: '0px 20px', fontSize: '36px' }}>
                Splitview
            </div>
            <ul style={{ padding: '0px 20px 0px 40px' }}>
                <li>
                    The splitview component exposes an API object, a selection
                    of avaliable values are shown in the summary sections below
                </li>
                <li>
                    Each panel exposes it's own API, and has access to the
                    common API. A selector of panel API values are shown in each
                    panel of the splitview.
                </li>
            </ul>
            <Common {...props} orientation={Orientation.HORIZONTAL} />
            <Common {...props} orientation={Orientation.VERTICAL} />
        </div>
    );
};

export const Common = (
    props: IDockviewPanelProps & { orientation: Orientation }
) => {
    const api = React.useRef<SplitviewApi>();

    const [dimensions, setDimensions] = React.useState<{
        height: number;
        width: number;
        maximumSize: number;
        minimumSize: number;
        visibility: boolean[];
        length: number;
    }>({
        height: undefined,
        width: undefined,
        maximumSize: undefined,
        minimumSize: undefined,
        visibility: [],
        length: undefined,
    });

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidDimensionsChange(
                (event: PanelDimensionChangeEvent) => {
                    switch (props.orientation) {
                        case Orientation.HORIZONTAL:
                            api.current.layout(500, 100);
                            break;
                        case Orientation.VERTICAL:
                            api.current.layout(100, 500);
                            break;
                    }

                    const height = api.current.height;
                    const width = api.current.width;
                    const maximumSize = api.current.maximumSize;
                    const minimumSize = api.current.minimumSize;
                    const length = api.current.length;

                    setDimensions({
                        height,
                        width,
                        maximumSize,
                        minimumSize,
                        length,
                        visibility: api.current
                            .getPanels()
                            .map((_) => _.api.isVisible),
                    });
                }
            ),
            api.current.onDidLayoutChange(() => {
                //
            })
        );
        return () => {
            disposable.dispose();
        };
    }, []);

    const onReady = (event: SplitviewReadyEvent) => {
        api.current = event.api;

        event.api.fromJSON({
            views: [
                {
                    data: {
                        id: 'one',
                        component: 'default',
                        minimumSize: 10,
                    },
                    size: 1,
                },
                {
                    data: {
                        id: 'two',
                        component: 'default',
                        minimumSize: 10,
                        maximumSize: 200,
                    },
                    size: 2,
                },
                {
                    data: {
                        id: 'three',
                        component: 'default',
                        minimumSize: 50,
                    },
                    size: 3,
                    snap: true,
                },
            ],
            size: 6,
            activeView: 'one',
            orientation: props.orientation,
        });
    };

    const toggleVisibility = (i: number) => () => {
        const panel = api.current.getPanels()[i];
        api.current.setVisible(panel, !panel.api.isVisible);
        setDimensions((dimensions) => ({
            ...dimensions,
            visibility: api.current.getPanels().map((_) => _.api.isVisible),
        }));
    };

    const move = () => {
        api.current.movePanel(api.current.getPanels().length - 1, 0);
        setDimensions((dimensions) => ({
            ...dimensions,
            visibility: api.current.getPanels().map((_) => _.api.isVisible),
        }));
    };

    const text = React.useMemo(() => {
        switch (props.orientation) {
            case Orientation.VERTICAL:
                return 'Vertical Splitview';
            case Orientation.HORIZONTAL:
                return 'Horizontal Splitview';
        }
    }, [props.orientation]);

    return (
        <div
            className={`splitview-demo-container ${props.orientation.toLowerCase()}`}
        >
            <h3>{text}</h3>
            <div className="splitview-demo-content">
                <div
                    style={{
                        backgroundColor: 'rgb(60,60,60)',
                        padding: '10px',
                        overflow: 'auto',
                    }}
                >
                    <div className="splitview-demo-view">
                        <SplitviewReact
                            orientation={props.orientation}
                            onReady={onReady}
                            components={components}
                        />
                    </div>
                </div>
                <div className="api-parameter">
                    <span>Height</span>
                    <span>{dimensions.height}</span>
                    <span>Width</span>
                    <span>{dimensions.width}</span>
                    <span>Lenght</span>
                    <span>{dimensions.length}</span>
                    <span>Min. size</span>
                    <span>{dimensions.minimumSize}</span>
                    <span>Max. size</span>
                    <span>{dimensions.maximumSize}</span>
                    <span>Visible</span>
                    <span style={{ display: 'flex' }}>
                        {dimensions.visibility.map((_, i) => {
                            return (
                                <div
                                    className="visibility-toggle"
                                    onClick={toggleVisibility(i)}
                                    key={i}
                                >
                                    {_ ? 'Yes' : 'No'}
                                </div>
                            );
                        })}
                    </span>
                    <span>Move view</span>
                    <span className="visibility-toggle" onClick={move}>
                        Go
                    </span>
                </div>
            </div>
        </div>
    );
};
