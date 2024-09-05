import { DockviewApi } from 'dockview';
import * as React from 'react';
import { nextId } from './defaultLayout';

export const PanelBuilder = (props: { api: DockviewApi; done: () => void }) => {
    const [parameters, setParameters] = React.useState<{
        initialWidth?: number;
        initialHeight?: number;
        maximumHeight?: number;
        maximumWidth?: number;
        minimumHeight?: number;
        minimumWidth?: number;
    }>({});
    return (
        <div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                }}
            >
                <div>{'Initial Width'}</div>
                <input
                    type="number"
                    value={parameters.initialWidth}
                    onChange={(event) =>
                        setParameters((_) => ({
                            ..._,
                            initialWidth: Number(event.target.value),
                        }))
                    }
                />
                <div>{'Initial Height'}</div>
                <input
                    type="number"
                    value={parameters.initialHeight}
                    onChange={(event) =>
                        setParameters((_) => ({
                            ..._,
                            initialHeight: Number(event.target.value),
                        }))
                    }
                />
                <div>{'Maximum Width'}</div>
                <input
                    type="number"
                    value={parameters.maximumWidth}
                    onChange={(event) =>
                        setParameters((_) => ({
                            ..._,
                            maximumWidth: Number(event.target.value),
                        }))
                    }
                />
                <div>{'Maximum Height'}</div>
                <input
                    type="number"
                    value={parameters.maximumHeight}
                    onChange={(event) =>
                        setParameters((_) => ({
                            ..._,
                            maximumHeight: Number(event.target.value),
                        }))
                    }
                />
                <div>{'Minimum Width'}</div>
                <input
                    type="number"
                    value={parameters.minimumWidth}
                    onChange={(event) =>
                        setParameters((_) => ({
                            ..._,
                            minimumWidth: Number(event.target.value),
                        }))
                    }
                />
                <div>{'Minimum Height'}</div>
                <input
                    type="number"
                    value={parameters.minimumHeight}
                    onChange={(event) =>
                        setParameters((_) => ({
                            ..._,
                            minimumHeight: Number(event.target.value),
                        }))
                    }
                />
            </div>
            <div>
                <button
                    onClick={() => {
                        props.done();
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        props.api?.addPanel({
                            id: `id_${Date.now().toString()}`,
                            component: 'default',
                            title: `Tab ${nextId()}`,
                            renderer: 'always',
                            ...parameters,
                        });

                        props.done();
                    }}
                >
                    Go
                </button>
            </div>
        </div>
    );
};
