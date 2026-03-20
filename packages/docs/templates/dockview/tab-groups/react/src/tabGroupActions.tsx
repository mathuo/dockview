import { DockviewApi, TabGroupColor, TAB_GROUP_COLORS } from 'dockview';

export const COLORS: readonly TabGroupColor[] = TAB_GROUP_COLORS;

export interface ContextMenuItem {
    label: string;
    onClick: () => void;
    colorClass?: string;
}

export interface ContextMenuState {
    x: number;
    y: number;
    colors?: { values: TabGroupColor[]; onSelect: (c: TabGroupColor) => void };
    items: ContextMenuItem[];
}

export function findPanelIdFromTab(
    api: DockviewApi,
    tabEl: HTMLElement,
    groupId: string
): string | undefined {
    const group = api.groups.find((g) => g.id === groupId);
    if (!group) return undefined;

    const tabsContainer = tabEl.closest('.dv-tabs-container');
    if (!tabsContainer) return undefined;

    const allTabs = Array.from(
        tabsContainer.querySelectorAll(':scope > .dv-tab')
    );
    const tabIndex = allTabs.indexOf(tabEl);
    if (tabIndex < 0) return undefined;

    const panels = group.panels;
    return tabIndex < panels.length ? panels[tabIndex].id : undefined;
}

export function findTabGroupFromChip(
    api: DockviewApi,
    chipEl: HTMLElement,
    groupId: string
): ReturnType<DockviewApi['getTabGroups']>[number] | undefined {
    const tabGroups = api.getTabGroups(groupId);
    const tabsContainer = chipEl.closest('.dv-tabs-container');
    if (!tabsContainer) return undefined;

    const allChips = Array.from(
        tabsContainer.querySelectorAll('.dv-tab-group-chip')
    );
    const chipIndex = allChips.indexOf(chipEl);
    return chipIndex >= 0 && chipIndex < tabGroups.length
        ? tabGroups[chipIndex]
        : undefined;
}

export function buildChipContextMenu(
    api: DockviewApi,
    groupId: string,
    tabGroup: ReturnType<DockviewApi['getTabGroups']>[number]
): Pick<ContextMenuState, 'colors' | 'items'> {
    return {
        colors: {
            values: COLORS,
            onSelect: (color) => {
                tabGroup.color = color;
            },
        },
        items: [
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
                label: tabGroup.collapsed
                    ? 'Expand group'
                    : 'Collapse group',
                onClick: () => tabGroup.toggle(),
            },
            {
                label: 'Dissolve group',
                onClick: () =>
                    api.dissolveTabGroup({
                        groupId,
                        tabGroupId: tabGroup.id,
                    }),
            },
        ],
    };
}

export function buildTabContextMenu(
    api: DockviewApi,
    groupId: string,
    panelId: string
): Pick<ContextMenuState, 'items'> {
    const tabGroup = api.getTabGroupForPanel({ groupId, panelId });
    const allTabGroups = api.getTabGroups(groupId);
    const items: ContextMenuItem[] = [];

    if (tabGroup) {
        items.push({
            label: `Remove from "${tabGroup.label || tabGroup.id}"`,
            onClick: () =>
                api.removePanelFromTabGroup({ groupId, panelId }),
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
                const colorIdx = Math.floor(
                    Math.random() * COLORS.length
                );
                const newGroup = api.createTabGroup({
                    groupId,
                    label,
                    color: COLORS[colorIdx],
                });
                api.addPanelToTabGroup({
                    groupId,
                    tabGroupId: newGroup.id,
                    panelId,
                });
            },
        });
    }

    items.push({
        label: 'Close tab',
        onClick: () => {
            const panel = api.getPanel(panelId);
            if (panel) {
                panel.api.close();
            }
        },
    });

    return { items };
}
