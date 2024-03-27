import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    GridConstraintChangeEvent,
    IDockviewPanelProps,
} from 'dockview';
import React from 'react';

const components = {
    default: (props: IDockviewPanelProps) => {
        const [contraints, setContraints] =
            React.useState<GridConstraintChangeEvent | null>(null);

        React.useEffect(() => {
            props.api.group.api.onDidConstraintsChange((event) => {
                setContraints(event);
            });
        }, []);

        const onClick = () => {
            props.api.group.api.setConstraints({
                maximumWidth: 300,
                maximumHeight: 300,
            });
        };

        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                    color: 'white',
                }}
            >
                <button onClick={onClick}>Set</button>
                {contraints && (
                    <div style={{ fontSize: '13px' }}>
                        {typeof contraints.maximumHeight === 'number' && (
                            <div
                                style={{
                                    border: '1px solid grey',
                                    margin: '2px',
                                    padding: '1px',
                                }}
                            >
                                <span
                                    style={{ color: 'grey' }}
                                >{`Maximum Height: `}</span>
                                <span>{`${contraints.maximumHeight}px`}</span>
                            </div>
                        )}
                        {typeof contraints.minimumHeight === 'number' && (
                            <div
                                style={{
                                    border: '1px solid grey',
                                    margin: '2px',
                                    padding: '1px',
                                }}
                            >
                                <span
                                    style={{ color: 'grey' }}
                                >{`Minimum Height: `}</span>
                                <span>{`${contraints.minimumHeight}px`}</span>
                            </div>
                        )}
                        {typeof contraints.maximumWidth === 'number' && (
                            <div
                                style={{
                                    border: '1px solid grey',
                                    margin: '2px',
                                    padding: '1px',
                                }}
                            >
                                <span
                                    style={{ color: 'grey' }}
                                >{`Maximum Width: `}</span>
                                <span>{`${contraints.maximumWidth}px`}</span>
                            </div>
                        )}
                        {typeof contraints.minimumWidth === 'number' && (
                            <div
                                style={{
                                    border: '1px solid grey',
                                    margin: '2px',
                                    padding: '1px',
                                }}
                            >
                                <span
                                    style={{ color: 'grey' }}
                                >{`Minimum Width: `}</span>
                                <span>{`${contraints.minimumWidth}px`}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    },
};

const App = (props: { theme?: string }) => {
    const [api, setApi] = React.useState<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        const panel1 = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        const panel2 = event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            position: {
                referencePanel: panel1,
                direction: 'right',
            },
        });

        const panel3 = event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: {
                referencePanel: panel2,
                direction: 'right',
            },
        });

        const panel4 = event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            position: {
                direction: 'below',
            },
        });
    };

    return (
        <DockviewReact
            onReady={onReady}
            components={components}
            className={`${props.theme || 'dockview-theme-abyss'}`}
        />
    );
};

export default App;
