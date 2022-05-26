import {
    ISplitviewPanel,
    ISplitviewPanelProps,
    Orientation,
    SplitviewReact,
    SplitviewReadyEvent,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: ISplitviewPanelProps<{ title: string }>) => {
        const [active, setActive] = React.useState<boolean>(props.api.isActive);
        const [visible, setVisible] = React.useState<boolean>(
            props.api.isVisible
        );
        const [focused, setFocused] = React.useState<boolean>(
            props.api.isFocused
        );
        const [dimensions, setDimensions] = React.useState<{
            height: number;
            width: number;
        }>({
            height: props.api.height,
            width: props.api.width,
        });

        React.useEffect(() => {
            const disposable1 = props.api.onDidActiveChange((event) =>
                setActive(event.isActive)
            );
            const disposable2 = props.api.onDidVisibilityChange((event) =>
                setVisible(event.isVisible)
            );
            const disposable3 = props.api.onDidFocusChange((event) =>
                setFocused(event.isFocused)
            );
            const disposable4 = props.api.onDidDimensionsChange((event) => {
                setDimensions({ height: event.height, width: event.width });
            });

            return () => {
                disposable1.dispose();
                disposable2.dispose();
                disposable3.dispose();
                disposable4.dispose();
            };
        }, []);

        return (
            <div
                style={{
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: '100px 100px',
                    lineHeight: '20px',
                    gridTemplateRows: 'repeat(6, 20px)',
                }}
            >
                <span>{'Panel ID: '}</span>
                <span>{props.api.id}</span>
                <span>{'Height: '}</span>
                <span>{`${dimensions.height}px`}</span>
                <span>{'Width: '}</span>
                <span>{`${dimensions.width}px`}</span>
                <span>{'Focused: '}</span>
                <span style={{ color: focused ? 'green' : 'red' }}>{`${
                    focused ? 'True' : 'False'
                }`}</span>

                <span>{'Active: '}</span>
                <span style={{ color: active ? 'green' : 'red' }}>{`${
                    active ? 'True' : 'False'
                }`}</span>

                <span>{'Visible: '}</span>
                <span style={{ color: visible ? 'green' : 'red' }}>{`${
                    visible ? 'True' : 'False'
                }`}</span>
            </div>
        );
    },
};

export const SplitviewExample1 = (props: { proportional?: boolean }) => {
    const [panels, setPanels] = React.useState<ISplitviewPanel[]>([]);

    const onReady = React.useCallback((event: SplitviewReadyEvent) => {
        event.api.onDidAddView((panel) => setPanels(event.api.panels));
        event.api.onDidRemoveView((panel) => setPanels(event.api.panels));

        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
            minimumSize: 100,
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
            minimumSize: 100,
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
            minimumSize: 100,
        });
    }, []);

    return (
        <>
            <div
                style={{
                    height: '150px',
                    backgroundColor: 'rgb(30,30,30)',
                    color: 'white',
                }}
            >
                <SplitviewReact
                    components={components}
                    proportionalLayout={props.proportional}
                    onReady={onReady}
                    orientation={Orientation.HORIZONTAL}
                    className="dockview-theme-dark"
                />
            </div>
            <div style={{ height: '20px', display: 'flex' }}>
                {panels.map((panel) => {
                    return (
                        <div style={{ padding: '0px 20px' }}>
                            <div>{panel.id}</div>
                            <div>
                                <button
                                    onClick={() =>
                                        panel.api.setVisible(
                                            !panel.api.isVisible
                                        )
                                    }
                                >
                                    Toggle Visiblity
                                </button>
                                <button onClick={() => panel.api.setActive()}>
                                    Set Active
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
