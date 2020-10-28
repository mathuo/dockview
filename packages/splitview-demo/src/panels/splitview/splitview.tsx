import {
    CompositeDisposable,
    IGroupPanelProps,
    ISplitviewPanelProps,
    Orientation,
    SplitviewApi,
    SplitviewComponent,
    SplitviewReadyEvent,
    PanelDimensionChangeEvent,
    ActiveEvent,
    FocusEvent,
    VisibilityEvent,
    PanelConstraintChangeEvent,
} from 'dockview';
import * as React from 'react';
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

export const SplitviewPanel = (props: IGroupPanelProps) => {
    const api = React.useRef<SplitviewApi>();

    const [dimensions, setDimensions] = React.useState<{
        height: number;
        width: number;
        maximumSize: number;
        minimumSize: number;
        visibility: boolean[];
    }>({ height: 0, width: 0, maximumSize: 0, minimumSize: 0, visibility: [] });

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidDimensionsChange(
                (event: PanelDimensionChangeEvent) => {
                    api.current.layout(event.width - 80, 100);

                    const height = api.current.height;
                    const width = api.current.width;
                    const maximumSize = api.current.maximumSize;
                    const minimumSize = api.current.minimumSize;
                    setDimensions({
                        height,
                        width,
                        maximumSize,
                        minimumSize,
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
                    },
                    size: 1,
                    minimumSize: 10,
                },
                {
                    data: {
                        id: 'two',
                        component: 'default',
                    },
                    size: 2,
                    minimumSize: 10,
                    maximumSize: 200,
                },
                {
                    data: {
                        id: 'three',
                        component: 'default',
                    },
                    size: 3,
                    minimumSize: 10,
                },
            ],
            size: 6,
            activeView: 'one',
            orientation: Orientation.HORIZONTAL,
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

    return (
        <div className="splitview-demo">
            <div style={{ height: '150px', padding: '40px' }}>
                <SplitviewComponent
                    orientation={Orientation.HORIZONTAL}
                    onReady={onReady}
                    components={components}
                />
                <div style={{ marginTop: '10px' }} className="api-parameter">
                    <span>Height</span>
                    <span>{dimensions.height}</span>
                    <span>Width</span>
                    <span>{dimensions.width}</span>
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
