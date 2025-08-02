import { DockviewComponent } from '../../dockviewComponent';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { IDockviewPanel } from '../../dockviewPanel';
import {
    TabsContainer,
    ITabsContainerAccessor,
    ITabsContainerGroup,
    ITabsContainerPanel,
} from './tabsContainer';

/**
 * Adapter class that makes DockviewComponent compatible with ITabsContainerAccessor
 */
class DockviewComponentAdapter implements ITabsContainerAccessor {
    constructor(private readonly component: DockviewComponent) {}

    get element(): HTMLElement {
        return this.component.element;
    }

    get options() {
        return {
            singleTabMode: this.component.options.singleTabMode,
            disableTabsOverflowList: this.component.options.disableTabsOverflowList,
            disableFloatingGroups: this.component.options.disableFloatingGroups,
            disableDnd: this.component.options.disableDnd,
            scrollbars: this.component.options.scrollbars,
        };
    }

    get api() {
        return this.component.api;
    }

    get id(): string {
        return this.component.id;
    }

    get onDidOptionsChange() {
        return this.component.onDidOptionsChange;
    }

    get popupService() {
        return this.component.popupService;
    }

    addFloatingGroup(group: ITabsContainerGroup, options: { x: number; y: number; inDragMode: boolean }): void {
        this.component.addFloatingGroup(group as DockviewGroupPanel, options);
    }

    doSetGroupActive(group: ITabsContainerGroup): void {
        this.component.doSetGroupActive(group as DockviewGroupPanel);
    }
}

/**
 * Adapter class that makes DockviewGroupPanel compatible with ITabsContainerGroup
 */
class DockviewGroupPanelAdapter implements ITabsContainerGroup {
    constructor(private readonly groupPanel: DockviewGroupPanel) {}

    get id(): string {
        return this.groupPanel.id;
    }

    get size(): number {
        return this.groupPanel.size;
    }

    get panels(): ITabsContainerPanel[] {
        return this.groupPanel.panels as ITabsContainerPanel[];
    }

    get activePanel(): ITabsContainerPanel | undefined {
        return this.groupPanel.activePanel as ITabsContainerPanel | undefined;
    }

    get locked(): boolean | string {
        return this.groupPanel.locked;
    }

    get api() {
        return this.groupPanel.api;
    }

    get model() {
        return this.groupPanel.model;
    }
}

/**
 * Factory function to create a TabsContainer with proper adapters
 * This maintains backward compatibility while using the generic interfaces
 */
export function createTabsContainer(
    accessor: DockviewComponent,
    group: DockviewGroupPanel
): TabsContainer {
    const accessorAdapter = new DockviewComponentAdapter(accessor);
    const groupAdapter = new DockviewGroupPanelAdapter(group);
    
    return new TabsContainer(accessorAdapter, groupAdapter);
}

/**
 * Direct constructor that bypasses adapters (for cases where the concrete types are still needed)
 * This is a fallback for internal dockview usage where type compatibility is guaranteed
 */
export function createTabsContainerDirect(
    accessor: DockviewComponent,
    group: DockviewGroupPanel
): TabsContainer {
    // Cast to the generic interfaces since DockviewComponent/DockviewGroupPanel implement them
    return new TabsContainer(accessor as unknown as ITabsContainerAccessor, group as unknown as ITabsContainerGroup);
}