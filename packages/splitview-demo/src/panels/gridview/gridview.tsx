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
    const api = React.useRef<GridviewApi>();

    const onReady = (event: GridviewReadyEvent) => {
        api.current = event.api;

        event.api.fromJSON({
            activePanel: '1',
            grid: {
                height: 10,
                width: 10,
                orientation: Orientation.VERTICAL,
                root: {
                    type: 'branch',
                    size: 10,
                    data: [
                        {
                            type: 'leaf',
                            size: 2,
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
                            type: 'leaf',
                            size: 3,
                            data: {
                                id: '2',
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
                            size: 5,
                            data: [
                                {
                                    type: 'leaf',
                                    size: 2,
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
                                    size: 2,
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

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidDimensionsChange((event) => {
                api.current?.layout(event.width - 80, 400);
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <div
                style={{
                    height: '400px',
                    margin: '40px',
                    backgroundColor: 'grey',
                }}
            >
                <GridviewComponent
                    components={components}
                    orientation={Orientation.VERTICAL}
                    onReady={onReady}
                />
            </div>
        </div>
    );
};
