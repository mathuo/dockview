import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';

//
const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
};

const DefaultTab = (props: IDockviewPanelHeaderProps) => {
    const [active, setActive] = React.useState<boolean>(props.api.isActive);
    const [groupActive, setGroupActive] = React.useState<boolean>(
        props.api.isGroupActive
    );

    React.useEffect(() => {
        const disposable1 = props.api.onDidActiveChange((e) => {
            setActive(e.isActive);
        });
        const disposable2 = props.containerApi.onDidActiveGroupChange((e) => {
            setGroupActive(props.api.isGroupActive);
        });

        return () => {
            disposable1.dispose();
            disposable2.dispose();
        };
    }, [props.api]);

    return (
        <div
            style={{
                display: 'flex',
                padding: '0px 8px',
                alignItems: 'center',
                height: '100%',
            }}
        >
            <span style={{ padding: '0px 8px', flexGrow: 1 }}>
                {props.api.title}
            </span>
            <span
                className=""
                onClick={() => props.api.setActive()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingRight: '8px',
                }}
            >
                {'✕'}
            </span>
        </div>
    );
};

const tabComponents = {
    default: DefaultTab,
};

export const ContextMenuDockview = () => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Panel 1',
            },
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Panel 2',
            },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Panel 3',
            },
        });

        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Panel 4',
            },
            position: { referencePanel: 'panel_1', direction: 'right' },
        });
    };

    return (
        <DockviewReact
            components={components}
            tabComponents={tabComponents}
            onReady={onReady}
            className="dockview-theme-dark"
        />
    );
};
