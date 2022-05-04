import {
    GridviewReact,
    Orientation,
    GridviewReadyEvent,
    DockviewReact,
    DockviewReadyEvent,
} from 'dockview';

const components = {
    default: () => {
        return <div>hello world</div>;
    },
    docking: () => {
        return <Test2 />;
    },
};

export const Test = () => {
    const onReady = (event: GridviewReadyEvent) => {
        event.api.addPanel({
            component: 'default',
            id: 'view_1',
        });

        event.api.addPanel({
            component: 'default',
            id: 'view_2',
        });

        event.api.addPanel({
            component: 'docking',
            id: 'view_3',
        });
    };

    return (
        <GridviewReact
            components={components}
            orientation={Orientation.HORIZONTAL}
            onReady={onReady}
            className="dockview-theme-dark"
        />
    );
};

const components2 = {
    default: () => {
        return <div>hello world</div>;
    },
};

export const Test2 = () => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            component: 'default',
            id: 'view_1',
        });

        event.api.addPanel({
            component: 'default',
            id: 'view_2',
        });

        event.api.addPanel({
            component: 'default',
            id: 'view_3',
        });
    };

    return (
        // <div style={{ height: '100%', width: '100%' }}>
        <DockviewReact
            components={components2}
            onReady={onReady}
            className="dockview-theme-dark"
        />
        // </div>
    );
};
