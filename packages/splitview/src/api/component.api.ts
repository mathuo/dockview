import {
    AddComponentOptions,
    AddGroupOptions,
    AddPanelOptions,
    IComponentDockview,
    IComponentGridview,
    LayoutDropEvent,
    MovementOptions,
    PanelOptions,
} from '../dockview';
import {
    AddPaneviewCompponentOptions,
    IComponentPaneView,
} from '../paneview/componentPaneView';
import { GridPanelView } from '../react';
import {
    AddSplitviewComponentOptions,
    IComponentSplitview,
} from '../splitview/componentSplitview';

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

    layout(width: number, height: number) {
        return this.component.layout(width, height);
    }

    addFromComponent(options: AddSplitviewComponentOptions) {
        return this.component.addFromComponent(options);
    }

    resizeToFit() {
        return this.component.resizeToFit();
    }

    fromJSON(data: any) {
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

    constructor(private readonly component: IComponentPaneView) {}

    layout(width: number, height: number) {
        return this.component.layout(width, height);
    }

    addFromComponent(options: AddPaneviewCompponentOptions) {
        return this.component.addFromComponent(options);
    }

    resizeToFit() {
        return this.component.resizeToFit();
    }

    fromJSON(data: any) {
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

    layout(width: number, height: number, force = false) {
        return this.component.layout(width, height, force);
    }

    addComponent(options: AddComponentOptions) {
        return this.component.addComponent(options);
    }

    resizeToFit() {
        return this.component.resizeToFit();
    }

    getGroup(id: string) {
        return this.component.getGroup(id);
    }

    toggleVisibility(panel: GridPanelView) {
        return this.component.toggleVisibility(panel);
    }

    isVisible(panel: GridPanelView) {
        return this.component.isVisible(panel);
    }

    setVisible(panel: GridPanelView, visible: boolean) {
        return this.component.setVisible(panel, visible);
    }

    fromJSON(data: any) {
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

    get onDidLayoutChange() {
        return this.component.onDidLayoutChange;
    }

    constructor(private readonly component: IComponentDockview) {}

    layout(width: number, height: number, force = false) {
        return this.component.layout(width, height, force);
    }

    addPanelFromComponent(options: AddPanelOptions) {
        return this.component.addPanelFromComponent(options);
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

    resizeToFit() {
        return this.component.resizeToFit();
    }

    getTabHeight() {
        return this.component.getTabHeight();
    }

    setTabHeight(height: number) {
        this.component.setTabHeight(height);
    }

    getGroup(id: string) {
        return this.component.getGroup(id);
    }

    deserialize(data: object) {
        return this.component.deserialize(data);
    }

    toJSON() {
        return this.component.toJSON();
    }
}
