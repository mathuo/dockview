import {
    GridviewApi,
    GridviewReact,
    GridviewReadyEvent,
    IGridviewPanelProps,
    LayoutPriority,
    Orientation,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IGridviewPanelProps<{ title: string }>) => {
        return (
            <div style={{ padding: '20px', color: 'white' }}>
                {props.params.title}
            </div>
        );
    },
};

export const App: React.FC = (props: { theme?: string }) => {
    const [api, setApi] = React.useState<GridviewApi>();

    const onReady = (event: GridviewReadyEvent) => {
        const panel1 = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
            priority: LayoutPriority.High,
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
        });

        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            params: {
                title: 'Panel 4',
            },

            position: { referencePanel: 'panel_2', direction: 'right' },
        });

        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            params: {
                title: 'Panel 5',
            },

            position: { referencePanel: 'panel_3', direction: 'right' },
        });

        event.api.addPanel({
            id: 'panel_6',
            component: 'default',
            params: {
                title: 'Panel 6',
            },
            position: { referencePanel: 'panel_5', direction: 'below' },
            minimumWidth: 10,
        });

        event.api.addPanel({
            id: 'panel_7',
            component: 'default',
            params: {
                title: 'Panel 7',
            },
            position: { referencePanel: 'panel_6', direction: 'right' },
            minimumWidth: 10,
        });

        event.api.addPanel({
            id: 'panel_8',
            component: 'default',
            params: {
                title: 'Panel 8',
            },
            position: { referencePanel: 'panel_6', direction: 'right' },
            minimumWidth: 10,
        });

        setApi(event.api);
    };

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div>
                <button
                    onClick={() => {
                        if (!api) {
                            return;
                        }

                        const panel = api.getPanel('panel_3');

                        if (!panel) {
                            return;
                        }

                        // panel.api.setVisible(!panel.api.isVisible);

                        if (panel.height === 0) {
                            panel.api.setSize({ height: 200 });
                        } else {
                            panel.api.setSize({ height: 0 });
                        }
                    }}
                >
                    Resize
                </button>
            </div>
            <div style={{ flexGrow: 1 }}>
                <GridviewReact
                    components={components}
                    onReady={onReady}
                    // proportionalLayout={false}
                    orientation={Orientation.VERTICAL}
                    className={props.theme || 'dockview-theme-abyss'}
                />
            </div>
        </div>
    );
};

export default App;
