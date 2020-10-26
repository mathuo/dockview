import {
    IComponentDockview,
    LayoutDropEvent,
    SerializedDockview,
} from '../dockview/componentDockview';
import {
    AddGroupOptions,
    AddPanelOptions,
    MovementOptions,
    PanelOptions,
} from '../dockview/options';
import {
    AddComponentOptions,
    IComponentGridview,
    SerializedGridview,
} from '../gridview/componentGridview';
import { GridviewPanel } from '../gridview/gridviewPanel';
import { IGroupview } from '../groupview/groupview';
import { IGroupPanel } from '../groupview/groupviewPanel';
import {
    AddPaneviewCompponentOptions,
    SerializedPaneview,
} from '../paneview/componentPaneview';
import { IComponentPaneview } from '../paneview/componentPaneview';
import { PaneviewPanel } from '../paneview/paneviewPanel';
import {
    AddSplitviewComponentOptions,
    IComponentSplitview,
    SerializedSplitview,
} from '../splitview/componentSplitview';
import { Sizing } from '../splitview/core/splitview';
import { SplitviewPanel } from '../splitview/splitviewPanel';

export class SplitviewApi {
    get minimumSize() {
        return this.component.minimumSize;
    }

    get maximumSize() {
        return this.component.maximumSize;
    }

    get onDidLayoutChange() {
        return this.component.onDidLayoutChange;
    }

    constructor(private readonly component: IComponentSplitview) {}

    removePanel(panel: SplitviewPanel, sizing?: Sizing) {
        this.component.removePanel(panel, sizing);
    }

    setVisible(panel: SplitviewPanel, isVisible: boolean) {
        return this.component.setVisible(panel, isVisible);
    }

    getPanels(): SplitviewPanel[] {
        return this.component.getPanels();
    }

    focus() {
        return this.component.focus();
    }

    getPanel(id: string) {
        return this.component.getPanel(id);
    }

    setActive(panel: SplitviewPanel) {
        return this.component.setActive(panel);
    }

    layout(width: number, height: number) {
        return this.component.layout(width, height);
    }

    addPanel(options: AddSplitviewComponentOptions) {
        return this.component.addPanel(options);
    }

    resizeToFit() {
        return this.component.resizeToFit();
    }

    fromJSON(data: SerializedSplitview) {
        return this.component.fromJSON(data);
    }

    toJSON() {
        return this.component.toJSON();
    }
}

export class PaneviewApi {
    get minimumSize() {
        return this.component.minimumSize;
    }

    get maximumSize() {
        return this.component.maximumSize;
    }

    get onDidLayoutChange() {
        return this.component.onDidLayoutChange;
    }

    constructor(private readonly component: IComponentPaneview) {}

    getPanels(): PaneviewPanel[] {
        return this.component.getPanels();
    }

    removePanel(panel: PaneviewPanel): void {
        this.component.removePanel(panel);
    }

    getPanel(id: string): PaneviewPanel | undefined {
        return this.component.getPanel(id);
    }

    focus() {
        return this.component.focus();
    }

    layout(width: number, height: number) {
        return this.component.layout(width, height);
    }

    addFromComponent(options: AddPaneviewCompponentOptions) {
        return this.component.addFromComponent(options);
    }

    resizeToFit() {
        return this.component.resizeToFit();
    }

    fromJSON(data: SerializedPaneview) {
        return this.component.fromJSON(data);
    }

    toJSON() {
        return this.component.toJSON();
    }
}

export class GridviewApi {
    get minimumHeight() {
        return this.component.minimumHeight;
    }

    get maximumHeight() {
        return this.component.maximumHeight;
    }

    get minimumWidth() {
        return this.component.minimumWidth;
    }

    get maximumWidth() {
        return this.component.maximumWidth;
    }

    get onDidLayoutChange() {
        return this.component.onDidLayoutChange;
    }

    constructor(private readonly component: IComponentGridview) {}

    focus() {
        return this.component.focus();
    }

    layout(width: number, height: number, force = false) {
        return this.component.layout(width, height, force);
    }

    addPanel(options: AddComponentOptions) {
        return this.component.addPanel(options);
    }

    removePanel(panel: GridviewPanel, sizing?: Sizing): void {
        this.component.removePanel(panel, sizing);
    }

    resizeToFit() {
        return this.component.resizeToFit();
    }

    getPanel(id: string) {
        return this.component.getPanel(id);
    }

    toggleVisibility(panel: GridviewPanel) {
        return this.component.toggleVisibility(panel);
    }

    isVisible(panel: GridviewPanel) {
        return this.component.isVisible(panel);
    }

    setVisible(panel: GridviewPanel, visible: boolean) {
        return this.component.setVisible(panel, visible);
    }

    fromJSON(data: SerializedGridview) {
        return this.component.fromJSON(data);
    }

    toJSON() {
        return this.component.toJSON();
    }
}

export class DockviewApi {
    get minimumHeight() {
        return this.component.minimumHeight;
    }

    get maximumHeight() {
        return this.component.maximumHeight;
    }

    get minimumWidth() {
        return this.component.minimumWidth;
    }

    get maximumWidth() {
        return this.component.maximumWidth;
    }

    get size() {
        return this.component.size;
    }

    get totalPanels() {
        return this.component.totalPanels;
    }

    get onDidLayoutChange() {
        return this.component.onDidLayoutChange;
    }

    constructor(private readonly component: IComponentDockview) {}

    focus() {
        return this.component.focus();
    }

    getPanel(id: string): IGroupPanel | undefined {
        return this.component.getGroupPanel(id);
    }

    setActivePanel(panel: IGroupPanel) {
        return this.component.setActivePanel(panel);
    }

    layout(width: number, height: number, force = false) {
        return this.component.layout(width, height, force);
    }

    addPanel(options: AddPanelOptions) {
        return this.component.addPanel(options);
    }

    addDndHandle(type: string, cb: (event: LayoutDropEvent) => PanelOptions) {
        return this.component.addDndHandle(type, cb);
    }

    createDragTarget(
        target: {
            element: HTMLElement;
            content: string;
        },
        options: (() => PanelOptions) | PanelOptions
    ) {
        return this.component.createDragTarget(target, options);
    }

    addEmptyGroup(options?: AddGroupOptions) {
        return this.component.addEmptyGroup(options);
    }

    moveToNext(options?: MovementOptions) {
        return this.component.moveToNext(options);
    }

    moveToPrevious(options?: MovementOptions) {
        return this.component.moveToPrevious(options);
    }

    closeAllGroups() {
        return this.component.closeAllGroups();
    }

    removeGroup(group: IGroupview) {
        return this.component.removeGroup(group);
    }

    resizeToFit() {
        return this.component.resizeToFit();
    }

    getTabHeight() {
        return this.component.getTabHeight();
    }

    setTabHeight(height: number | undefined) {
        this.component.setTabHeight(height);
    }

    getGroup(id: string) {
        return this.component.getPanel(id);
    }

    deserialize(data: SerializedDockview) {
        return this.component.deserialize(data);
    }

    toJSON() {
        return this.component.toJSON();
    }
}
