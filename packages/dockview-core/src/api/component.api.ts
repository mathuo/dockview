import {
    DockviewDropEvent,
    IDockviewComponent,
    SerializedDockview,
} from '../dockview/dockviewComponent';
import {
    AddGroupOptions,
    AddPanelOptions,
    MovementOptions,
} from '../dockview/options';
import { Parameters } from '../panel/types';
import { Direction } from '../gridview/baseComponentGridview';
import {
    AddComponentOptions,
    IGridviewComponent,
    SerializedGridviewComponent,
} from '../gridview/gridviewComponent';
import { IGridviewPanel } from '../gridview/gridviewPanel';

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
import { IView, Orientation, Sizing } from '../splitview/splitview';
import { ISplitviewPanel } from '../splitview/splitviewPanel';
import {
    DockviewGroupPanel,
    IDockviewGroupPanel,
} from '../dockview/dockviewGroupPanel';
import { Emitter, Event } from '../events';
import { IDockviewPanel } from '../dockview/dockviewPanel';
import { PaneviewDropEvent } from '../paneview/draggablePaneviewPanel';
import {
    GroupDragEvent,
    TabDragEvent,
} from '../dockview/components/titlebar/tabsContainer';

export interface CommonApi<T = any> {
    readonly height: number;
    readonly width: number;
    readonly onDidLayoutChange: Event<void>;
    readonly onDidLayoutFromJSON: Event<void>;
    focus(): void;
    layout(width: number, height: number): void;
    fromJSON(data: T): void;
    toJSON(): T;
    clear(): void;
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

    get panels(): ISplitviewPanel[] {
        return this.component.panels;
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

    focus(): void {
        this.component.focus();
    }

    getPanel(id: string): ISplitviewPanel | undefined {
        return this.component.getPanel(id);
    }

    layout(width: number, height: number): void {
        return this.component.layout(width, height);
    }

    addPanel<T extends object = Parameters>(
        options: AddSplitviewComponentOptions<T>
    ): ISplitviewPanel {
        return this.component.addPanel(options);
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

    clear(): void {
        this.component.clear();
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

    get panels(): IPaneviewPanel[] {
        return this.component.panels;
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

    addPanel<T extends object = Parameters>(
        options: AddPaneviewComponentOptions<T>
    ): IPaneviewPanel {
        return this.component.addPanel(options);
    }

    fromJSON(data: SerializedPaneview): void {
        this.component.fromJSON(data);
    }

    toJSON(): SerializedPaneview {
        return this.component.toJSON();
    }

    clear(): void {
        this.component.clear();
    }
}

export class GridviewApi implements CommonApi<SerializedGridviewComponent> {
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

    get onDidAddPanel(): Event<IGridviewPanel> {
        return this.component.onDidAddGroup;
    }

    get onDidRemovePanel(): Event<IGridviewPanel> {
        return this.component.onDidRemoveGroup;
    }

    get onDidActivePanelChange(): Event<IGridviewPanel | undefined> {
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

    addPanel<T extends object = Parameters>(
        options: AddComponentOptions<T>
    ): IGridviewPanel {
        return this.component.addPanel(options);
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

    getPanel(id: string): IGridviewPanel | undefined {
        return this.component.getPanel(id);
    }

    fromJSON(data: SerializedGridviewComponent): void {
        return this.component.fromJSON(data);
    }

    toJSON(): SerializedGridviewComponent {
        return this.component.toJSON();
    }

    clear(): void {
        this.component.clear();
    }
}

export class DockviewApi implements CommonApi<SerializedDockview> {
    get id(): string {
        return this.component.id;
    }

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

    get onDidActiveGroupChange(): Event<DockviewGroupPanel | undefined> {
        return this.component.onDidActiveGroupChange;
    }

    get onDidAddGroup(): Event<DockviewGroupPanel> {
        return this.component.onDidAddGroup;
    }

    get onDidRemoveGroup(): Event<DockviewGroupPanel> {
        return this.component.onDidRemoveGroup;
    }

    get onDidActivePanelChange(): Event<IDockviewPanel | undefined> {
        return this.component.onDidActivePanelChange;
    }

    get onDidAddPanel(): Event<IDockviewPanel> {
        return this.component.onDidAddPanel;
    }

    get onDidRemovePanel(): Event<IDockviewPanel> {
        return this.component.onDidRemovePanel;
    }

    get onDidLayoutFromJSON(): Event<void> {
        return this.component.onDidLayoutFromJSON;
    }

    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    get onDidDrop(): Event<DockviewDropEvent> {
        return this.component.onDidDrop;
    }

    get onWillDragGroup(): Event<GroupDragEvent> {
        return this.component.onWillDragGroup;
    }

    get onWillDragPanel(): Event<TabDragEvent> {
        return this.component.onWillDragPanel;
    }

    get panels(): IDockviewPanel[] {
        return this.component.panels;
    }

    get groups(): DockviewGroupPanel[] {
        return this.component.groups;
    }

    get activePanel(): IDockviewPanel | undefined {
        return this.component.activePanel;
    }

    get activeGroup(): DockviewGroupPanel | undefined {
        return this.component.activeGroup;
    }

    constructor(private readonly component: IDockviewComponent) {}

    focus(): void {
        this.component.focus();
    }

    getPanel(id: string): IDockviewPanel | undefined {
        return this.component.getGroupPanel(id);
    }

    layout(width: number, height: number, force = false): void {
        this.component.layout(width, height, force);
    }

    addPanel<T extends object = Parameters>(
        options: AddPanelOptions<T>
    ): IDockviewPanel {
        return this.component.addPanel(options);
    }

    removePanel(panel: IDockviewPanel): void {
        this.component.removePanel(panel);
    }

    addGroup(options?: AddGroupOptions): DockviewGroupPanel {
        return this.component.addGroup(options);
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

    removeGroup(group: IDockviewGroupPanel): void {
        this.component.removeGroup(<DockviewGroupPanel>group);
    }

    getGroup(id: string): DockviewGroupPanel | undefined {
        return this.component.getPanel(id);
    }

    addFloatingGroup(
        item: IDockviewPanel | DockviewGroupPanel,
        coord?: { x: number; y: number }
    ): void {
        return this.component.addFloatingGroup(item, coord);
    }

    fromJSON(data: SerializedDockview): void {
        this.component.fromJSON(data);
    }

    toJSON(): SerializedDockview {
        return this.component.toJSON();
    }

    clear(): void {
        this.component.clear();
    }
}
