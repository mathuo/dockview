import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    PanelApi,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
};

const RenderWhenVisible = <T,>(
    props: T & {
        children: React.FunctionComponent<T>;
        api: Pick<PanelApi, 'isVisible' | 'onDidVisibilityChange'>;
    }
) => {
    const [visible, setVisible] = React.useState<boolean>(props.api.isVisible);

    React.useEffect(() => {
        const disposable = props.api.onDidVisibilityChange((event) =>
            setVisible(event.isVisible)
        );

        return () => {
            disposable.dispose();
        };
    }, [props.api]);

    if (!visible) {
        return null;
    }

    return React.createElement(props.children, props);
};

export const SimpleDockview = () => {
    const onReady = (event: DockviewReadyEvent) => {
        const panel = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
        });

        panel.group.locked = true;
        panel.group.header.hidden = true;

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
            position: { referencePanel: 'panel_1', direction: 'right' },
        });

        const panel5 = event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            params: {
                title: 'Panel 5',
            },
            position: { referencePanel: 'panel_3', direction: 'right' },
        });

        // panel5.group!.model.header.hidden = true;
        // panel5.group!.model.locked = true;

        event.api.addPanel({
            id: 'panel_6',
            component: 'default',
            params: {
                title: 'Panel 6',
            },
            position: { referencePanel: 'panel_5', direction: 'below' },
        });

        event.api.addPanel({
            id: 'panel_7',
            component: 'default',
            params: {
                title: 'Panel 7',
            },
            position: { referencePanel: 'panel_6', direction: 'right' },
        });
    };

    return (
        <DockviewReact
            components={components}
            onReady={onReady}
            className="dockview-theme-abyss"
        />
    );
};
