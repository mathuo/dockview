import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    DockviewApi,
    GetTabContextMenuItemsParams,
    GetTabGroupChipContextMenuItemsParams,
    themeAbyss,
} from 'dockview';
import React from 'react';
import {
    buildChipContextMenuItems,
    buildTabContextMenuItems,
} from './tabGroupActions';

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

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);

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

    const getTabContextMenuItems = React.useCallback(
        ({ panel, group }: GetTabContextMenuItemsParams) => {
            return buildTabContextMenuItems(api!, group.id, panel.id).map(
                (item) => ({
                    label: item.label,
                    action: item.onClick,
                })
            );
        },
        [api]
    );

    const getTabGroupChipContextMenuItems = React.useCallback(
        ({ tabGroup, group }: GetTabGroupChipContextMenuItemsParams) => {
            const items = buildChipContextMenuItems(api!, group.id, tabGroup);
            return [
                'rename' as const,
                'colorPicker' as const,
                'separator' as const,
                ...items.map((item) => ({
                    label: item.label,
                    action: item.onClick,
                })),
            ];
        },
        [api]
    );

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <DockviewReact
                className={'dockview-theme-abyss'}
                onReady={onReady}
                components={components}
                theme={{ ...themeAbyss, tabAnimation: 'smooth' }}
                disableFloatingGroups={true}
                getTabContextMenuItems={getTabContextMenuItems}
                getTabGroupChipContextMenuItems={
                    getTabGroupChipContextMenuItems
                }
            />
        </div>
    );
};
