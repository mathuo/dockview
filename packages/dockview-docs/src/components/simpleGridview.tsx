import {
    IGridviewPanelProps,
    Orientation,
    GridviewReact,
    GridviewReadyEvent,
} from 'dockview';

const components = {
    default: (props: IGridviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
};

export const SimpleGridview = () => {
    const onReady = (event: GridviewReadyEvent) => {
        event.api.addPanel({
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
            position: { reference: 'panel_1', direction: 'right' },
        });

        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            params: {
                title: 'Panel 5',
            },
            position: { reference: 'panel_3', direction: 'right' },
        });

        event.api.addPanel({
            id: 'panel_6',
            component: 'default',
            params: {
                title: 'Panel 6',
            },
            position: { reference: 'panel_5', direction: 'below' },
        });

        event.api.addPanel({
            id: 'panel_7',
            component: 'default',
            params: {
                title: 'Panel 7',
            },
            position: { reference: 'panel_6', direction: 'right' },
        });
    };

    return (
        <GridviewReact
            components={components}
            onReady={onReady}
            orientation={Orientation.VERTICAL}
            className="dockview-theme-dark"
        />
    );
};
