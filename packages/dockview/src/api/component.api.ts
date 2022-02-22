import {
    IDockviewComponent,
    SerializedDockview,
} from '../dockview/dockviewComponent';
import {
    AddGroupOptions,
    AddPanelOptions,
    MovementOptions,
} from '../dockview/options';
import { Direction, GroupChangeEvent } from '../gridview/baseComponentGridview';
import {
    AddComponentOptions,
    IGridviewComponent,
    SerializedGridview,
} from '../gridview/gridviewComponent';
import { GridviewPanel, IGridviewPanel } from '../gridview/gridviewPanel';
import { IGroupPanel } from '../groupview/groupPanel';
import {
    AddPaneviewCompponentOptions,
    SerializedPaneview,
    IPaneviewComponent,
} from '../paneview/paneviewComponent';
import { IPaneviewPanel, PaneviewPanel } from '../paneview/paneviewPanel';
import {
    AddSplitviewComponentOptions,
    ISplitviewComponent,
    SerializedSplitview,
    SplitviewComponentUpdateOptions,
} from '../splitview/splitviewComponent';
import { Orientation, Sizing } from '../splitview/core/splitview';
import { ISplitviewPanel } from '../splitview/splitviewPanel';
import { GroupviewPanel } from '../groupview/groupviewPanel';
import { Emitter, Event } from '../events';
import { IDisposable } from '../lifecycle';
import { PaneviewDropEvent } from '../react';

export interface CommonApi {
    readonly height: number;
    readonly width: number;
    readonly onDidLayoutChange: Event<void>;
    focus(): void;
    layout(width: number, height: number): void;
    resizeToFit(): void;
}

export class SplitviewApi implements CommonApi {
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

    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    get orientation(): Orientation {
        return this.component.orientation;
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

    fromJSON(data: SerializedSplitview, deferComponentLayout?: boolean): void {
        this.component.fromJSON(data, deferComponentLayout);
    }

    toJSON(): SerializedSplitview {
        return this.component.toJSON();
    }
}

export class PaneviewApi implements CommonApi {
    get width(): number {
        return this.component.width;
    }

    get height(): number {
        return this.component.height;
    }

    get minimumSize(): number {
        return this.component.minimumSize;
    }

    get maximumSize(): number {
        return this.component.maximumSize;
    }

    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    get onDidAddView(): Event<PaneviewPanel> {
        return this.component.onDidAddView;
    }

    get onDidRemoveView(): Event<PaneviewPanel> {
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

    addPanel(options: AddPaneviewCompponentOptions): IDisposable {
        return this.component.addPanel(options);
    }

    resizeToFit(): void {
        this.component.resizeToFit();
    }

    fromJSON(data: SerializedPaneview, deferComponentLayout?: boolean): void {
        this.component.fromJSON(data, deferComponentLayout);
    }

    toJSON(): SerializedPaneview {
        return this.component.toJSON();
    }
}

export class GridviewApi implements CommonApi {
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

    get onGridEvent(): Event<GroupChangeEvent> {
        return this.component.onGridEvent;
    }

    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    get panels(): GridviewPanel[] {
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

    getPanel(id: string): GridviewPanel | undefined {
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

    fromJSON(data: SerializedGridview, deferComponentLayout?: boolean): void {
        return this.component.fromJSON(data, deferComponentLayout);
    }

    toJSON(): SerializedGridview {
        return this.component.toJSON();
    }
}

export class DockviewApi implements CommonApi {
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

    get onGridEvent(): Event<GroupChangeEvent> {
        return this.component.onGridEvent;
    }

    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    get panels(): IGroupPanel[] {
        return this.component.panels;
    }

    get groups(): GroupviewPanel[] {
        return this.component.groups;
    }

    get activePanel(): IGroupPanel | undefined {
        return this.component.activePanel;
    }

    get activeGroup(): GroupviewPanel | undefined {
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

    setActivePanel(panel: IGroupPanel): void {
        this.component.setActivePanel(panel);
    }

    layout(width: number, height: number, force = false): void {
        this.component.layout(width, height, force);
    }

    addPanel(options: AddPanelOptions): IGroupPanel {
        return this.component.addPanel(options);
    }

    removePanel(panel: IGroupPanel): void {
        this.component.removePanel(panel);
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

    closeAllGroups(): Promise<boolean> {
        return this.component.closeAllGroups();
    }

    removeGroup(group: GroupviewPanel): void {
        this.component.removeGroup(group);
    }

    resizeToFit(): void {
        return this.component.resizeToFit();
    }

    getGroup(id: string): GroupviewPanel | undefined {
        return this.component.getPanel(id);
    }

    fromJSON(data: SerializedDockview): void {
        this.component.fromJSON(data);
    }

    toJSON(): SerializedDockview {
        return this.component.toJSON();
    }
}
