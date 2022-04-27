import {
    IPaneviewPanelProps,
    PaneviewReact,
    PaneviewReadyEvent,
} from 'dockview';

const components = {
    default: (props: IPaneviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
};

export const SimplePaneview = () => {
    const onReady = (event: PaneviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
            title: 'Panel 1',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
            title: 'Panel 2',
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
            title: 'Panel 3',
        });
    };

    return (
        <PaneviewReact
            components={components}
            onReady={onReady}
            className="dockview-theme-dark"
        />
    );
};
