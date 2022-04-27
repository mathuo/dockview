import {
    IDockviewComponent,
    SerializedDockview,
} from '../dockview/dockviewComponent';
import {
    AddGroupOptions,
    AddPanelOptions,
    MovementOptions,
} from '../dockview/options';
import { Direction } from '../gridview/baseComponentGridview';
import {
    AddComponentOptions,
    IGridviewComponent,
    SerializedGridview,
} from '../gridview/gridviewComponent';
import { IGridviewPanel } from '../gridview/gridviewPanel';
import { IGroupPanel } from '../groupview/groupPanel';
import {
    AddPaneviewComponentOptions,
    SerializedPaneview,
    IPaneviewComponent,
} from '../paneview/paneviewComponent';
import { IPaneviewPanel } from '../paneview/paneviewPanel';
import {
    AddSplitviewComponentOptions,
    ISplitviewComponent,
    SerializedSplitview,
    SplitviewComponentUpdateOptions,
} from '../splitview/splitviewComponent';
import { IView, Orientation, Sizing } from '../splitview/core/splitview';
import { ISplitviewPanel } from '../splitview/splitviewPanel';
import { GroupviewPanel, IGroupviewPanel } from '../groupview/groupviewPanel';
import { Emitter, Event } from '../events';
import { PaneviewDropEvent } from '../react';

export interface CommonApi<T = any> {
    readonly height: number;
    readonly width: number;
    readonly onDidLayoutChange: Event<void>;
    readonly onDidLayoutFromJSON: Event<void>;
    focus(): void;
    layout(width: number, height: number): void;
    resizeToFit(): void;
    fromJSON(data: T): void;

    toJSON(): T;
}

export class SplitviewApi implements CommonApi<SerializedSplitview> {
    get minimumSize(): number {
        return this.component.minimumSize;
    }

    get maximumSize(): number {
        return this.component.maximumSize;
    }

    get height(): number {
        return this.component.height;
    }

    get width(): number {
        return this.component.width;
    }

    get length(): number {
        return this.component.length;
    }

    get orientation(): Orientation {
        return this.component.orientation;
    }

    get onDidLayoutFromJSON(): Event<void> {
        return this.component.onDidLayoutFromJSON;
    }

    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    get onDidAddView(): Event<IView> {
        return this.component.onDidAddView;
    }

    get onDidRemoveView(): Event<IView> {
        return this.component.onDidRemoveView;
    }

    constructor(private readonly component: ISplitviewComponent) {}

    updateOptions(options: SplitviewComponentUpdateOptions): void {
        this.component.updateOptions(options);
    }

    removePanel(panel: ISplitviewPanel, sizing?: Sizing): void {
        this.component.removePanel(panel, sizing);
    }

    setVisible(panel: ISplitviewPanel, isVisible: boolean): void {
        this.component.setVisible(panel, isVisible);
    }

    getPanels(): ISplitviewPanel[] {
        return this.component.getPanels();
    }

    focus(): void {
        this.component.focus();
    }

    getPanel(id: string): ISplitviewPanel | undefined {
        return this.component.getPanel(id);
    }

    setActive(panel: ISplitviewPanel): void {
        this.component.setActive(panel);
    }

    layout(width: number, height: number): void {
        return this.component.layout(width, height);
    }

    addPanel(options: AddSplitviewComponentOptions): void {
        this.component.addPanel(options);
    }

    resizeToFit(): void {
        this.component.resizeToFit();
    }

    movePanel(from: number, to: number): void {
        this.component.movePanel(from, to);
    }

    fromJSON(data: SerializedSplitview): void {
        this.component.fromJSON(data);
    }

    toJSON(): SerializedSplitview {
        return this.component.toJSON();
    }
}

export class PaneviewApi implements CommonApi<SerializedPaneview> {
    get minimumSize(): number {
        return this.component.minimumSize;
    }

    get maximumSize(): number {
        return this.component.maximumSize;
    }

    get height(): number {
        return this.component.height;
    }

    get width(): number {
        return this.component.width;
    }

    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    get onDidLayoutFromJSON(): Event<void> {
        return this.component.onDidLayoutFromJSON;
    }

    get onDidAddView(): Event<IPaneviewPanel> {
        return this.component.onDidAddView;
    }

    get onDidRemoveView(): Event<IPaneviewPanel> {
        return this.component.onDidRemoveView;
    }

    get onDidDrop(): Event<PaneviewDropEvent> {
        const emitter = new Emitter<PaneviewDropEvent>();

        const disposable = this.component.onDidDrop((e) => {
            emitter.fire({ ...e, api: this });
        });

        emitter.dispose = () => {
            disposable.dispose();
            emitter.dispose();
        };

        return emitter.event;
    }

    constructor(private readonly component: IPaneviewComponent) {}

    getPanels(): IPaneviewPanel[] {
        return this.component.getPanels();
    }

    removePanel(panel: IPaneviewPanel): void {
        this.component.removePanel(panel);
    }

    getPanel(id: string): IPaneviewPanel | undefined {
        return this.component.getPanel(id);
    }

    movePanel(from: number, to: number): void {
        this.component.movePanel(from, to);
    }

    focus(): void {
        this.component.focus();
    }

    layout(width: number, height: number): void {
        this.component.layout(width, height);
    }

    addPanel(options: AddPaneviewComponentOptions): void {
        this.component.addPanel(options);
    }

    resizeToFit(): void {
        this.component.resizeToFit();
    }

    fromJSON(data: SerializedPaneview): void {
        this.component.fromJSON(data);
    }

    toJSON(): SerializedPaneview {
        return this.component.toJSON();
    }
}

export class GridviewApi implements CommonApi<SerializedGridview> {
    get minimumHeight(): number {
        return this.component.minimumHeight;
    }

    get maximumHeight(): number {
        return this.component.maximumHeight;
    }

    get minimumWidth(): number {
        return this.component.minimumWidth;
    }

    get maximumWidth(): number {
        return this.component.maximumWidth;
    }

    get width(): number {
        return this.component.width;
    }

    get height(): number {
        return this.component.height;
    }

    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    get onDidAddGroup(): Event<IGridviewPanel> {
        return this.component.onDidAddGroup;
    }

    get onDidRemoveGroup(): Event<IGridviewPanel> {
        return this.component.onDidRemoveGroup;
    }

    get onDidActiveGroupChange(): Event<IGridviewPanel | undefined> {
        return this.component.onDidActiveGroupChange;
    }

    get onDidLayoutFromJSON(): Event<void> {
        return this.component.onDidLayoutFromJSON;
    }

    get panels(): IGridviewPanel[] {
        return this.component.groups;
    }

    get orientation(): Orientation {
        return this.component.orientation;
    }

    set orientation(value: Orientation) {
        this.component.updateOptions({ orientation: value });
    }

    constructor(private readonly component: IGridviewComponent) {}

    focus(): void {
        this.component.focus();
    }

    layout(width: number, height: number, force = false): void {
        this.component.layout(width, height, force);
    }

    addPanel(options: AddComponentOptions): void {
        this.component.addPanel(options);
    }

    removePanel(panel: IGridviewPanel, sizing?: Sizing): void {
        this.component.removePanel(panel, sizing);
    }

    movePanel(
        panel: IGridviewPanel,
        options: { direction: Direction; reference: string; size?: number }
    ): void {
        this.component.movePanel(panel, options);
    }

    resizeToFit(): void {
        this.component.resizeToFit();
    }

    getPanel(id: string): IGridviewPanel | undefined {
        return this.component.getPanel(id);
    }

    toggleVisibility(panel: IGridviewPanel): void {
        this.component.toggleVisibility(panel);
    }

    setVisible(panel: IGridviewPanel, visible: boolean): void {
        this.component.setVisible(panel, visible);
    }

    setActive(panel: IGridviewPanel): void {
        this.component.setActive(panel);
    }

    fromJSON(data: SerializedGridview): void {
        return this.component.fromJSON(data);
    }

    toJSON(): SerializedGridview {
        return this.component.toJSON();
    }
}

export class DockviewApi implements CommonApi<SerializedDockview> {
    get width(): number {
        return this.component.width;
    }

    get height(): number {
        return this.component.height;
    }

    get minimumHeight(): number {
        return this.component.minimumHeight;
    }

    get maximumHeight(): number {
        return this.component.maximumHeight;
    }

    get minimumWidth(): number {
        return this.component.minimumWidth;
    }

    get maximumWidth(): number {
        return this.component.maximumWidth;
    }

    get size(): number {
        return this.component.size;
    }

    get totalPanels(): number {
        return this.component.totalPanels;
    }

    get onDidActiveGroupChange(): Event<IGroupviewPanel | undefined> {
        return this.component.onDidActiveGroupChange;
    }

    get onDidAddGroup(): Event<IGroupviewPanel> {
        return this.component.onDidAddGroup;
    }

    get onDidRemoveGroup(): Event<IGroupviewPanel> {
        return this.component.onDidRemoveGroup;
    }

    get onDidActivePanelChange(): Event<IGroupPanel | undefined> {
        return this.component.onDidActivePanelChange;
    }

    get onDidAddPanel(): Event<IGroupPanel> {
        return this.component.onDidAddPanel;
    }

    get onDidRemovePanel(): Event<IGroupPanel> {
        return this.component.onDidRemovePanel;
    }

    get onDidLayoutFromJSON(): Event<void> {
        return this.component.onDidLayoutfromJSON;
    }

    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    get panels(): IGroupPanel[] {
        return this.component.panels;
    }

    get groups(): IGroupviewPanel[] {
        return this.component.groups;
    }

    get activePanel(): IGroupPanel | undefined {
        return this.component.activePanel;
    }

    get activeGroup(): IGroupviewPanel | undefined {
        return this.component.activeGroup;
    }

    constructor(private readonly component: IDockviewComponent) {}

    getTabHeight(): number | undefined {
        return this.component.tabHeight;
    }

    setTabHeight(height: number | undefined): void {
        this.component.tabHeight = height;
    }

    focus(): void {
        this.component.focus();
    }

    getPanel(id: string): IGroupPanel | undefined {
        return this.component.getGroupPanel(id);
    }

    layout(width: number, height: number, force = false): void {
        this.component.layout(width, height, force);
    }

    addPanel(options: AddPanelOptions): IGroupPanel {
        return this.component.addPanel(options);
    }

    addEmptyGroup(options?: AddGroupOptions): void {
        this.component.addEmptyGroup(options);
    }

    moveToNext(options?: MovementOptions): void {
        this.component.moveToNext(options);
    }

    moveToPrevious(options?: MovementOptions): void {
        this.component.moveToPrevious(options);
    }

    closeAllGroups(): void {
        return this.component.closeAllGroups();
    }

    removeGroup(group: IGroupviewPanel): void {
        this.component.removeGroup(<GroupviewPanel>group);
    }

    resizeToFit(): void {
        return this.component.resizeToFit();
    }

    getGroup(id: string): IGroupviewPanel | undefined {
        return this.component.getPanel(id);
    }

    fromJSON(data: SerializedDockview): void {
        this.component.fromJSON(data);
    }

    toJSON(): SerializedDockview {
        return this.component.toJSON();
    }
}
