import {
    ISplitviewPanelProps,
    Orientation,
    SplitviewReact,
    SplitviewReadyEvent,
} from 'dockview';

const components = {
    default: (props: ISplitviewPanelProps<{ title: string }>) => {
        return <div style={{ margin: '20px' }}>{props.params.title}</div>;
    },
};

export const SimpleSplitview = () => {
    const onReady = (event: SplitviewReadyEvent) => {
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
    };

    return (
        <SplitviewReact
            components={components}
            onReady={onReady}
            orientation={Orientation.HORIZONTAL}
            className="dockview-theme-dark"
        />
    );
};
