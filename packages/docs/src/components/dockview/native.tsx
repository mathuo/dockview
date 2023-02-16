import {
    CanDisplayOverlay,
    Droptarget,
    DropTargetDirections,
} from '@site/../dockview/dist/cjs/dnd/droptarget';
import {
    DockviewDndOverlayEvent,
    DockviewDropEvent,
    DockviewReact,
    DockviewReadyEvent,
    GridviewReact,
    GridviewReadyEvent,
    IDockviewPanelProps,
    IGridviewPanelProps,
    Position,
    Direction,
    IDockviewPanelHeaderProps,
} from 'dockview';
import * as React from 'react';
import './native.scss';

class CustomDndTraget {
    private data: any;

    static SINGLETON = new CustomDndTraget();

    setData<T>(t: T): void {
        this.data = t;
    }

    getData<T>(): T {
        return this.data;
    }

    clearData(): void {
        this.data = null;
    }
}

type CustomDescriptor = {
    type: 'CUSTOM';
    id: string;
};

function isCustomDescriptor(obj: any): obj is CustomDescriptor {
    return (
        typeof obj === 'object' && (obj as CustomDescriptor).type === 'CUSTOM'
    );
}

function convertPositionToDirection(position: Position): Direction {
    switch (position) {
        case Position.Left:
            return 'left';

        case Position.Right:
            return 'right';

        case Position.Bottom:
            return 'below';

        case Position.Top:
            return 'above';

        case Position.Center:
            return 'within';
    }
}

const components = {
    default: (props: IDockviewPanelProps<{ title: string; x?: number }>) => {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    height: '100%',
                }}
            >
                <span>{`${props.params.title}`}</span>
                {props.params.x && <span>{`  ${props.params.x}`}</span>}
            </div>
        );
    },
    isolatedApp: (
        props: IDockviewPanelProps<{ title: string; x?: number }>
    ) => {
        const onReady = (event: DockviewReadyEvent) => {
            const panel1 = event.api.addPanel({
                id: 'panel_1',
                component: 'default',
                params: {
                    title: 'Tab 1',
                },
            });
            const panel2 = event.api.addPanel({
                id: 'panel_2',
                component: 'default',
                params: {
                    title: 'Tab 2',
                },
            });
            const panel3 = event.api.addPanel({
                id: 'panel_3',
                component: 'default',
                params: {
                    title: 'Tab 3',
                },
            });
        };
        return (
            <DockviewReact
                onReady={onReady}
                components={components}
                tabComponents={tabComponents}
                className="dockview-theme-abyss"
            />
        );
    },
};

const tabComponents = {
    default: (props: IDockviewPanelHeaderProps<{ title: string }>) => {
        return (
            <div className="my-custom-tab">
                <span>{props.params.title}</span>
                <span style={{ flexGrow: 1 }} />

                <span className="my-custom-tab-icon material-symbols-outlined">
                    chrome_minimize
                </span>
                <span className="my-custom-tab-icon material-symbols-outlined">
                    chrome_maximize
                </span>
                <span className="my-custom-tab-icon material-symbols-outlined">
                    close
                </span>
            </div>
        );
    },
};

export const DockviewNative = () => {
    const onReady = (event: DockviewReadyEvent) => {
        const panel1 = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Window 1',
            },
        });
        panel1.group.locked = true;

        const panel2 = event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Window 2',
            },
            position: {
                direction: 'right',
            },
        });
        panel2.group.locked = true;

        const panel3 = event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Window 3',
            },
            position: {
                direction: 'below',
            },
        });
        panel3.group.locked = true;
    };

    return (
        <div
            style={{
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <DockviewReact
                onReady={onReady}
                components={components}
                tabComponents={tabComponents}
                className="dockview-theme-abyss"
                singleTabMode="fullwidth"
            />
        </div>
    );
};

export const DockviewNative2 = () => {
    const onReady = (event: DockviewReadyEvent) => {
        const panel1 = event.api.addPanel({
            id: 'panel_1',
            component: 'isolatedApp',
            tabComponent: 'default',
            params: {
                title: 'Window 1',
            },
        });
        panel1.group.locked = true;

        const panel2 = event.api.addPanel({
            id: 'panel_2',
            component: 'isolatedApp',
            tabComponent: 'default',
            params: {
                title: 'Window 2',
            },
            position: {
                direction: 'right',
            },
        });
        panel2.group.locked = true;

        const panel3 = event.api.addPanel({
            id: 'panel_3',
            component: 'isolatedApp',
            tabComponent: 'default',
            params: {
                title: 'Window 3',
            },
            position: {
                direction: 'below',
            },
        });
        panel3.group.locked = true;
    };

    return (
        <div
            style={{
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <DockviewReact
                onReady={onReady}
                components={components}
                tabComponents={tabComponents}
                className="dockview-theme-abyss"
                singleTabMode="fullwidth"
            />
        </div>
    );
};
