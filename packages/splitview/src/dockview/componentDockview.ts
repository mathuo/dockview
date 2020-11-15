import {
    getRelativeLocation,
    SerializedGridObject,
} from '../gridview/gridview';
import { Position } from '../dnd/droptarget';
import { getGridLocation } from '../gridview/gridview';
import { tail, sequenceEquals } from '../array';
import {
    IGroupview,
    Groupview,
    GroupOptions,
    GroupChangeKind,
    GroupDropEvent,
} from '../groupview/groupview';
import { GroupviewPanel, IGroupPanel } from '../groupview/groupviewPanel';
import {
    CompositeDisposable,
    IDisposable,
    IValueDisposable,
    MutableDisposable,
} from '../lifecycle';
import { Event, Emitter, addDisposableListener } from '../events';
import { Watermark } from './components/watermark/watermark';
import { timeoutAsPromise } from '../async';
import { DebugWidget } from './components/debug/debug';
import { WatermarkPart } from '../groupview/types';
import { debounce } from '../functions';
import { sequentialNumberGenerator } from '../math';
import { DefaultDeserializer, IPanelDeserializer } from './deserializer';
import { createComponent } from '../panel/componentFactory';
import {
    AddGroupOptions,
    AddPanelOptions,
    PanelOptions,
    DockviewOptions,
    MovementOptions,
    TabContextMenuEvent,
} from './options';
import { DataTransferSingleton, DATA_KEY, DragType } from '../dnd/dataTransfer';
import {
    BaseGrid,
    IBaseGrid,
    toTarget,
} from '../gridview/baseComponentGridview';
import { DockviewApi } from '../api/component.api';
import { State } from '../api/api';
import { LayoutMouseEvent, MouseEventKind } from '../groupview/tab';
import { Orientation } from '../splitview/core/splitview';
import { DefaultTab } from './components/tab/defaultTab';

const nextGroupId = sequentialNumberGenerator();

export interface PanelReference {
    update: (event: { params: { [key: string]: any } }) => void;
    remove: () => void;
}

export interface SerializedDockview {
    grid: {
        root: SerializedGridObject<any>;
        height: number;
        width: number;
        orientation: Orientation;
    };
    panels: { [key: string]: any };
    activeGroup: string;
    options: { tabHeight: number };
}

export interface IComponentDockview extends IBaseGrid<IGroupview> {
    readonly activeGroup: IGroupview;
    moveGroupOrPanel(
        referenceGroup: IGroupview,
        groupId: string,
        itemId: string,
        target: Position,
        index?: number
    ): void;
    doSetGroupActive: (group: IGroupview, skipFocus?: boolean) => void;
    removeGroup: (group: IGroupview) => void;
    options: DockviewOptions;
    addPanel(options: AddPanelOptions): IGroupPanel;
    getGroupPanel: (id: string) => IGroupPanel;
    fireMouseEvent(event: LayoutMouseEvent): void;
    createWatermarkComponent(): WatermarkPart;
    setAutoResizeToFit(enabled: boolean): void;
    setTabHeight(height: number | undefined): void;
    getTabHeight(): number;
    totalPanels: number;
    // lifecycle
    addEmptyGroup(options?: AddGroupOptions): void;
    closeAllGroups: () => Promise<boolean>;
    deserializer: IPanelDeserializer;
    // events
    onTabInteractionEvent: Event<LayoutMouseEvent>;
    onTabContextMenu: Event<TabContextMenuEvent>;
    moveToNext(options?: MovementOptions): void;
    moveToPrevious(options?: MovementOptions): void;
    createDragTarget(
        target: {
            element: HTMLElement;
            content: string;
        },
        options: (() => PanelOptions) | PanelOptions
    ): IDisposable;
    addDndHandle(
        type: string,
        cb: (event: LayoutDropEvent) => PanelOptions
    ): void;
    setActivePanel(panel: IGroupPanel): void;
    focus(): void;
    toJSON(): SerializedDockview;
    fromJSON(data: SerializedDockview): void;
    deserialize: (data: SerializedDockview) => void;
}

export interface LayoutDropEvent {
    event: GroupDropEvent;
}

export class ComponentDockview
    extends BaseGrid<IGroupview>
    implements IComponentDockview {
    private readonly panels = new Map<string, IValueDisposable<IGroupPanel>>();
    private readonly dirtyPanels = new Set<IGroupPanel>();
    private readonly debouncedDeque = debounce(
        this.syncConfigs.bind(this),
        5000
    );
    // events
    private readonly _onTabInteractionEvent = new Emitter<LayoutMouseEvent>();
    readonly onTabInteractionEvent: Event<LayoutMouseEvent> = this
        ._onTabInteractionEvent.event;
    private readonly _onTabContextMenu = new Emitter<TabContextMenuEvent>();
    readonly onTabContextMenu: Event<TabContextMenuEvent> = this
        ._onTabContextMenu.event;
    // everything else
    private drag = new MutableDisposable();
    private _deserializer: IPanelDeserializer;
    private debugContainer: DebugWidget | undefined;
    private panelState: State = {};
    private registry = new Map<
        string,
        (event: LayoutDropEvent) => PanelOptions
    >();
    private _api: DockviewApi;

    addDndHandle(
        type: string,
        cb: (event: LayoutDropEvent) => PanelOptions
    ): void {
        this.registry.set(type, cb);
    }

    constructor(
        element: HTMLElement,
        public readonly options: DockviewOptions
    ) {
        super(element, {
            proportionalLayout: true,
            orientation: options.orientation,
            styles: options.styles,
        });

        if (!this.options.components) {
            this.options.components = {};
        }
        if (!this.options.frameworkComponents) {
            this.options.frameworkComponents = {};
        }
        if (!this.options.frameworkTabComponents) {
            this.options.frameworkTabComponents = {};
        }
        if (!this.options.tabComponents) {
            this.options.tabComponents = {};
        }
        if (
            !this.options.watermarkComponent &&
            !this.options.watermarkFrameworkComponent
        ) {
            this.options.watermarkComponent = Watermark;
        }

        this._api = new DockviewApi(this);

        this.updateContainer();
    }

    get totalPanels() {
        return this.panels.size;
    }

    get deserializer() {
        return this._deserializer;
    }

    set deserializer(value: IPanelDeserializer) {
        this._deserializer = value;
    }

    focus() {
        this.activeGroup?.focus();
    }

    public getGroupPanel(id: string): IGroupPanel | undefined {
        return this.panels.get(id)?.value;
    }

    public createDragTarget(
        target: {
            element: HTMLElement;
            content: string;
        },
        options: (() => PanelOptions) | PanelOptions
    ): IDisposable {
        const disposables = new CompositeDisposable(
            addDisposableListener(target.element, 'dragstart', (event) => {
                if (!event.dataTransfer) {
                    throw new Error('unsupported');
                }

                const panelOptions =
                    typeof options === 'function' ? options() : options;

                const panel = this.panels.get(panelOptions.id)?.value;
                if (panel) {
                    this.drag.value = panel.group.startActiveDrag(panel);
                }

                const data = JSON.stringify({
                    type: DragType.EXTERNAL,
                    ...panelOptions,
                });

                DataTransferSingleton.setData(this.id, data);

                event.dataTransfer.effectAllowed = 'move';

                const dragImage = document.createElement('div');
                dragImage.textContent = target.content;
                dragImage.classList.add('custom-dragging');

                document.body.appendChild(dragImage);
                event.dataTransfer.setDragImage(
                    dragImage,
                    event.offsetX,
                    event.offsetY
                );
                setTimeout(() => document.body.removeChild(dragImage), 0);

                event.dataTransfer.setData(DATA_KEY, data);
            }),
            addDisposableListener(this.element, 'dragend', (ev) => {
                // drop events fire before dragend so we can remove this safely
                DataTransferSingleton.removeData(this.id);
                this.drag.dispose();
            })
        );

        return disposables;
    }

    setActivePanel(panel: IGroupPanel) {
        this.doSetGroupActive(panel.group);
        panel.group.openPanel(panel);
    }

    public moveToNext(options: MovementOptions = {}) {
        if (!options.group) {
            if (!this.activeGroup) {
                return;
            }
            options.group = this.activeGroup;
        }

        if (options.includePanel && options.group) {
            if (
                options.group.activePanel !==
                options.group.panels[options.group.panels.length - 1]
            ) {
                options.group.moveToNext({ suppressRoll: true });
                return;
            }
        }

        const location = getGridLocation(options.group.element);
        const next = this.gridview.next(location)?.view as IGroupview;
        this.doSetGroupActive(next);
    }

    public moveToPrevious(options: MovementOptions = {}) {
        if (!options.group) {
            if (!this.activeGroup) {
                return;
            }
            options.group = this.activeGroup;
        }

        if (options.includePanel && options.group) {
            if (options.group.activePanel !== options.group.panels[0]) {
                options.group.moveToPrevious({ suppressRoll: true });
                return;
            }
        }

        const location = getGridLocation(options.group.element);
        const next = this.gridview.previous(location)?.view as IGroupview;
        this.doSetGroupActive(next);
    }

    public registerPanel(panel: IGroupPanel) {
        if (this.panels.has(panel.id)) {
            throw new Error(`panel ${panel.id} already exists`);
        }

        const disposable = new CompositeDisposable(
            panel.onDidStateChange(() => this.addDirtyPanel(panel))
        );

        this.panels.set(panel.id, { value: panel, disposable });

        this._onDidLayoutChange.fire({ kind: GroupChangeKind.PANEL_CREATED });
    }

    public unregisterPanel(panel: IGroupPanel) {
        if (!this.panels.has(panel.id)) {
            throw new Error(`panel ${panel.id} doesn't exist`);
        }
        const { disposable, value: unregisteredPanel } = this.panels.get(
            panel.id
        );

        disposable.dispose();
        unregisteredPanel.dispose();

        this.panels.delete(panel.id);

        this._onDidLayoutChange.fire({ kind: GroupChangeKind.PANEL_DESTROYED });
    }

    /**
     * Serialize the current state of the layout
     *
     * @returns A JSON respresentation of the layout
     */
    public toJSON(): SerializedDockview {
        this.syncConfigs();

        const data = this.gridview.serialize();

        const state = { ...this.panelState };

        // this.activeGroup.id

        const panels = Array.from(this.panels.values()).reduce(
            (collection, panel) => {
                if (!this.panelState[panel.value.id]) {
                    collection[panel.value.id] = panel.value.toJSON();
                }
                return collection;
            },
            state
        );

        return {
            grid: data,
            panels,
            activeGroup: this.activeGroup?.id,
            options: { tabHeight: this.getTabHeight() },
        };
    }

    /**
     * Ensure the local copy of the layout state is up-to-date
     */
    private syncConfigs() {
        const dirtyPanels = Array.from(this.dirtyPanels);

        if (dirtyPanels.length === 0) {
            console.debug('[layout#syncConfigs] no dirty panels');
        }

        this.dirtyPanels.clear();

        const partialPanelState = dirtyPanels
            .map((panel) => this.panels.get(panel.id))
            .filter((_) => !!_)
            .reduce((collection, panel) => {
                collection[panel.value.id] = panel.value.toJSON();
                return collection;
            }, {} as State);

        this.panelState = {
            ...this.panelState,
            ...partialPanelState,
        };

        dirtyPanels
            .filter((p) => this.panels.has(p.id))
            .forEach((panel) => {
                panel.setDirty(false);
                this._onDidLayoutChange.fire({
                    kind: GroupChangeKind.PANEL_CLEAN,
                });
            });

        this._onDidLayoutChange.fire({
            kind: GroupChangeKind.LAYOUT_CONFIG_UPDATED,
        });
    }

    public deserialize(data: SerializedDockview) {
        this.gridview.clear();
        this.panels.forEach((panel) => {
            panel.disposable.dispose();
            panel.value.dispose();
        });
        this.panels.clear();
        this.groups.clear();

        this.fromJSON(data);
        this.gridview.layout(this.width, this.height);
    }

    public fromJSON(data: SerializedDockview) {
        if (!this.deserializer) {
            throw new Error('invalid deserializer');
        }
        const { grid, panels, options, activeGroup } = data;

        if (typeof options?.tabHeight === 'number') {
            this.setTabHeight(options.tabHeight);
        }

        this.gridview.deserialize(
            grid,
            new DefaultDeserializer(this, {
                createPanel: (id) => {
                    const panelData = panels[id];
                    const panel = this.deserializer.fromJSON(panelData);
                    this.registerPanel(panel);
                    return panel;
                },
            })
        );

        if (typeof activeGroup === 'string') {
            this.doSetGroupActive(this.getPanel(activeGroup));
        }

        this._onDidLayoutChange.fire({ kind: GroupChangeKind.NEW_LAYOUT });
    }

    public async closeAllGroups() {
        for (const entry of this.groups.entries()) {
            const [key, group] = entry;

            const didCloseAll = await group.value.closeAllPanels();
            if (!didCloseAll) {
                return false;
            }
            await timeoutAsPromise(0);
        }
        return true;
    }

    public setTabHeight(height: number | undefined) {
        this.options.tabHeight = height;
        this.groups.forEach((value) => {
            value.value.tabHeight = height;
        });
    }

    public getTabHeight() {
        return this.options.tabHeight;
    }

    fireMouseEvent(event: LayoutMouseEvent) {
        switch (event.kind) {
            case MouseEventKind.CONTEXT_MENU:
                if (event.tab) {
                    this._onTabContextMenu.fire({
                        event: event.event,
                        api: this._api,
                        panel: event.panel,
                    });
                }
                break;
        }
    }

    public addPanel(options: AddPanelOptions): IGroupPanel {
        const panel = this._addPanel(options);

        let referenceGroup: IGroupview;

        if (options.position?.referencePanel) {
            const referencePanel = this.getGroupPanel(
                options.position.referencePanel
            );

            referenceGroup = this.findGroup(referencePanel);
        } else {
            referenceGroup = this.activeGroup;
        }

        if (referenceGroup) {
            const target = toTarget(options.position?.direction || 'within');
            if (target === Position.Center) {
                referenceGroup.openPanel(panel);
            } else {
                const location = getGridLocation(referenceGroup.element);
                const relativeLocation = getRelativeLocation(
                    this.gridview.orientation,
                    location,
                    target
                );
                this.addPanelToNewGroup(panel, relativeLocation);
            }
        } else {
            this.addPanelToNewGroup(panel);
        }

        return panel;
    }

    public _addPanel(options: AddPanelOptions): IGroupPanel {
        const contentPart = this.createContentComponent(
            options.id,
            options.componentName
        );
        const headerPart = this.createTabComponent(
            options.id,
            options.tabComponentName
        );

        const panel = new GroupviewPanel(options.id, this._api);
        panel.init({
            headerPart,
            contentPart,
            title: options.title || options.id,
            suppressClosable: options?.suppressClosable,
            params: options?.params || {},
        });

        this.registerPanel(panel);
        return panel;
    }

    createWatermarkComponent() {
        return createComponent(
            'watermark-id',
            'watermark-name',
            this.options.watermarkComponent
                ? { 'watermark-name': this.options.watermarkComponent }
                : {},
            this.options.watermarkFrameworkComponent
                ? { 'watermark-name': this.options.watermarkFrameworkComponent }
                : {},
            this.options.frameworkComponentFactory.watermark
        );
    }

    private createContentComponent(id: string, componentName: string) {
        return createComponent(
            id,
            componentName,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkComponentFactory.content
        );
    }

    private createTabComponent(id: string, componentName: string) {
        return createComponent(
            id,
            componentName,
            this.options.tabComponents,
            this.options.frameworkTabComponents,
            this.options.frameworkComponentFactory.tab,
            () => new DefaultTab()
        );
    }

    public addEmptyGroup(options: AddGroupOptions) {
        const group = this.createGroup();

        if (options) {
            const referencePanel = this.panels.get(options.referencePanel)
                .value;
            const referenceGroup = this.findGroup(referencePanel);

            const target = toTarget(options.direction);

            const location = getGridLocation(referenceGroup.element);
            const relativeLocation = getRelativeLocation(
                this.gridview.orientation,
                location,
                target
            );
            this.doAddGroup(group, relativeLocation);
        } else {
            this.doAddGroup(group);
        }
    }

    public removeGroup(group: IGroupview) {
        if (this.groups.size === 1) {
            group.panels.forEach((panel) => group.removePanel(panel));
            this._activeGroup = group;
            return;
        }

        super.removeGroup(group);
    }

    private addPanelToNewGroup(panel: IGroupPanel, location: number[] = [0]) {
        let group: IGroupview;

        if (
            this.groups.size === 1 &&
            Array.from(this.groups.values())[0].value.size === 0
        ) {
            group = Array.from(this.groups.values())[0].value;
        } else {
            group = this.createGroup();
            this.doAddGroup(group, location);
        }

        group.openPanel(panel);
    }

    public moveGroupOrPanel(
        referenceGroup: IGroupview,
        groupId: string,
        itemId: string,
        target: Position,
        index?: number
    ) {
        const sourceGroup = groupId
            ? this.groups.get(groupId).value
            : undefined;

        switch (target) {
            case Position.Center:
            case undefined:
                if (sourceGroup?.size === 0) {
                    this.doRemoveGroup(sourceGroup);
                }

                const groupItem =
                    sourceGroup?.removePanel(itemId) ||
                    this.panels.get(itemId).value;

                referenceGroup.openPanel(groupItem, index);

                return;
        }

        const referenceLocation = getGridLocation(referenceGroup.element);
        const targetLocation = getRelativeLocation(
            this.gridview.orientation,
            referenceLocation,
            target
        );

        if (sourceGroup?.size < 2) {
            const [targetParentLocation, to] = tail(targetLocation);
            const sourceLocation = getGridLocation(sourceGroup.element);
            const [sourceParentLocation, from] = tail(sourceLocation);

            if (sequenceEquals(sourceParentLocation, targetParentLocation)) {
                // special case when 'swapping' two views within same grid location
                // if a group has one tab - we are essentially moving the 'group'
                // which is equivalent to swapping two views in this case
                this.gridview.moveView(sourceParentLocation, from, to);

                return;
            }

            // source group will become empty so delete the group
            const targetGroup = this.doRemoveGroup(sourceGroup, {
                skipActive: true,
                skipDispose: true,
            }) as IGroupview;

            // after deleting the group we need to re-evaulate the ref location
            const updatedReferenceLocation = getGridLocation(
                referenceGroup.element
            );
            const location = getRelativeLocation(
                this.gridview.orientation,
                updatedReferenceLocation,
                target
            );
            this.doAddGroup(targetGroup, location);
        } else {
            const groupItem =
                sourceGroup?.removePanel(itemId) ||
                this.panels.get(itemId).value;
            const dropLocation = getRelativeLocation(
                this.gridview.orientation,
                referenceLocation,
                target
            );

            this.addPanelToNewGroup(groupItem, dropLocation);
        }
    }

    createGroup(options?: GroupOptions) {
        if (!options) {
            options = {};
        }
        if (typeof options.tabHeight !== 'number') {
            options.tabHeight = this.getTabHeight();
        }

        if (options?.id && this.groups.has(options.id)) {
            throw new Error(`duplicate group ${options.id}`);
        }

        const group = new Groupview(
            this,
            options?.id || nextGroupId.next(),
            options
        );

        if (typeof this.options.tabHeight === 'number') {
            group.tabHeight = this.options.tabHeight;
        }

        if (!this.groups.has(group.id)) {
            const disposable = new CompositeDisposable(
                group.onMove((event) => {
                    const { groupId, itemId, target, index } = event;
                    this.moveGroupOrPanel(
                        group,
                        groupId,
                        itemId,
                        target,
                        index
                    );
                }),
                group.onDidGroupChange((event) => {
                    this._onDidLayoutChange.fire(event);
                }),
                group.onDrop((event) => {
                    const dragEvent = event.event;
                    const dataTransfer = dragEvent.dataTransfer;
                    if (dataTransfer.types.length === 0) {
                        return;
                    }
                    const cb = this.registry.get(dataTransfer.types[0]);

                    if (!cb) {
                        return;
                    }

                    const panelOptions = cb({ event });

                    let panel = this.getGroupPanel(panelOptions.id);

                    if (!panel) {
                        panel = this._addPanel(panelOptions);
                    }
                    this.moveGroupOrPanel(
                        group,
                        panel?.group?.id,
                        panel.id,
                        event.target,
                        event.index
                    );
                })
            );

            this.groups.set(group.id, { value: group, disposable });
        }

        return group;
    }

    private findGroup(panel: IGroupPanel): IGroupview | undefined {
        return Array.from(this.groups.values()).find((group) =>
            group.value.containsPanel(panel)
        ).value;
    }

    private addDirtyPanel(panel: IGroupPanel) {
        this.dirtyPanels.add(panel);
        panel.setDirty(true);
        this._onDidLayoutChange.fire({ kind: GroupChangeKind.PANEL_DIRTY });
        this.debouncedDeque();
    }

    public dispose() {
        super.dispose();

        this.debugContainer?.dispose();

        this._onDidLayoutChange.dispose();
    }

    private updateContainer() {
        if (this.options.debug) {
            if (!this.debugContainer) {
                this.debugContainer = new DebugWidget(this);
            } else {
                this.debugContainer.dispose();
                this.debugContainer = undefined;
            }
        }
    }
}
