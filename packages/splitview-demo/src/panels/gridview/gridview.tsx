import {
    ActiveEvent,
    CompositeDisposable,
    FocusEvent,
    GridConstraintChangeEvent,
    GridviewApi,
    GridviewComponent,
    GridviewReadyEvent,
    IGridviewPanelProps,
    IGroupPanelProps,
    LayoutPriority,
    Orientation,
    orthogonal,
    PanelCollection,
    PanelConstraintChangeEvent,
    PanelDimensionChangeEvent,
    VisibilityEvent,
} from 'dockview';
import * as React from 'react';

const components: PanelCollection<IGridviewPanelProps> = {
    default: (props) => {
        const [active, setActive] = React.useState<boolean>(false);
        const [visible, setVisible] = React.useState<boolean>(false);
        const [focused, setFocused] = React.useState<boolean>(false);
        const [dimension, setDimension] = React.useState<{
            width: number;
            height: number;
        }>({ width: 0, height: 0 });
        const [constraints, setConstraints] = React.useState<
            GridConstraintChangeEvent
        >({
            minimumHeight: undefined,
            maximumHeight: undefined,
            minimumWidth: undefined,
            maximumWidth: undefined,
        });

        React.useEffect(() => {
            const disposable = new CompositeDisposable(
                props.api.onDidActiveChange((event: ActiveEvent) => {
                    setActive(event.isActive);
                }),
                props.api.onDidConstraintsChange(
                    (event: GridConstraintChangeEvent) => {
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
            () =>
                `rgb(${Math.floor(256 * Math.random())},${Math.floor(
                    256 * Math.random()
                )},${Math.floor(256 * Math.random())})`,
            []
        );

        return (
            <div
                style={{
                    backgroundColor: color,
                }}
                className="splitview-demo-panel"
            >
                <div className="api-parameter">
                    <span>Width</span>
                    <span>{dimension.width}</span>
                    <span>Height</span>
                    <span>{dimension.height}</span>
                    <span>Min. height</span>
                    <span>{constraints.minimumHeight}</span>
                    <span>Max. height</span>
                    <span>{constraints.maximumHeight}</span>
                    <span>Min. width</span>
                    <span>{constraints.minimumWidth}</span>
                    <span>Max. width</span>
                    <span>{constraints.maximumWidth}</span>
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

export const GridviewDemoPanel = (props: IGroupPanelProps) => {
    return (
        <div
            style={{
                overflow: 'auto',
                height: '100%',
                padding: '10px 0px',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ padding: '0px 20px' }}>
                <h1>Gridview</h1>
            </div>
            <ul style={{ padding: '0px 20px 0px 40px' }}>
                <li>
                    The gridview is a collection of nested splitviews which
                    forms a grid-based layout
                </li>
            </ul>
            <GridviewDemo {...props} />
        </div>
    );
};

export const GridviewDemo = (props: IGroupPanelProps) => {
    const api = React.useRef<GridviewApi>();

    const [orientation, setOrientation] = React.useState<Orientation>(
        Orientation.VERTICAL
    );

    const onClick = () => {
        api.current.orientation = orthogonal(api.current.orientation);
        // load();
    };

    const load = () => {
        api.current.fromJSON({
            activePanel: '1',
            grid: {
                height: 3,
                width: 2,
                orientation: orientation,
                root: {
                    type: 'branch',
                    size: 3,
                    data: [
                        {
                            type: 'branch',
                            size: 1,
                            data: [
                                {
                                    type: 'leaf',
                                    size: 1,
                                    data: {
                                        id: '1',
                                        component: 'default',
                                        minimumHeight: 50,
                                        maximumHeight: Number.POSITIVE_INFINITY,
                                        minimumWidth: 50,
                                        maximumWidth: Number.POSITIVE_INFINITY,
                                        snap: false,
                                        priority: LayoutPriority.Normal,
                                    },
                                },
                                {
                                    type: 'branch',
                                    size: 1,
                                    data: [
                                        {
                                            type: 'leaf',
                                            size: 0.5,
                                            data: {
                                                id: '2',
                                                component: 'default',
                                                minimumHeight: 50,
                                                maximumHeight:
                                                    Number.POSITIVE_INFINITY,
                                                minimumWidth: 50,
                                                maximumWidth:
                                                    Number.POSITIVE_INFINITY,
                                                snap: false,
                                                priority: LayoutPriority.Normal,
                                            },
                                        },
                                        {
                                            type: 'branch',
                                            size: 0.5,
                                            data: [
                                                {
                                                    type: 'leaf',
                                                    size: 0.5,
                                                    data: {
                                                        id: '2',
                                                        component: 'default',
                                                        minimumHeight: 50,
                                                        maximumHeight:
                                                            Number.POSITIVE_INFINITY,
                                                        minimumWidth: 50,
                                                        maximumWidth:
                                                            Number.POSITIVE_INFINITY,
                                                        snap: false,
                                                        priority:
                                                            LayoutPriority.Normal,
                                                    },
                                                },
                                                {
                                                    type: 'leaf',
                                                    size: 0.5,
                                                    data: {
                                                        id: '3',
                                                        component: 'default',
                                                        minimumHeight: 50,
                                                        maximumHeight:
                                                            Number.POSITIVE_INFINITY,
                                                        minimumWidth: 50,
                                                        maximumWidth:
                                                            Number.POSITIVE_INFINITY,
                                                        snap: false,
                                                        priority:
                                                            LayoutPriority.Normal,
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'leaf',
                            size: 1,
                            data: {
                                id: '4',
                                component: 'default',
                                minimumHeight: 50,
                                maximumHeight: Number.POSITIVE_INFINITY,
                                minimumWidth: 50,
                                maximumWidth: Number.POSITIVE_INFINITY,
                                snap: false,
                                priority: LayoutPriority.Normal,
                            },
                        },
                        {
                            type: 'branch',
                            size: 1,
                            data: [
                                {
                                    type: 'leaf',
                                    size: 1,
                                    data: {
                                        id: '3',
                                        component: 'default',
                                        minimumHeight: 50,
                                        maximumHeight: Number.POSITIVE_INFINITY,
                                        minimumWidth: 50,
                                        maximumWidth: Number.POSITIVE_INFINITY,
                                        snap: false,
                                        priority: LayoutPriority.Normal,
                                    },
                                },
                                {
                                    type: 'leaf',
                                    size: 1,
                                    data: {
                                        id: '4',
                                        component: 'default',
                                        minimumHeight: 50,
                                        maximumHeight: Number.POSITIVE_INFINITY,
                                        minimumWidth: 50,
                                        maximumWidth: Number.POSITIVE_INFINITY,
                                        snap: false,
                                        priority: LayoutPriority.Normal,
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        });
    };

    const onReady = (event: GridviewReadyEvent) => {
        api.current = event.api;
        api.current?.layout(props.api.width - 80, 600);

        load();
    };

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidDimensionsChange((event) => {
                api.current?.layout(event.width - 80, 600);
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <button onClick={onClick}>Flip</button>
            <div
                style={{
                    height: '400px',
                    margin: '40px',
                    backgroundColor: 'grey',
                }}
            >
                <GridviewComponent
                    proportionalLayout={true}
                    components={components}
                    orientation={Orientation.VERTICAL}
                    onReady={onReady}
                />
            </div>
        </div>
    );
};
