import { getRelativeLocation } from '../gridview/gridview';
import { Position } from '../groupview/droptarget/droptarget';
import { getGridLocation } from '../gridview/gridview';
import { tail, sequenceEquals } from '../array';
import {
    IGroupview,
    Groupview,
    GroupOptions,
    GroupChangeKind,
    GroupChangeEvent,
    GroupDropEvent,
} from '../groupview/groupview';
import { IGroupPanel } from '../groupview/panel/types';
import { DefaultPanel } from '../groupview/panel/panel';
import {
    CompositeDisposable,
    IDisposable,
    IValueDisposable,
} from '../lifecycle';
import { Event, Emitter, addDisposableListener } from '../events';
import { Watermark } from './components/watermark/watermark';
import { timeoutPromise } from '../async';
import { DebugWidget } from './components/debug/debug';
import {
    PanelContentPartConstructor,
    PanelHeaderPartConstructor,
} from '../groupview/panel/parts';
import { debounce } from '../functions';
import { sequentialNumberGenerator } from '../math';
import { DefaultDeserializer, IPanelDeserializer } from './deserializer';
import { createContentComponent, createTabComponent } from './componentFactory';
import {
    AddGroupOptions,
    AddPanelOptions,
    PanelOptions,
    LayoutOptions,
    MovementOptions,
    TabContextMenuEvent,
} from './options';
import {
    DataTransferSingleton,
    DATA_KEY,
    DragType,
} from '../groupview/droptarget/dataTransfer';
import { LayoutMouseEvent, MouseEventKind } from '../groupview/events';
import { BaseGrid, IBaseGrid, toTarget } from './baseGrid';

const nextGroupId = sequentialNumberGenerator();

export interface PanelReference {
    update: (event: { params: { [key: string]: any } }) => void;
    remove: () => void;
}

export interface Api {
    readonly minimumHeight: number;
    readonly maximumHeight: number;
    readonly minimumWidth: number;
    readonly maximumWidth: number;
    layout(width: number, height: number): void;
    //
    setAutoResizeToFit(enabled: boolean): void;
    resizeToFit(): void;
    setTabHeight(height: number): void;
    getTabHeight(): number;
    readonly size: number;
    totalPanels: number;
    // lifecycle
    addPanelFromComponent(options: AddPanelOptions): PanelReference;
    addEmptyGroup(options?: AddGroupOptions): void;
    closeAllGroups: () => Promise<boolean>;
    toJSON(): object;
    deserialize: (data: object) => void;
    deserializer: IPanelDeserializer;
    // events
    readonly onDidLayoutChange: Event<GroupChangeEvent>;
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
    readonly activeGroup: IGroupview;
}

export interface IGroupAccessor {
    readonly id: string;
    getGroup: (id: string) => IGroupview;
    moveGroupOrPanel(
        referenceGroup: IGroupview,
        groupId: string,
        itemId: string,
        target: Position,
        index?: number
    ): void;
    doSetGroupActive: (group: IGroupview) => void;
    removeGroup: (group: IGroupview) => void;
    readonly size: number;
    totalPanels: number;
    options: LayoutOptions;
    readonly onDidLayoutChange: Event<GroupChangeEvent>;
    //
    addPanelFromComponent(options: AddPanelOptions): PanelReference;
    addPanel(options: AddPanelOptions): IGroupPanel;
    //
    getPanel: (id: string) => IGroupPanel;
    fireMouseEvent(event: LayoutMouseEvent): void;
}

export interface ILayout extends IGroupAccessor, Api, IBaseGrid<IGroupview> {}

export interface LayoutDropEvent {
    event: GroupDropEvent;
}

export class Layout extends BaseGrid<IGroupview> implements ILayout {
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
    private drag: IDisposable;
    private _deserializer: IPanelDeserializer;
    private debugContainer: DebugWidget;
    private panelState = {};
    private registry = new Map<
        string,
        (event: LayoutDropEvent) => PanelOptions
    >();

    addDndHandle(
        type: string,
        cb: (event: LayoutDropEvent) => PanelOptions
    ): void {
        this.registry.set(type, cb);
    }

    constructor(element: HTMLElement, public readonly options: LayoutOptions) {
        super(element, {
            proportionalLayout: true,
            orientation: options.orientation,
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
        if (!this.options.watermarkComponent) {
            this.options.watermarkComponent = Watermark;
        }

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

    public getPanel(id: string): IGroupPanel {
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
                const panelOptions =
                    typeof options === 'function' ? options() : options;

                const panel = this.panels.get(panelOptions.id)?.value;
                if (panel) {
                    this.drag = panel.group.startActiveDrag(panel);
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
                this.drag?.dispose();
                this.drag = undefined;
            })
        );

        return disposables;
    }

    public moveToNext(options?: MovementOptions) {
        if (!options) {
            options = {};
        }
        if (!options.group) {
            options.group = this.activeGroup;
        }

        if (options.includePanel) {
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

    public moveToPrevious(options?: MovementOptions) {
        if (!options) {
            options = {};
        }
        if (!options.group) {
            options.group = this.activeGroup;
        }

        if (options.includePanel) {
            if (options.group.activePanel !== options.group.panels[0]) {
                options.group.moveToPrevious({ suppressRoll: true });
                return;
            }
        }

        const location = getGridLocation(options.group.element);
        const next = this.gridview.preivous(location)?.view as IGroupview;
        this.doSetGroupActive(next);
    }

    public registerPanel(panel: IGroupPanel) {
        if (this.panels.has(panel.id)) {
            throw new Error(`panel ${panel.id} already exists`);
        }

        const disposable = new CompositeDisposable(
            panel.onDidStateChange((e) => this.addDirtyPanel(panel))
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
    public toJSON() {
        this.syncConfigs();

        const data = this.gridview.serialize();

        const state = { ...this.panelState };

        const panels = Array.from(this.panels.values()).reduce(
            (collection, panel) => {
                if (!this.panelState[panel.value.id]) {
                    collection[panel.value.id] = panel.value.toJSON();
                }
                return collection;
            },
            state
        );

        return { grid: data, panels };
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
            }, {});

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

    public deserialize(data: any) {
        this.gridview.clear();
        this.panels.forEach((panel) => {
            panel.disposable.dispose();
            panel.value.dispose();
        });
        this.panels.clear();
        this.groups.clear();

        this.fromJSON(data, this.deserializer);
        this.gridview.layout(this._size, this._orthogonalSize);
    }

    public fromJSON(data: any, deserializer: IPanelDeserializer) {
        const { grid, panels } = data;

        this.gridview.deserialize(
            grid,
            new DefaultDeserializer(this, {
                createPanel: (id) => {
                    const panelData = panels[id];
                    const panel = deserializer.fromJSON(panelData);
                    this.registerPanel(panel);
                    return panel;
                },
            })
        );
        this._onDidLayoutChange.fire({ kind: GroupChangeKind.NEW_LAYOUT });
    }

    public async closeAllGroups() {
        for (const entry of this.groups.entries()) {
            const [key, group] = entry;

            const didCloseAll = await group.value.closeAllPanels();
            if (!didCloseAll) {
                return false;
            }
            await timeoutPromise(0);
        }
        return true;
    }

    public setTabHeight(height: number) {
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
                        api: this,
                        panel: event.panel,
                    });
                }
                break;
        }
    }

    public addPanelFromComponent(options: AddPanelOptions): PanelReference {
        const panel = this.addPanel(options);

        if (options.position?.referencePanel) {
            const referencePanel = this.panels.get(
                options.position.referencePanel
            ).value;
            const referenceGroup = this.findGroup(referencePanel);

            const target = toTarget(options.position.direction);
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

        return {
            update: (event: { params: { [key: string]: any } }) => {
                if (panel.update) {
                    panel.update({ params: event.params });
                }
            },
            remove: () => {
                const group = this.findGroup(panel);
                group.removePanel(panel);
            },
        };
    }

    public addPanel(options: AddPanelOptions): IGroupPanel {
        const component = this.createContentComponent(
            options.id,
            options.componentName
        );
        const tabComponent = this.createTabComponent(
            options.id,
            options.tabComponentName
        );

        const panel = new DefaultPanel(options.id, tabComponent, component);
        panel.init({
            title: options.title || options.id,
            suppressClosable: options?.suppressClosable,
            params: options?.params || {},
        });

        this.registerPanel(panel);
        return panel;
    }

    private createContentComponent(
        id: string,
        componentName: string | PanelContentPartConstructor
    ) {
        return createContentComponent(
            id,
            componentName,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkComponentFactory.content
        );
    }

    private createTabComponent(
        id: string,
        componentName: string | PanelHeaderPartConstructor
    ) {
        return createTabComponent(
            id,
            componentName,
            this.options.tabComponents,
            this.options.frameworkTabComponents,
            this.options.frameworkComponentFactory.tab
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
                const groupItem =
                    sourceGroup?.removePanel(itemId) ||
                    this.panels.get(itemId).value;
                if (sourceGroup?.size === 0) {
                    this.doRemoveGroup(sourceGroup);
                }
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
        const group = new Groupview(this, nextGroupId.next(), options);

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
                    if (!this.registry.has(dataTransfer.types[0])) {
                        return;
                    }
                    const cb = this.registry.get(dataTransfer.types[0]);

                    const panelOptions = cb({ event });

                    let panel = this.getPanel(panelOptions.id);

                    if (!panel) {
                        panel = this.addPanel(panelOptions);
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
