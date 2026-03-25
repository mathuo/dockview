import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    DockviewApi,
} from 'dockview';
import React from 'react';
import ReactDOM from 'react-dom';
import {
    ContextMenuState,
    findPanelIdFromTab,
    findTabGroupFromChip,
    buildChipContextMenu,
    buildTabContextMenu,
} from './tabGroupActions';

const ContextMenu = ({
    menu,
    onClose,
    container,
}: {
    menu: ContextMenuState;
    onClose: () => void;
    container: HTMLElement;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const rect = container.getBoundingClientRect();

    return ReactDOM.createPortal(
        <div
            ref={ref}
            className="dv-tabs-overflow-container"
            style={{
                position: 'absolute',
                top: menu.y - rect.top,
                left: menu.x - rect.left,
                zIndex: 9999,
                overflow: 'auto',
                minWidth: 160,
            }}
        >
            {menu.colors && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 6,
                        padding: '8px 10px',
                        justifyItems: 'center',
                        backgroundColor:
                            'var(--dv-activegroup-hiddenpanel-tab-background-color)',
                        color: 'var(--dv-activegroup-hiddenpanel-tab-color)',
                        borderBottom: '1px solid var(--dv-tab-divider-color)',
                    }}
                >
                    {menu.colors.values.map((color) => (
                        <span
                            key={color}
                            className={`dv-tab-group-chip dv-tab-group-chip--${color}`}
                            onClick={() => {
                                menu.colors!.onSelect(color);
                                onClose();
                            }}
                            style={{
                                width: 16,
                                height: 16,
                                padding: 0,
                                margin: 0,
                                borderRadius: '50%',
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                </div>
            )}
            {menu.items.map((item, i) => (
                <div
                    key={i}
                    className="dv-tab dv-inactive-tab"
                    onClick={() => {
                        item.onClick();
                        onClose();
                    }}
                >
                    {item.colorClass && (
                        <span
                            className={`dv-tab-group-chip dv-tab-group-chip--${item.colorClass}`}
                            style={{
                                width: 10,
                                height: 10,
                                padding: 0,
                                borderRadius: '50%',
                                minWidth: 10,
                                margin: 0,
                                display: 'inline-block',
                                verticalAlign: 'middle',
                                marginRight: 6,
                            }}
                        />
                    )}
                    {item.label}
                </div>
            ))}
        </div>,
        container
    );
};

const Default = (props: IDockviewPanelProps) => {
    return (
        <div style={{ padding: 10 }}>
            <div>{props.api.title}</div>
        </div>
    );
};

const components = {
    default: Default,
};

export default () => {
    const [api, setApi] = React.useState<DockviewApi>();
    const [menu, setMenu] = React.useState<ContextMenuState | null>(null);
    const [dockviewContainer, setDockviewContainer] =
        React.useState<HTMLElement | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);

        const el = wrapperRef.current?.querySelector(
            '.dv-dockview'
        ) as HTMLElement;
        if (el) {
            setDockviewContainer(el);
        }

        const panel1 = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Dashboard',
        });
        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Settings',
        });
        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Users',
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            title: 'Analytics',
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            title: 'Reports',
        });
        event.api.addPanel({
            id: 'panel_6',
            component: 'default',
            title: 'Billing',
        });
        event.api.addPanel({
            id: 'panel_7',
            component: 'default',
            title: 'Notifications',
        });
        event.api.addPanel({
            id: 'panel_8',
            component: 'default',
            title: 'Logs',
        });

        const groupId = panel1.group.id;

        // Group 1: Feature (blue, expanded)
        const featureGroup = event.api.createTabGroup({
            groupId,
            label: 'Feature',
            color: 'blue',
        });
        event.api.addPanelToTabGroup({
            groupId,
            tabGroupId: featureGroup.id,
            panelId: 'panel_1',
        });
        event.api.addPanelToTabGroup({
            groupId,
            tabGroupId: featureGroup.id,
            panelId: 'panel_2',
        });
        event.api.addPanelToTabGroup({
            groupId,
            tabGroupId: featureGroup.id,
            panelId: 'panel_3',
        });
        event.api.addPanelToTabGroup({
            groupId,
            tabGroupId: featureGroup.id,
            panelId: 'panel_4',
        });

        // Group 2: Monitoring (purple, collapsed)
        const monitoringGroup = event.api.createTabGroup({
            groupId,
            label: 'Monitoring',
            color: 'purple',
        });
        event.api.addPanelToTabGroup({
            groupId,
            tabGroupId: monitoringGroup.id,
            panelId: 'panel_5',
        });
        event.api.addPanelToTabGroup({
            groupId,
            tabGroupId: monitoringGroup.id,
            panelId: 'panel_7',
        });
        event.api.addPanelToTabGroup({
            groupId,
            tabGroupId: monitoringGroup.id,
            panelId: 'panel_8',
        });
        monitoringGroup.collapse();
    };

    const handleContextMenu = React.useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            if (!api) return;

            const target = e.target as HTMLElement;
            const groups = api.groups;
            if (groups.length === 0) return;
            const groupId = groups[0].id;

            const chipEl = target.closest('.dv-tab-group-chip') as HTMLElement;
            const tabEl = target.closest('.dv-tab') as HTMLElement;

            if (chipEl) {
                const tabGroup = findTabGroupFromChip(api, chipEl, groupId);
                if (!tabGroup) return;

                const { colors, items } = buildChipContextMenu(
                    api,
                    groupId,
                    tabGroup
                );
                setMenu({ x: e.clientX, y: e.clientY, colors, items });
            } else if (tabEl) {
                const panelId = findPanelIdFromTab(api, tabEl, groupId);
                if (!panelId) return;

                const { items } = buildTabContextMenu(api, groupId, panelId);
                setMenu({ x: e.clientX, y: e.clientY, items });
            }
        },
        [api]
    );

    const closeMenu = React.useCallback(() => setMenu(null), []);

    return (
        <div
            ref={wrapperRef}
            style={{ width: '100%', height: '100%' }}
            onContextMenu={handleContextMenu}
        >
            <DockviewReact
                className={'dockview-theme-abyss'}
                onReady={onReady}
                components={components}
                tabAnimation={'smooth'}
                disableFloatingGroups={true}
            />
            {menu && dockviewContainer && (
                <ContextMenu
                    menu={menu}
                    onClose={closeMenu}
                    container={dockviewContainer}
                />
            )}
        </div>
    );
};
