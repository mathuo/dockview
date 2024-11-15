import {
    DockviewGroupLocation,
    DockviewPanelApi,
    DockviewPanelRenderer,
} from 'dockview';
import * as React from 'react';

export interface PanelApiMetadata {
    isActive: {
        value: boolean;
        count: number;
    };
    isVisible: {
        value: boolean;
        count: number;
    };
    renderer: {
        value: DockviewPanelRenderer;
        count: number;
    };
    isGroupActive: {
        value: boolean;
        count: number;
    };
    groupChanged: {
        count: number;
    };
    location: {
        value: DockviewGroupLocation;
        count: number;
    };
    didFocus: {
        count: number;
    };
    dimensions: {
        count: number;
        value: { height: number; width: number };
    };
}

export const Table = (props: { data: PanelApiMetadata }) => {
    return (
        <div className="data-table">
            <table>
                <tr>
                    <th>{'Key'}</th>
                    <th>{'Count'}</th>
                    <th>{'Value'}</th>
                </tr>
                {Object.entries(props.data).map(([key, value]) => {
                    return (
                        <tr key={key}>
                            <th>{key}</th>
                            <th>{value.count}</th>
                            <th>{JSON.stringify(value.value, null, 4)}</th>
                        </tr>
                    );
                })}
            </table>
        </div>
    );
};

export function usePanelApiMetadata(api: DockviewPanelApi): PanelApiMetadata {
    const [state, setState] = React.useState<PanelApiMetadata>({
        isActive: { value: api.isActive, count: 0 },
        isVisible: { value: api.isVisible, count: 0 },
        renderer: { value: api.renderer, count: 0 },
        isGroupActive: { value: api.isGroupActive, count: 0 },
        groupChanged: { count: 0 },
        location: { value: api.location, count: 0 },
        didFocus: { count: 0 },
        dimensions: {
            count: 0,
            value: { height: api.height, width: api.width },
        },
    });

    React.useEffect(() => {
        const d1 = api.onDidActiveChange((event) => {
            setState((_) => ({
                ..._,
                isActive: {
                    value: event.isActive,
                    count: _.isActive.count + 1,
                },
            }));
        });
        const d2 = api.onDidActiveGroupChange((event) => {
            setState((_) => ({
                ..._,
                isGroupActive: {
                    value: event.isActive,
                    count: _.isGroupActive.count + 1,
                },
            }));
        });
        const d3 = api.onDidDimensionsChange((event) => {
            setState((_) => ({
                ..._,
                dimensions: {
                    count: _.dimensions.count + 1,
                    value: { height: event.height, width: event.width },
                },
            }));
        });
        const d4 = api.onDidFocusChange((event) => {
            setState((_) => ({
                ..._,
                didFocus: {
                    count: _.didFocus.count + 1,
                },
            }));
        });
        const d5 = api.onDidGroupChange((event) => {
            setState((_) => ({
                ..._,
                groupChanged: {
                    count: _.groupChanged.count + 1,
                },
            }));
        });
        const d7 = api.onDidLocationChange((event) => {
            setState((_) => ({
                ..._,
                location: {
                    value: event.location,
                    count: _.location.count + 1,
                },
            }));
        });
        const d8 = api.onDidRendererChange((event) => {
            setState((_) => ({
                ..._,
                renderer: {
                    value: event.renderer,
                    count: _.renderer.count + 1,
                },
            }));
        });
        const d9 = api.onDidVisibilityChange((event) => {
            setState((_) => ({
                ..._,
                isVisible: {
                    value: event.isVisible,
                    count: _.isVisible.count + 1,
                },
            }));
        });

        return () => {
            d1.dispose();
            d2.dispose();
            d3.dispose();
            d4.dispose();
            d5.dispose();
            d7.dispose();
            d8.dispose();
            d9.dispose();
        };
    }, [api]);

    return state;
}
