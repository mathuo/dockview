import {
    DockviewDefaultTab,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    IDockviewHeaderActionsProps,
} from 'dockview';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { v4 } from 'uuid';
import './app.scss';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return (
            <div style={{ height: '100%', overflow: 'auto', color: 'white' }}>
                {''}
            </div>
        );
    },
};

const headerComponents = {
    default: (props: IDockviewPanelHeaderProps) => {
        const onContextMenu = (event: React.MouseEvent) => {
            event.preventDefault();
            alert('context menu');
        };
        return <DockviewDefaultTab onContextMenu={onContextMenu} {...props} />;
    },
};

const Popover = (props: {
    children: React.ReactNode;
    position?: { x: number; y: number };
    close: () => void;
}) => {
    const uuid = React.useMemo(() => v4(), []);

    React.useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                props.close();
            }
        };
        const listener2 = (event: MouseEvent) => {
            let target = event.target;

            while (target) {
                if (target instanceof HTMLElement) {
                    if (target.classList.contains(uuid)) {
                        return;
                    } else {
                        target = target.parentElement;
                    }
                } else {
                    target = null;
                }
            }

            props.close();
        };
        window.addEventListener('keypress', listener);
        window.addEventListener('mousedown', listener2);

        return () => {
            window.removeEventListener('keypress', listener);
            window.removeEventListener('mousedown', listener2);
        };
    }, [props.close, uuid]);

    if (!props.position) {
        return null;
    }

    return ReactDOM.createPortal(
        <div
            className={uuid}
            style={{
                position: 'absolute',
                top: props.position.y,
                left: props.position.x,
                background: 'white',
                border: '1px solid black',
                zIndex: 99,
                padding: '10px',
            }}
        >
            {props.children}
        </div>,
        document.body
    );
};

const Icon = (props: {
    icon: string;
    onClick?: (event: React.MouseEvent) => void;
}) => {
    return (
        <div className="action" onClick={props.onClick}>
            <span
                style={{ fontSize: 'inherit' }}
                className="material-symbols-outlined"
            >
                {props.icon}
            </span>
        </div>
    );
};

const groupControlsComponents: Record<string, React.FC> = {
    panel_1: () => {
        return <Icon icon="file_download" />;
    },
};

const RightControls = (props: IDockviewHeaderActionsProps) => {
    const Component = React.useMemo(() => {
        if (!props.isGroupActive || !props.activePanel) {
            return null;
        }

        return groupControlsComponents[props.activePanel.id];
    }, [props.isGroupActive, props.activePanel]);

    const [icon, setIcon] = React.useState<string>(
        props.containerApi.hasMaximizedGroup()
            ? 'collapse_content'
            : 'expand_content'
    );

    const [popoutIcon, setPopoutIcon] = React.useState<string>(
        props.api.location === 'popout' ? 'close_fullscreen' : 'open_in_new'
    );

    React.useEffect(() => {
        const disposable = props.containerApi.onDidMaxmizedGroupChange(() => {
            setIcon(
                props.containerApi.hasMaximizedGroup()
                    ? 'collapse_content'
                    : 'expand_content'
            );
        });

        const disposable2 = props.api.onDidLocationChange(() => {
            setPopoutIcon(
                props.api.location === 'popout'
                    ? 'close_fullscreen'
                    : 'open_in_new'
            );
        });

        return () => {
            disposable.dispose();
            disposable2.dispose();
        };
    }, [props.containerApi]);

    const onClick = () => {
        if (props.containerApi.hasMaximizedGroup()) {
            props.containerApi.exitMaxmizedGroup();
        } else {
            props.activePanel?.api.maximize();
        }
    };

    const onClick2 = () => {
        if (props.api.location !== 'popout') {
            props.containerApi.addPopoutGroup(props.group);
        } else {
            props.api.moveTo({ position: 'right' });
        }
    };

    return (
        <div
            className="group-control"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0px 8px',
                height: '100%',
                color: 'var(--dv-activegroup-visiblepanel-tab-color)',
            }}
        >
            {props.isGroupActive && <Icon icon="star" />}
            {Component && <Component />}
            <Icon icon={popoutIcon} onClick={onClick2} />
            <Icon icon={icon} onClick={onClick} />
        </div>
    );
};

let counter = 0;

const LeftControls = (props: IDockviewHeaderActionsProps) => {
    const onClick = () => {
        props.containerApi.addPanel({
            id: `id_${Date.now().toString()}`,
            component: 'default',
            title: `Tab ${counter++}`,
            position: {
                referenceGroup: props.group,
            },
        });
    };

    return (
        <div
            className="group-control"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0px 8px',
                height: '100%',
                color: 'var(--dv-activegroup-visiblepanel-tab-color)',
            }}
        >
            <Icon onClick={onClick} icon="add" />
        </div>
    );
};

const PrefixHeaderControls = (props: IDockviewHeaderActionsProps) => {
    return (
        <div
            className="group-control"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0px 8px',
                height: '100%',
                color: 'var(--dv-activegroup-visiblepanel-tab-color)',
            }}
        >
            <Icon icon="Menu" />
        </div>
    );
};

const DockviewDemo = (props: { theme?: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
        });
        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
            position: { referencePanel: 'panel_1', direction: 'right' },
        });
        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
            position: { referencePanel: 'panel_2', direction: 'below' },
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            title: 'Panel 4',
            position: { referencePanel: 'panel_3', direction: 'right' },
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            title: 'Panel 5',
            position: { referencePanel: 'panel_3', direction: 'below' },
        });
        event.api.addPanel({
            id: 'panel_6',
            component: 'default',
            title: 'Panel 6',
            position: { referencePanel: 'panel_3', direction: 'right' },
        });

        event.api.getPanel('panel_1')!.api.setActive();

        console.log(event.api.toJSON());
    };

    return (
        <DockviewReact
            components={components}
            defaultTabComponent={headerComponents.default}
            rightHeaderActionsComponent={RightControls}
            leftHeaderActionsComponent={LeftControls}
            prefixHeaderActionsComponent={PrefixHeaderControls}
            onReady={onReady}
            className={props.theme || 'dockview-theme-abyss'}
        />
    );
};

export default DockviewDemo;
