import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import React from 'react';

const Default = (props: IDockviewPanelProps) => {
    return (
        <div style={{ height: '100%' }}>
            <div>{props.api.title}</div>
        </div>
    );
};

const components = {
    default: Default,
};

const Component = (props: { theme?: string }) => {
    const [api, setApi] = React.useState<DockviewApi>();

    React.useEffect(() => {
        if (!api) {
            return;
        }

        const disposables = [
            api.onWillShowOverlay((e) => {
                if (e.kind === 'header_space' || e.kind === 'tab') {
                    return;
                }
                e.preventDefault();
            }),
        ];

        return () => {
            disposables.forEach((disposable) => {
                disposable.dispose();
            });
        };
    }, [api]);

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);

        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
        });
    };

    return (
        <DockviewReact
            className={`${props.theme || 'dockview-theme-abyss'}`}
            onReady={onReady}
            components={components}
            disableFloatingGroups={true}
        />
    );
};

export default Component;
