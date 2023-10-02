import {
    GridviewReact,
    GridviewReadyEvent,
    IGridviewPanelProps,
    GridviewComponent,
    Orientation,
    GridviewApi,
    LayoutPriority,
} from 'dockview';
import * as React from 'react';

const components = {
    'left-sidebar': (props: IGridviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
    'middle-content': (props: IGridviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
    'right-sidebar': (props: IGridviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
};

const App = (props: { theme?: string }) => {
    const [api, setApi] = React.useState<GridviewApi>();

    const onReady = (event: GridviewReadyEvent) => {
        event.api.fromJSON({
            grid: {
                height: 1000,
                width: 1000,
                orientation: Orientation.HORIZONTAL,
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                id: 'left-sidebar-id',
                                component: 'left-sidebar',
                                snap: true,
                                minimumWidth: 100,
                            },
                            size: 200,
                        },
                        {
                            type: 'leaf',
                            data: {
                                id: 'middle-content-id',
                                component: 'middle-content',
                                priority: LayoutPriority.High,
                                minimumWidth: 100,
                            },
                            size: 600,
                        },
                        {
                            type: 'leaf',
                            data: {
                                id: 'right-sidebar-id',
                                component: 'right-sidebar',
                                snap: true,
                                minimumWidth: 100,
                            },
                            size: 200,
                        },
                    ],
                },
            },
        });

        setApi(event.api);
    };

    const onKeyPress = (event: React.KeyboardEvent) => {
        if (!api) {
            return;
        }

        if (event.ctrlKey) {
            if (event.code === 'ArrowLeft') {
                const leftSidebarPanel = api.getPanel('left-sidebar-id');

                if (leftSidebarPanel) {
                    leftSidebarPanel.api.setVisible(false);
                }
            }
        }

        if (event.code === 'ArrowRight') {
            const leftSidebarPanel = api.getPanel('left-sidebar-id');

            if (leftSidebarPanel) {
                leftSidebarPanel.api.setVisible(true);
            }
        }
    };

    return (
        <div
            tabIndex={-1}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            onKeyDown={onKeyPress}
        >
            <div>
                {'Use '}
                <span>{'Ctrl+ArrowLeft'}</span>
                {' and '}
                <span>{'Ctrl+ArrowRight'}</span>
                {
                    ' to show and hide the left sidebar. The right sidebar can be hidden by dragging it to the right.'
                }
            </div>
            <div style={{ flexGrow: 1 }}>
                <GridviewReact
                    onReady={onReady}
                    components={components}
                    className={`${props.theme || 'dockview-theme-abyss'}`}
                />
            </div>
        </div>
    );
};

export default App;
