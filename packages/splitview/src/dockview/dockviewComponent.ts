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
    GroupPanelViewState,
    IGroupItem,
} from '../groupview/groupview';
import {
    GroupviewPanel,
    GroupviewPanelState,
    IGroupPanel,
} from '../groupview/groupviewPanel';
import {
    CompositeDisposable,
    IDisposable,
    IValueDisposable,
    MutableDisposable,
} from '../lifecycle';
import { Event, Emitter, addDisposableListener } from '../events';
import { Watermark } from './components/watermark/watermark';
import { timeoutAsPromise } from '../async';
import {
    PanelContentPart,
    PanelHeaderPart,
    WatermarkPart,
} from '../groupview/types';
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
import {
    DATA_KEY,
    DragType,
    LocalSelectionTransfer,
} from '../dnd/dataTransfer';
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
        root: SerializedGridObject<GroupPanelViewState>;
        height: number;
        width: number;
        orientation: Orientation;
    };
    panels: { [key: string]: GroupviewPanelState };
    activeGroup?: string;
    options: { tabHeight?: number };
}

export interface IDockviewComponent extends IBaseGrid<IGroupview> {
    readonly activeGroup: IGroupview | undefined;
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
    getGroupPanel: (id: string) => IGroupPanel | undefined;
    fireMouseEvent(event: LayoutMouseEvent): void;
    createWatermarkComponent(): WatermarkPart;
    setTabHeight(height: number | undefined): void;
    getTabHeight(): number | undefined;
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
    onDidLayoutChange: Event<void>;
}

export interface LayoutDropEvent {
    event: GroupDropEvent;
}

export class DockviewComponent
    extends BaseGrid<IGroupview>
    implements IDockviewComponent {
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
    private panelState: State = {};
    private registry = new Map<
        string,
        (event: LayoutDropEvent) => PanelOptions
    >();
    private _api: DockviewApi;

    private _onDidLayoutChange = new Emitter<void>();
    readonly onDidLayoutChange = this._onDidLayoutChange.event;

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
            orientation: options.orientation || Orientation.HORIZONTAL,
            styles: options.styles,
        });

        this.addDisposables(
            (() => {
                /**
                 * TODO Fix this relatively ugly 'merge and delay'
                 */
                let timer: any;

                return this.onGridEvent((event) => {
                    if (
                        [
                            GroupChangeKind.ADD_GROUP,
                            GroupChangeKind.REMOVE_GROUP,
                            GroupChangeKind.ADD_PANEL,
                            GroupChangeKind.REMOVE_GROUP,
                            GroupChangeKind.GROUP_ACTIVE,
                            GroupChangeKind.PANEL_ACTIVE,
                            GroupChangeKind.LAYOUT,
                        ].includes(event.kind)
                    ) {
                        if (timer) {
                            clearTimeout(timer);
                        }
                        timer = setTimeout(() => {
                            this._onDidLayoutChange.fire();
                            clearTimeout(timer);
                        });
                    }
                });
            })()
        );

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
    }

    get totalPanels(): number {
        return this.panels.size;
    }

    get deserializer(): IPanelDeserializer {
        return this._deserializer;
    }

    set deserializer(value: IPanelDeserializer) {
        this._deserializer = value;
    }

    focus(): void {
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
                    this.drag.value = panel.group!.startActiveDrag(panel);
                }

                const data = JSON.stringify({
                    type: DragType.EXTERNAL,
                    ...panelOptions,
                });

                LocalSelectionTransfer.getInstance().setData([data], this.id);

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
                LocalSelectionTransfer.getInstance().clearData(this.id);
                this.drag.dispose();
            })
        );

        return disposables;
    }

    setActivePanel(panel: IGroupPanel): void {
        if (!panel.group) {
            throw new Error(`Panel ${panel.id} has no associated group`);
        }
        this.doSetGroupActive(panel.group);
        panel.group.openPanel(panel);
    }

    public moveToNext(options: MovementOptions = {}): void {
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

    public moveToPrevious(options: MovementOptions = {}): void {
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
        const next = this.gridview.previous(location)?.view;
        if (next) {
            this.doSetGroupActive(next as IGroupview);
        }
    }

    public registerPanel(panel: IGroupPanel): void {
        if (this.panels.has(panel.id)) {
            throw new Error(`panel ${panel.id} already exists`);
        }

        const disposable = new CompositeDisposable(
            panel.onDidStateChange(() => this.addDirtyPanel(panel))
        );

        this.panels.set(panel.id, { value: panel, disposable });

        this._onGridEvent.fire({ kind: GroupChangeKind.PANEL_CREATED });
    }

    public unregisterPanel(panel: IGroupPanel): void {
        if (!this.panels.has(panel.id)) {
            throw new Error(`panel ${panel.id} doesn't exist`);
        }
        const item = this.panels.get(panel.id);

        if (item) {
            item.disposable.dispose();
            item.value.dispose();
        }

        this.panels.delete(panel.id);

        this._onGridEvent.fire({ kind: GroupChangeKind.PANEL_DESTROYED });
    }

    /**
     * Serialize the current state of the layout
     *
     * @returns A JSON respresentation of the layout
     */
    public toJSON(): SerializedDockview {
        this.syncConfigs();

        const data = this.gridview.serialize();

        // const state = { ...this.panelState };

        const panels = Array.from(this.panels.values()).reduce(
            (collection, panel) => {
                if (!this.panelState[panel.value.id]) {
                    collection[panel.value.id] = panel.value.toJSON();
                }
                return collection;
            },
            {} as { [key: string]: GroupviewPanelState }
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
    private syncConfigs(): void {
        const dirtyPanels = Array.from(this.dirtyPanels);

        if (dirtyPanels.length === 0) {
            console.debug('[layout#syncConfigs] no dirty panels');
        }

        this.dirtyPanels.clear();

        const partialPanelState = dirtyPanels
            .map((panel) => this.panels.get(panel.id))
            .filter((_) => !!_)
            .reduce((collection, panel) => {
                collection[panel!.value.id] = panel!.value.toJSON();
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
                this._onGridEvent.fire({
                    kind: GroupChangeKind.PANEL_CLEAN,
                });
            });

        this._onGridEvent.fire({
            kind: GroupChangeKind.LAYOUT_CONFIG_UPDATED,
        });
    }

    public fromJSON(data: SerializedDockview): void {
        this.gridview.clear();
        this.panels.forEach((panel) => {
            panel.disposable.dispose();
            panel.value.dispose();
        });
        this.panels.clear();
        this.groups.clear();

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
            const panel = this.getPanel(activeGroup);
            if (panel) {
                this.doSetGroupActive(panel);
            }
        }

        this.gridview.layout(this.width, this.height);

        this._onGridEvent.fire({ kind: GroupChangeKind.NEW_LAYOUT });
    }

    public async closeAllGroups(): Promise<boolean> {
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

    public setTabHeight(height: number | undefined): void {
        this.options.tabHeight = height;
        this.groups.forEach((value) => {
            value.value.tabHeight = height;
        });
    }

    public getTabHeight(): number | undefined {
        return this.options.tabHeight;
    }

    fireMouseEvent(event: LayoutMouseEvent): void {
        switch (event.kind) {
            case MouseEventKind.CONTEXT_MENU:
                if (event.tab && event.panel) {
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

        let referenceGroup: IGroupview | undefined;

        if (options.position?.referencePanel) {
            const referencePanel = this.getGroupPanel(
                options.position.referencePanel
            );

            if (!referencePanel) {
                throw new Error(
                    `referencePanel ${options.position.referencePanel} does not exist`
                );
            }

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
            options.component
        );
        const headerPart = this.createTabComponent(
            options.id,
            options.tabComponent
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

    createWatermarkComponent(): WatermarkPart {
        return createComponent(
            'watermark-id',
            'watermark-name',
            this.options.watermarkComponent
                ? { 'watermark-name': this.options.watermarkComponent }
                : {},
            this.options.watermarkFrameworkComponent
                ? { 'watermark-name': this.options.watermarkFrameworkComponent }
                : {},
            this.options.frameworkComponentFactory?.watermark
        );
    }

    private createContentComponent(
        id: string,
        componentName: string
    ): PanelContentPart {
        return createComponent(
            id,
            componentName,
            this.options.components || {},
            this.options.frameworkComponents,
            this.options.frameworkComponentFactory?.content
        );
    }

    private createTabComponent(
        id: string,
        componentName?: string
    ): PanelHeaderPart {
        return createComponent(
            id,
            componentName,
            this.options.tabComponents || {},
            this.options.frameworkTabComponents,
            this.options.frameworkComponentFactory?.tab,
            () => new DefaultTab()
        );
    }

    public addEmptyGroup(options: AddGroupOptions): void {
        const group = this.createGroup();

        if (options) {
            const referencePanel = this.panels.get(options.referencePanel)
                ?.value;

            if (!referencePanel) {
                throw new Error(
                    `reference panel ${options.referencePanel} does not exist`
                );
            }

            const referenceGroup = this.findGroup(referencePanel);

            if (!referenceGroup) {
                throw new Error(
                    `reference group for reference panel ${options.referencePanel} does not exist`
                );
            }

            const target = toTarget(options.direction || 'within');

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

    public removeGroup(group: IGroupview): void {
        const panels = [...group.panels]; // reassign since group panels will mutate
        panels.forEach((panel) => {
            group.removePanel(panel);
            this.unregisterPanel(panel);
        });

        if (this.groups.size === 1) {
            this._activeGroup = group;
            return;
        }

        super.removeGroup(group);
    }

    private addPanelToNewGroup(
        panel: IGroupPanel,
        location: number[] = [0]
    ): void {
        let group: IGroupview;

        // if (
        //     this.groups.size === 1 &&
        //     Array.from(this.groups.values())[0].value.size === 0
        // ) {
        //     group = Array.from(this.groups.values())[0].value;
        // } else {
        group! = this.createGroup();
        this.doAddGroup(group, location);
        // }

        group.openPanel(panel);
    }

    public moveGroupOrPanel(
        referenceGroup: IGroupview,
        groupId: string,
        itemId: string,
        target: Position,
        index?: number
    ): void {
        const sourceGroup = groupId
            ? this.groups.get(groupId)?.value
            : undefined;

        if (!target || target === Position.Center) {
            const groupItem: IGroupPanel | undefined =
                sourceGroup?.removePanel(itemId) ||
                this.panels.get(itemId)?.value;

            if (!groupItem) {
                throw new Error(`No panel with id ${itemId}`);
            }

            if (sourceGroup?.size === 0) {
                this.doRemoveGroup(sourceGroup);
            }

            referenceGroup.openPanel(groupItem, { index });
            return;
        } else {
            const referenceLocation = getGridLocation(referenceGroup.element);
            const targetLocation = getRelativeLocation(
                this.gridview.orientation,
                referenceLocation,
                target
            );

            if (sourceGroup && sourceGroup.size < 2) {
                const [targetParentLocation, to] = tail(targetLocation);
                const sourceLocation = getGridLocation(sourceGroup.element);
                const [sourceParentLocation, from] = tail(sourceLocation);

                if (
                    sequenceEquals(sourceParentLocation, targetParentLocation)
                ) {
                    // special case when 'swapping' two views within same grid location
                    // if a group has one tab - we are essentially moving the 'group'
                    // which is equivalent to swapping two views in this case
                    this.gridview.moveView(sourceParentLocation, from, to);
                } else {
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
                }
            } else {
                const groupItem: IGroupPanel | undefined =
                    sourceGroup?.removePanel(itemId) ||
                    this.panels.get(itemId)?.value;

                if (!groupItem) {
                    throw new Error(`No panel with id ${itemId}`);
                }

                const dropLocation = getRelativeLocation(
                    this.gridview.orientation,
                    referenceLocation,
                    target
                );

                this.addPanelToNewGroup(groupItem, dropLocation);
            }
        }
    }

    createGroup(options?: GroupOptions): IGroupview {
        if (!options) {
            options = { tabHeight: this.getTabHeight() };
        }
        if (typeof options.tabHeight !== 'number') {
            options.tabHeight = this.getTabHeight();
        }

        let id = options?.id;

        if (id && this.groups.has(options.id!)) {
            console.warn(
                `Duplicate group id ${options?.id}. reassigning group id to avoid errors`
            );
            id = undefined;
            // throw new Error(`duplicate group ${options.id}`);
        }

        if (!id) {
            id = nextGroupId.next();
            while (this.groups.has(id)) {
                id = nextGroupId.next();
            }
        }

        const group = new Groupview(this, id, options);

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
                    this._onGridEvent.fire(event);
                }),
                group.onDrop((event) => {
                    const dragEvent = event.event;
                    const dataTransfer = dragEvent.dataTransfer;

                    if (!dataTransfer) {
                        return;
                    }

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

                    const groupId = panel.group?.id;

                    if (!groupId) {
                        throw new Error(
                            `Panel ${panel.id} has no associated group`
                        );
                    }

                    this.moveGroupOrPanel(
                        group,
                        groupId,
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
        )?.value;
    }

    private addDirtyPanel(panel: IGroupPanel): void {
        this.dirtyPanels.add(panel);
        panel.setDirty(true);
        this._onGridEvent.fire({ kind: GroupChangeKind.PANEL_DIRTY });
        this.debouncedDeque();
    }

    public dispose(): void {
        super.dispose();

        this._onGridEvent.dispose();
    }
}
