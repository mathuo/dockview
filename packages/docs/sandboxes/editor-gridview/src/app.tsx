import {
    GridviewApi,
    GridviewReact,
    GridviewReadyEvent,
    IGridviewPanelProps,
    LayoutPriority,
    Orientation,
    SerializedGridviewComponent,
} from 'dockview';
import * as React from 'react';
import './app.scss';

const components = {
    default: (props: IGridviewPanelProps<{ title: string }>) => {
        return (
            <div style={{ padding: '20px', color: 'white' }}>
                {props.params.title}
            </div>
        );
    },
    header: (props: IGridviewPanelProps) => {
        return (
            <div style={{ backgroundColor: '#3C3C3C', height: '100%' }}></div>
        );
    },
    footer: (props: IGridviewPanelProps) => {
        return (
            <div style={{ backgroundColor: '#007ACC', height: '100%' }}></div>
        );
    },
    sidebar: (props: IGridviewPanelProps) => {
        return (
            <div style={{ backgroundColor: '#333333', height: '100%' }}></div>
        );
    },
    'left-expander': (props: IGridviewPanelProps) => {
        return (
            <div style={{ backgroundColor: '#252526', height: '100%' }}></div>
        );
    },
    'right-expander': (props: IGridviewPanelProps) => {
        return (
            <div style={{ backgroundColor: '#252526', height: '100%' }}></div>
        );
    },
    main: (props: IGridviewPanelProps) => {
        return (
            <div
                style={{
                    backgroundColor: '#1E1E1E',
                    height: '100%',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    fontSize: '0.8em',
                    padding: '10px',
                }}
            >
                <div>{'This entire mockup is built using a gridview.'}</div>

                <div>{`Press 'Ctrl+B' to toggle the left sidebar and 'Ctrl+Alt+B' to toggle the right sidebar or manually resize them.`}</div>
            </div>
        );
    },
};

const serializedGridview: SerializedGridviewComponent = {
    grid: {
        root: {
            type: 'branch',
            data: [
                {
                    type: 'leaf',
                    data: {
                        id: 'header-id',
                        component: 'header',
                        minimumHeight: 30,
                        maximumHeight: 30,
                    },
                },
                {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                id: 'sidebar-id',
                                component: 'sidebar',
                                minimumWidth: 30,
                                maximumWidth: 30,
                            },
                        },
                        {
                            type: 'leaf',
                            data: {
                                id: 'left-expander-id',
                                component: 'left-expander',
                                minimumWidth: 100,
                                snap: true,
                            },
                        },
                        {
                            type: 'leaf',
                            size: 100,
                            data: {
                                id: 'main-id',
                                component: 'main',
                                minimumWidth: 100,
                                minimumHeight: 100,
                                /**
                                 * it's important to give the main content a high layout priority as we want
                                 * the main layout to have priority when allocating new space
                                 */
                                priority: LayoutPriority.High,
                            },
                        },
                        {
                            type: 'leaf',
                            data: {
                                id: 'right-expander-id',
                                component: 'right-expander',
                                snap: true,
                                minimumWidth: 100,
                            },
                        },
                    ],
                },
                {
                    type: 'leaf',
                    data: {
                        id: 'footer-id',
                        component: 'footer',
                        minimumHeight: 30,
                        maximumHeight: 30,
                    },
                },
            ],
        },
        width: 1000,
        height: 1000,
        orientation: Orientation.VERTICAL,
    },
};

export const App: React.FC = (props: { theme?: string }) => {
    const [api, setApi] = React.useState<GridviewApi>();

    const onReady = (event: GridviewReadyEvent) => {
        event.api.fromJSON(serializedGridview);

        setApi(event.api);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (!api) {
            return;
        }

        console.log(event);

        const leftExpander = api.getPanel('left-expander-id');
        const rightExpander = api.getPanel('right-expander-id');

        if (!leftExpander || !rightExpander) {
            return;
        }

        switch (event.key) {
            case 'b':
                if (event.ctrlKey) {
                    if (event.altKey) {
                        // toggle right
                        rightExpander.api.setVisible(
                            !rightExpander.api.isVisible
                        );
                        if (rightExpander.api.width === 0) {
                            rightExpander.api.setSize({ width: 150 });
                        }
                    } else {
                        // toggle left
                        leftExpander.api.setVisible(
                            !leftExpander.api.isVisible
                        );
                        if (leftExpander.api.width === 0) {
                            leftExpander.api.setSize({ width: 150 });
                        }
                    }
                }
        }
    };

    return (
        <div
            tabIndex={-1}
            className="simple-gridview-example"
            onKeyDown={onKeyDown}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div style={{ flexGrow: 1 }}>
                <GridviewReact
                    components={components}
                    onReady={onReady}
                    hideBorders={true}
                    orientation={Orientation.VERTICAL}
                    className={props.theme || 'dockview-theme-abyss'}
                />
            </div>
        </div>
    );
};

export default App;
