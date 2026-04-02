import { DockviewApi, TAB_GROUP_COLORS, TabGroupColor } from 'dockview';

export interface ContextMenuItem {
    label: string;
    onClick: () => void;
    colorClass?: string;
}

type TabGroup = ReturnType<DockviewApi['getTabGroups']>[number];

export function buildChipContextMenuItems(
    api: DockviewApi,
    groupId: string,
    tabGroup: TabGroup
): ContextMenuItem[] {
    return [
        {
            label: 'Rename group',
            onClick: () => {
                const name = window.prompt('Group name:', tabGroup.label);
                if (name !== null) {
                    tabGroup.label = name;
                }
            },
        },
        {
            label: tabGroup.collapsed ? 'Expand group' : 'Collapse group',
            onClick: () => tabGroup.toggle(),
        },
        {
            label: 'Dissolve group',
            onClick: () =>
                api.dissolveTabGroup({ groupId, tabGroupId: tabGroup.id }),
        },
    ];
}

export function buildTabContextMenuItems(
    api: DockviewApi,
    groupId: string,
    panelId: string
): ContextMenuItem[] {
    const tabGroup = api.getTabGroupForPanel({ groupId, panelId });
    const allTabGroups = api.getTabGroups(groupId);
    const items: ContextMenuItem[] = [];

    if (tabGroup) {
        items.push({
            label: `Remove from "${tabGroup.label || tabGroup.id}"`,
            onClick: () => api.removePanelFromTabGroup({ groupId, panelId }),
        });
    } else {
        for (const tg of allTabGroups) {
            items.push({
                label: `Add to "${tg.label || tg.id}"`,
                colorClass: tg.color,
                onClick: () =>
                    api.addPanelToTabGroup({
                        groupId,
                        tabGroupId: tg.id,
                        panelId,
                    }),
            });
        }
        items.push({
            label: 'Add to new group',
            onClick: () => {
                const label = window.prompt('Group name:') || '';
                const color =
                    TAB_GROUP_COLORS[
                        Math.floor(Math.random() * TAB_GROUP_COLORS.length)
                    ] as TabGroupColor;
                const newGroup = api.createTabGroup({ groupId, label, color });
                api.addPanelToTabGroup({ groupId, tabGroupId: newGroup.id, panelId });
            },
        });
    }

    items.push({
        label: 'Close tab',
        onClick: () => api.getPanel(panelId)?.api.close(),
    });

    return items;
}
