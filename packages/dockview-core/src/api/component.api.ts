import {
    FloatingGroupOptions,
    IDockviewComponent,
    MovePanelEvent,
    SerializedDockview,
} from '../dockview/dockviewComponent';
import {
    AddGroupOptions,
    AddPanelOptions,
    DockviewComponentOptions,
    DockviewDndOverlayEvent,
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
import { Box } from '../types';
import {
    DockviewDidDropEvent,
    DockviewWillDropEvent,
    WillShowOverlayLocationEvent,
} from '../dockview/dockviewGroupPanelModel';
import { PaneviewComponentOptions } from '../paneview/options';
import { SplitviewComponentOptions } from '../splitview/options';
import { GridviewComponentOptions } from '../gridview/options';

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
    dispose(): void;
}

export class SplitviewApi implements CommonApi<SerializedSplitview> {
    /**
     * The minimum size  the component can reach where size is measured in the direction of orientation provided.
     */
    get minimumSize(): number {
        return this.component.minimumSize;
    }

    /**
     * The maximum size the component can reach where size is measured in the direction of orientation provided.
     */
    get maximumSize(): number {
        return this.component.maximumSize;
    }

    /**
     * Width of the component.
     */
    get width(): number {
        return this.component.width;
    }

    /**
     * Height of the component.
     */
    get height(): number {
        return this.component.height;
    }
    /**
     * The current number of panels.
     */
    get length(): number {
        return this.component.length;
    }

    /**
     * The current orientation of the component.
     */
    get orientation(): Orientation {
        return this.component.orientation;
    }

    /**
     * The list of current panels.
     */
    get panels(): ISplitviewPanel[] {
        return this.component.panels;
    }

    /**
     * Invoked after a layout is loaded through the `fromJSON` method.
     */
    get onDidLayoutFromJSON(): Event<void> {
        return this.component.onDidLayoutFromJSON;
    }

    /**
     * Invoked whenever any aspect of the layout changes.
     * If listening to this event it may be worth debouncing ouputs.
     */
    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    /**
     * Invoked when a view is added.
     */
    get onDidAddView(): Event<IView> {
        return this.component.onDidAddView;
    }

    /**
     * Invoked when a view is removed.
     */
    get onDidRemoveView(): Event<IView> {
        return this.component.onDidRemoveView;
    }

    constructor(private readonly component: ISplitviewComponent) {}

    /**
     * Removes an existing panel and optionally provide a `Sizing` method
     * for the subsequent resize.
     */
    removePanel(panel: ISplitviewPanel, sizing?: Sizing): void {
        this.component.removePanel(panel, sizing);
    }

    /**
     * Focus the component.
     */
    focus(): void {
        this.component.focus();
    }

    /**
     * Get the reference to a panel given it's `string` id.
     */
    getPanel(id: string): ISplitviewPanel | undefined {
        return this.component.getPanel(id);
    }

    /**
     * Layout the panel with a width and height.
     */
    layout(width: number, height: number): void {
        return this.component.layout(width, height);
    }

    /**
     * Add a new panel and return the created instance.
     */
    addPanel<T extends object = Parameters>(
        options: AddSplitviewComponentOptions<T>
    ): ISplitviewPanel {
        return this.component.addPanel(options);
    }

    /**
     * Move a panel given it's current and desired index.
     */
    movePanel(from: number, to: number): void {
        this.component.movePanel(from, to);
    }

    /**
     * Deserialize a layout to built a splitivew.
     */
    fromJSON(data: SerializedSplitview): void {
        this.component.fromJSON(data);
    }

    /** Serialize a layout */
    toJSON(): SerializedSplitview {
        return this.component.toJSON();
    }

    /**
     * Remove all panels and clear the component.
     */
    clear(): void {
        this.component.clear();
    }

    /**
     * Update configuratable options.
     */
    updateOptions(options: Partial<SplitviewComponentOptions>): void {
        this.component.updateOptions(options);
    }

    /**
     * Release resources and teardown component. Do not call when using framework versions of dockview.
     */
    dispose(): void {
        this.component.dispose();
    }
}

export class PaneviewApi implements CommonApi<SerializedPaneview> {
    /**
     * The minimum size  the component can reach where size is measured in the direction of orientation provided.
     */
    get minimumSize(): number {
        return this.component.minimumSize;
    }

    /**
     * The maximum size the component can reach where size is measured in the direction of orientation provided.
     */
    get maximumSize(): number {
        return this.component.maximumSize;
    }

    /**
     * Width of the component.
     */
    get width(): number {
        return this.component.width;
    }

    /**
     * Height of the component.
     */
    get height(): number {
        return this.component.height;
    }

    /**
     * All panel objects.
     */
    get panels(): IPaneviewPanel[] {
        return this.component.panels;
    }

    /**
     * Invoked when any layout change occures, an aggregation of many events.
     */
    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    /**
     * Invoked after a layout is deserialzied using the `fromJSON` method.
     */
    get onDidLayoutFromJSON(): Event<void> {
        return this.component.onDidLayoutFromJSON;
    }

    /**
     * Invoked when a panel is added. May be called multiple times when moving panels.
     */
    get onDidAddView(): Event<IPaneviewPanel> {
        return this.component.onDidAddView;
    }

    /**
     * Invoked when a panel is removed. May be called multiple times when moving panels.
     */
    get onDidRemoveView(): Event<IPaneviewPanel> {
        return this.component.onDidRemoveView;
    }

    /**
     * Invoked when a Drag'n'Drop event occurs that the component was unable to handle. Exposed for custom Drag'n'Drop functionality.
     */
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

    /**
     * Remove a panel given the panel object.
     */
    removePanel(panel: IPaneviewPanel): void {
        this.component.removePanel(panel);
    }

    /**
     * Get a panel object given a `string` id. May return `undefined`.
     */
    getPanel(id: string): IPaneviewPanel | undefined {
        return this.component.getPanel(id);
    }

    /**
     * Move a panel given it's current and desired index.
     */
    movePanel(from: number, to: number): void {
        this.component.movePanel(from, to);
    }

    /**
     *  Focus the component. Will try to focus an active panel if one exists.
     */
    focus(): void {
        this.component.focus();
    }

    /**
     * Force resize the component to an exact width and height. Read about auto-resizing before using.
     */
    layout(width: number, height: number): void {
        this.component.layout(width, height);
    }

    /**
     * Add a panel and return the created object.
     */
    addPanel<T extends object = Parameters>(
        options: AddPaneviewComponentOptions<T>
    ): IPaneviewPanel {
        return this.component.addPanel(options);
    }

    /**
     * Create a component from a serialized object.
     */
    fromJSON(data: SerializedPaneview): void {
        this.component.fromJSON(data);
    }

    /**
     * Create a serialized object of the current component.
     */
    toJSON(): SerializedPaneview {
        return this.component.toJSON();
    }

    /**
     * Reset the component back to an empty and default state.
     */
    clear(): void {
        this.component.clear();
    }

    /**
     * Update configuratable options.
     */
    updateOptions(options: Partial<PaneviewComponentOptions>): void {
        this.component.updateOptions(options);
    }

    /**
     * Release resources and teardown component. Do not call when using framework versions of dockview.
     */
    dispose(): void {
        this.component.dispose();
    }
}

export class GridviewApi implements CommonApi<SerializedGridviewComponent> {
    /**
     * Width of the component.
     */
    get width(): number {
        return this.component.width;
    }

    /**
     * Height of the component.
     */
    get height(): number {
        return this.component.height;
    }

    /**
     * Minimum height of the component.
     */
    get minimumHeight(): number {
        return this.component.minimumHeight;
    }

    /**
     * Maximum height of the component.
     */
    get maximumHeight(): number {
        return this.component.maximumHeight;
    }

    /**
     * Minimum width of the component.
     */
    get minimumWidth(): number {
        return this.component.minimumWidth;
    }

    /**
     * Maximum width of the component.
     */
    get maximumWidth(): number {
        return this.component.maximumWidth;
    }

    /**
     * Invoked when any layout change occures, an aggregation of many events.
     */
    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    /**
     * Invoked when a panel is added. May be called multiple times when moving panels.
     */
    get onDidAddPanel(): Event<IGridviewPanel> {
        return this.component.onDidAddGroup;
    }

    /**
     * Invoked when a panel is removed. May be called multiple times when moving panels.
     */
    get onDidRemovePanel(): Event<IGridviewPanel> {
        return this.component.onDidRemoveGroup;
    }

    /**
     * Invoked when the active panel changes. May be undefined if no panel is active.
     */
    get onDidActivePanelChange(): Event<IGridviewPanel | undefined> {
        return this.component.onDidActiveGroupChange;
    }

    /**
     * Invoked after a layout is deserialzied using the `fromJSON` method.
     */
    get onDidLayoutFromJSON(): Event<void> {
        return this.component.onDidLayoutFromJSON;
    }

    /**
     * All panel objects.
     */
    get panels(): IGridviewPanel[] {
        return this.component.groups;
    }

    /**
     * Current orientation. Can be changed after initialization.
     */
    get orientation(): Orientation {
        return this.component.orientation;
    }

    set orientation(value: Orientation) {
        this.component.updateOptions({ orientation: value });
    }

    constructor(private readonly component: IGridviewComponent) {}

    /**
     *  Focus the component. Will try to focus an active panel if one exists.
     */
    focus(): void {
        this.component.focus();
    }

    /**
     * Force resize the component to an exact width and height. Read about auto-resizing before using.
     */
    layout(width: number, height: number, force = false): void {
        this.component.layout(width, height, force);
    }

    /**
     * Add a panel and return the created object.
     */
    addPanel<T extends object = Parameters>(
        options: AddComponentOptions<T>
    ): IGridviewPanel {
        return this.component.addPanel(options);
    }

    /**
     * Remove a panel given the panel object.
     */
    removePanel(panel: IGridviewPanel, sizing?: Sizing): void {
        this.component.removePanel(panel, sizing);
    }

    /**
     * Move a panel in a particular direction relative to another panel.
     */
    movePanel(
        panel: IGridviewPanel,
        options: { direction: Direction; reference: string; size?: number }
    ): void {
        this.component.movePanel(panel, options);
    }

    /**
     * Get a panel object given a `string` id. May return `undefined`.
     */
    getPanel(id: string): IGridviewPanel | undefined {
        return this.component.getPanel(id);
    }

    /**
     * Create a component from a serialized object.
     */
    fromJSON(data: SerializedGridviewComponent): void {
        return this.component.fromJSON(data);
    }

    /**
     * Create a serialized object of the current component.
     */
    toJSON(): SerializedGridviewComponent {
        return this.component.toJSON();
    }

    /**
     * Reset the component back to an empty and default state.
     */
    clear(): void {
        this.component.clear();
    }

    updateOptions(options: Partial<GridviewComponentOptions>) {
        this.component.updateOptions(options);
    }

    /**
     * Release resources and teardown component. Do not call when using framework versions of dockview.
     */
    dispose(): void {
        this.component.dispose();
    }
}

export class DockviewApi implements CommonApi<SerializedDockview> {
    /**
     * The unique identifier for this instance. Used to manage scope of Drag'n'Drop events.
     */
    get id(): string {
        return this.component.id;
    }

    /**
     * Width of the component.
     */
    get width(): number {
        return this.component.width;
    }

    /**
     * Height of the component.
     */
    get height(): number {
        return this.component.height;
    }

    /**
     * Minimum height of the component.
     */
    get minimumHeight(): number {
        return this.component.minimumHeight;
    }

    /**
     * Maximum height of the component.
     */
    get maximumHeight(): number {
        return this.component.maximumHeight;
    }

    /**
     * Minimum width of the component.
     */
    get minimumWidth(): number {
        return this.component.minimumWidth;
    }

    /**
     * Maximum width of the component.
     */
    get maximumWidth(): number {
        return this.component.maximumWidth;
    }

    /**
     * Total number of groups.
     */
    get size(): number {
        return this.component.size;
    }

    /**
     * Total number of panels.
     */
    get totalPanels(): number {
        return this.component.totalPanels;
    }

    get gap(): number {
        return this.component.gap;
    }

    /**
     * Invoked when the active group changes. May be undefined if no group is active.
     */
    get onDidActiveGroupChange(): Event<DockviewGroupPanel | undefined> {
        return this.component.onDidActiveGroupChange;
    }

    /**
     * Invoked when a group is added. May be called multiple times when moving groups.
     */
    get onDidAddGroup(): Event<DockviewGroupPanel> {
        return this.component.onDidAddGroup;
    }

    /**
     * Invoked when a group is removed. May be called multiple times when moving groups.
     */
    get onDidRemoveGroup(): Event<DockviewGroupPanel> {
        return this.component.onDidRemoveGroup;
    }

    /**
     * Invoked when the active panel changes. May be undefined if no panel is active.
     */
    get onDidActivePanelChange(): Event<IDockviewPanel | undefined> {
        return this.component.onDidActivePanelChange;
    }

    /**
     * Invoked when a panel is added. May be called multiple times when moving panels.
     */
    get onDidAddPanel(): Event<IDockviewPanel> {
        return this.component.onDidAddPanel;
    }

    /**
     * Invoked when a panel is removed. May be called multiple times when moving panels.
     */
    get onDidRemovePanel(): Event<IDockviewPanel> {
        return this.component.onDidRemovePanel;
    }

    get onDidMovePanel(): Event<MovePanelEvent> {
        return this.component.onDidMovePanel;
    }

    /**
     * Invoked after a layout is deserialzied using the `fromJSON` method.
     */
    get onDidLayoutFromJSON(): Event<void> {
        return this.component.onDidLayoutFromJSON;
    }

    /**
     * Invoked when any layout change occures, an aggregation of many events.
     */
    get onDidLayoutChange(): Event<void> {
        return this.component.onDidLayoutChange;
    }

    /**
     * Invoked when a Drag'n'Drop event occurs that the component was unable to handle. Exposed for custom Drag'n'Drop functionality.
     */
    get onDidDrop(): Event<DockviewDidDropEvent> {
        return this.component.onDidDrop;
    }

    /**
     * Invoked when a Drag'n'Drop event occurs but before dockview handles it giving the user an opportunity to intecept and
     * prevent the event from occuring using the standard `preventDefault()` syntax.
     *
     * Preventing certain events may causes unexpected behaviours, use carefully.
     */
    get onWillDrop(): Event<DockviewWillDropEvent> {
        return this.component.onWillDrop;
    }

    /**
     * Invoked before an overlay is shown indicating a drop target.
     *
     * Calling `event.preventDefault()` will prevent the overlay being shown and prevent
     * the any subsequent drop event.
     */
    get onWillShowOverlay(): Event<WillShowOverlayLocationEvent> {
        return this.component.onWillShowOverlay;
    }

    /**
     * Invoked before a group is dragged.
     *
     * Calling `event.nativeEvent.preventDefault()` will prevent the group drag starting.
     *
     */
    get onWillDragGroup(): Event<GroupDragEvent> {
        return this.component.onWillDragGroup;
    }

    /**
     * Invoked before a panel is dragged.
     *
     * Calling `event.nativeEvent.preventDefault()` will prevent the panel drag starting.
     */
    get onWillDragPanel(): Event<TabDragEvent> {
        return this.component.onWillDragPanel;
    }

    get onUnhandledDragOverEvent(): Event<DockviewDndOverlayEvent> {
        return this.component.onUnhandledDragOverEvent;
    }

    /**
     * All panel objects.
     */
    get panels(): IDockviewPanel[] {
        return this.component.panels;
    }

    /**
     * All group objects.
     */
    get groups(): DockviewGroupPanel[] {
        return this.component.groups;
    }

    /**
     *  Active panel object.
     */
    get activePanel(): IDockviewPanel | undefined {
        return this.component.activePanel;
    }

    /**
     * Active group object.
     */
    get activeGroup(): DockviewGroupPanel | undefined {
        return this.component.activeGroup;
    }

    constructor(private readonly component: IDockviewComponent) {}

    /**
     *  Focus the component. Will try to focus an active panel if one exists.
     */
    focus(): void {
        this.component.focus();
    }

    /**
     * Get a panel object given a `string` id. May return `undefined`.
     */
    getPanel(id: string): IDockviewPanel | undefined {
        return this.component.getGroupPanel(id);
    }

    /**
     * Force resize the component to an exact width and height. Read about auto-resizing before using.
     */
    layout(width: number, height: number, force = false): void {
        this.component.layout(width, height, force);
    }

    /**
     * Add a panel and return the created object.
     */
    addPanel<T extends object = Parameters>(
        options: AddPanelOptions<T>
    ): IDockviewPanel {
        return this.component.addPanel(options);
    }

    /**
     * Remove a panel given the panel object.
     */
    removePanel(panel: IDockviewPanel): void {
        this.component.removePanel(panel);
    }

    /**
     * Add a group and return the created object.
     */
    addGroup(options?: AddGroupOptions): DockviewGroupPanel {
        return this.component.addGroup(options);
    }

    /**
     * Close all groups and panels.
     */
    closeAllGroups(): void {
        return this.component.closeAllGroups();
    }

    /**
     * Remove a group and any panels within the group.
     */
    removeGroup(group: IDockviewGroupPanel): void {
        this.component.removeGroup(<DockviewGroupPanel>group);
    }

    /**
     * Get a group object given a `string` id. May return undefined.
     */
    getGroup(id: string): DockviewGroupPanel | undefined {
        return this.component.getPanel(id);
    }

    /**
     * Add a floating group
     */
    addFloatingGroup(
        item: IDockviewPanel | DockviewGroupPanel,
        options?: FloatingGroupOptions
    ): void {
        return this.component.addFloatingGroup(item, options);
    }

    /**
     * Create a component from a serialized object.
     */
    fromJSON(data: SerializedDockview): void {
        this.component.fromJSON(data);
    }

    /**
     * Create a serialized object of the current component.
     */
    toJSON(): SerializedDockview {
        return this.component.toJSON();
    }

    /**
     * Reset the component back to an empty and default state.
     */
    clear(): void {
        this.component.clear();
    }

    /**
     * Move the focus progmatically to the next panel or group.
     */
    moveToNext(options?: MovementOptions): void {
        this.component.moveToNext(options);
    }

    /**
     * Move the focus progmatically to the previous panel or group.
     */
    moveToPrevious(options?: MovementOptions): void {
        this.component.moveToPrevious(options);
    }

    maximizeGroup(panel: IDockviewPanel): void {
        this.component.maximizeGroup(panel.group);
    }

    hasMaximizedGroup(): boolean {
        return this.component.hasMaximizedGroup();
    }

    exitMaximizedGroup(): void {
        this.component.exitMaximizedGroup();
    }

    get onDidMaximizedGroupChange(): Event<void> {
        return this.component.onDidMaximizedGroupChange;
    }

    /**
     * Add a popout group in a new Window
     */
    addPopoutGroup(
        item: IDockviewPanel | DockviewGroupPanel,
        options?: {
            position?: Box;
            popoutUrl?: string;
            onDidOpen?: (event: { id: string; window: Window }) => void;
            onWillClose?: (event: { id: string; window: Window }) => void;
        }
    ): Promise<boolean> {
        return this.component.addPopoutGroup(item, options);
    }

    setGap(gap: number | undefined): void {
        this.component.updateOptions({ gap });
    }

    updateOptions(options: Partial<DockviewComponentOptions>) {
        this.component.updateOptions(options);
    }

    /**
     * Release resources and teardown component. Do not call when using framework versions of dockview.
     */
    dispose(): void {
        this.component.dispose();
    }
}
