import {
    getRelativeLocation,
    SerializedGridObject,
    getGridLocation,
} from '../gridview/gridview';
import { Position } from '../dnd/droptarget';
import { tail, sequenceEquals } from '../array';
import { GroupviewPanelState, IGroupPanel } from '../groupview/groupPanel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
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
    IContentRenderer,
    ITabRenderer,
    IWatermarkRenderer,
} from '../groupview/types';
import { debounce } from '../functions';
import { sequentialNumberGenerator } from '../math';
import { DefaultDeserializer, IPanelDeserializer } from './deserializer';
import { createComponent } from '../panel/componentFactory';
import {
    AddGroupOptions,
    AddPanelOptions,
    PanelOptions,
    DockviewOptions as DockviewComponentOptions,
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
import { State } from '../api/panelApi';
import { LayoutMouseEvent, MouseEventKind } from '../groupview/tab';
import { Orientation } from '../splitview/core/splitview';
import { DefaultTab } from './components/tab/defaultTab';
import {
    GroupChangeKind,
    GroupDropEvent,
    GroupOptions,
    GroupPanelViewState,
} from '../groupview/groupview';
import { GroupviewPanel } from '../groupview/groupviewPanel';
import { DefaultGroupPanelView } from './defaultGroupPanelView';

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

export type DockviewComponentUpdateOptions = Pick<
    DockviewComponentOptions,
    | 'orientation'
    | 'components'
    | 'frameworkComponents'
    | 'tabComponents'
    | 'frameworkTabComponents'
>;

export interface IDockviewComponent extends IBaseGrid<GroupviewPanel> {
    readonly activeGroup: GroupviewPanel | undefined;
    tabHeight: number | undefined;
    updateOptions(options: DockviewComponentUpdateOptions): void;
    moveGroupOrPanel(
        referenceGroup: GroupviewPanel,
        groupId: string,
        itemId: string,
        target: Position,
        index?: number
    ): void;
    doSetGroupActive: (group: GroupviewPanel, skipFocus?: boolean) => void;
    removeGroup: (group: GroupviewPanel) => void;
    options: DockviewComponentOptions;
    addPanel(options: AddPanelOptions): IGroupPanel;
    getGroupPanel: (id: string) => IGroupPanel | undefined;
    fireMouseEvent(event: LayoutMouseEvent): void;
    createWatermarkComponent(): IWatermarkRenderer;
    totalPanels: number;
    // lifecycle
    addEmptyGroup(options?: AddGroupOptions): void;
    closeAllGroups: () => Promise<boolean>;
    deserializer: IPanelDeserializer | undefined;
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
    extends BaseGrid<GroupviewPanel>
    implements IDockviewComponent
{
    private readonly panels = new Map<string, IValueDisposable<IGroupPanel>>();
    private readonly dirtyPanels = new Set<IGroupPanel>();
    private readonly debouncedDeque = debounce(
        this.syncConfigs.bind(this),
        5000
    );
    // events
    private readonly _onTabInteractionEvent = new Emitter<LayoutMouseEvent>();
    readonly onTabInteractionEvent: Event<LayoutMouseEvent> =
        this._onTabInteractionEvent.event;
    private readonly _onTabContextMenu = new Emitter<TabContextMenuEvent>();
    readonly onTabContextMenu: Event<TabContextMenuEvent> =
        this._onTabContextMenu.event;
    // everything else
    private drag = new MutableDisposable();
    private _deserializer: IPanelDeserializer | undefined;
    private panelState: State = {};
    private registry = new Map<
        string,
        (event: LayoutDropEvent) => PanelOptions
    >();
    private _api: DockviewApi;
    private _options: DockviewComponentOptions;

    private _onDidLayoutChange = new Emitter<void>();
    readonly onDidLayoutChange = this._onDidLayoutChange.event;

    get totalPanels(): number {
        return this.panels.size;
    }

    get deserializer(): IPanelDeserializer | undefined {
        return this._deserializer;
    }

    set deserializer(value: IPanelDeserializer | undefined) {
        this._deserializer = value;
    }

    get options() {
        return this._options;
    }

    set tabHeight(height: number | undefined) {
        this.options.tabHeight = height;
        this.groups.forEach((value) => {
            value.value.model.tabHeight = height;
        });
    }

    get tabHeight(): number | undefined {
        return this.options.tabHeight;
    }

    constructor(element: HTMLElement, options: DockviewComponentOptions) {
        super(element, {
            proportionalLayout: true,
            orientation: options.orientation || Orientation.HORIZONTAL,
            styles: options.styles,
        });

        this._options = options;

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
                            GroupChangeKind.REMOVE_PANEL,
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

    updateOptions(options: DockviewComponentUpdateOptions): void {
        const hasOrientationChanged =
            typeof options.orientation === 'string' &&
            this.options.orientation !== options.orientation;

        // TODO support style update
        // const hasStylesChanged =
        //     typeof options.styles === 'object' &&
        //     this.options.styles !== options.styles;

        this._options = { ...this.options, ...options };

        if (hasOrientationChanged) {
            this.gridview.orientation = options.orientation!;
        }

        this.layout(this.gridview.width, this.gridview.height, true);
    }

    addDndHandle(
        type: string,
        cb: (event: LayoutDropEvent) => PanelOptions
    ): void {
        this.registry.set(type, cb);
    }

    focus(): void {
        this.activeGroup?.focus();
    }

    getGroupPanel(id: string): IGroupPanel | undefined {
        return this.panels.get(id)?.value;
    }

    createDragTarget(
        target: {
            element: HTMLElement;
            content: string;
        },
        options: (() => PanelOptions) | PanelOptions
    ): IDisposable {
        return new CompositeDisposable(
            addDisposableListener(target.element, 'dragstart', (event) => {
                if (!event.dataTransfer) {
                    throw new Error('unsupported');
                }

                const panelOptions =
                    typeof options === 'function' ? options() : options;

                const panel = this.panels.get(panelOptions.id)?.value;
                if (panel) {
                    this.drag.value = panel.group!.model.startActiveDrag(panel);
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
    }

    setActivePanel(panel: IGroupPanel): void {
        if (!panel.group) {
            throw new Error(`Panel ${panel.id} has no associated group`);
        }
        this.doSetGroupActive(panel.group);
        panel.group.model.openPanel(panel);
    }

    moveToNext(options: MovementOptions = {}): void {
        if (!options.group) {
            if (!this.activeGroup) {
                return;
            }
            options.group = this.activeGroup;
        }

        if (options.includePanel && options.group) {
            if (
                options.group.model.activePanel !==
                options.group.model.panels[
                    options.group.model.panels.length - 1
                ]
            ) {
                options.group.model.moveToNext({ suppressRoll: true });
                return;
            }
        }

        const location = getGridLocation(options.group.element);
        const next = this.gridview.next(location)?.view as GroupviewPanel;
        this.doSetGroupActive(next);
    }

    moveToPrevious(options: MovementOptions = {}): void {
        if (!options.group) {
            if (!this.activeGroup) {
                return;
            }
            options.group = this.activeGroup;
        }

        if (options.includePanel && options.group) {
            if (
                options.group.model.activePanel !==
                options.group.model.panels[0]
            ) {
                options.group.model.moveToPrevious({ suppressRoll: true });
                return;
            }
        }

        const location = getGridLocation(options.group.element);
        const next = this.gridview.previous(location)?.view;
        if (next) {
            this.doSetGroupActive(next as GroupviewPanel);
        }
    }

    registerPanel(panel: IGroupPanel): void {
        if (this.panels.has(panel.id)) {
            throw new Error(`panel ${panel.id} already exists`);
        }

        const disposable = new CompositeDisposable(
            panel.onDidStateChange(() => this.addDirtyPanel(panel))
        );

        this.panels.set(panel.id, { value: panel, disposable });

        this._onGridEvent.fire({ kind: GroupChangeKind.PANEL_CREATED });
    }

    unregisterPanel(panel: IGroupPanel): void {
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
    toJSON(): SerializedDockview {
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
            options: { tabHeight: this.tabHeight },
        };
    }

    fromJSON(data: SerializedDockview): void {
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
            this.tabHeight = options.tabHeight;
        }

        if (!this.deserializer) {
            throw new Error('no deserializer provided');
        }

        this.gridview.deserialize(
            grid,
            new DefaultDeserializer(this, {
                createPanel: (id) => {
                    const panelData = panels[id];
                    const panel = this.deserializer!.fromJSON(panelData);
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

    async closeAllGroups(): Promise<boolean> {
        for (const entry of this.groups.entries()) {
            const [_, group] = entry;

            const didCloseAll = await group.value.model.closeAllPanels();
            if (!didCloseAll) {
                return false;
            }
            await timeoutAsPromise(0);
        }
        return true;
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

    addPanel(options: AddPanelOptions): IGroupPanel {
        const panel = this._addPanel(options);

        let referenceGroup: GroupviewPanel | undefined;

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
                referenceGroup.model.openPanel(panel);
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

    createWatermarkComponent(): IWatermarkRenderer {
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

    addEmptyGroup(options: AddGroupOptions): void {
        const group = this.createGroup();

        if (options) {
            const referencePanel = this.panels.get(
                options.referencePanel
            )?.value;

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

    removeGroup(group: GroupviewPanel): void {
        const panels = [...group.model.panels]; // reassign since group panels will mutate
        panels.forEach((panel) => {
            group.model.removePanel(panel);
            this.unregisterPanel(panel);
        });

        if (this.groups.size === 1) {
            this._activeGroup = group;
            return;
        }

        super.removeGroup(group);
    }

    moveGroupOrPanel(
        referenceGroup: GroupviewPanel,
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
                sourceGroup?.model.removePanel(itemId) ||
                this.panels.get(itemId)?.value;

            if (!groupItem) {
                throw new Error(`No panel with id ${itemId}`);
            }

            if (sourceGroup?.model.size === 0) {
                this.doRemoveGroup(sourceGroup);
            }

            referenceGroup.model.openPanel(groupItem, { index });
        } else {
            const referenceLocation = getGridLocation(referenceGroup.element);
            const targetLocation = getRelativeLocation(
                this.gridview.orientation,
                referenceLocation,
                target
            );

            if (sourceGroup && sourceGroup.model.size < 2) {
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
                    });

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
                    sourceGroup?.model.removePanel(itemId) ||
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

    createGroup(options?: GroupOptions): GroupviewPanel {
        if (!options) {
            options = { tabHeight: this.tabHeight };
        }
        if (typeof options.tabHeight !== 'number') {
            options.tabHeight = this.tabHeight;
        }

        let id = options?.id;

        if (id && this.groups.has(options.id!)) {
            console.warn(
                `Duplicate group id ${options?.id}. reassigning group id to avoid errors`
            );
            id = undefined;
        }

        if (!id) {
            id = nextGroupId.next();
            while (this.groups.has(id)) {
                id = nextGroupId.next();
            }
        }

        const view = new GroupviewPanel(this, id, options);

        if (typeof this.options.tabHeight === 'number') {
            view.model.tabHeight = this.options.tabHeight;
        }

        if (!this.groups.has(view.id)) {
            const disposable = new CompositeDisposable(
                view.model.onMove((event) => {
                    const { groupId, itemId, target, index } = event;
                    this.moveGroupOrPanel(view, groupId, itemId, target, index);
                }),
                view.model.onDidGroupChange((event) => {
                    this._onGridEvent.fire(event);
                }),
                view.model.onDrop((event) => {
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
                        view,
                        groupId,
                        panel.id,
                        event.target,
                        event.index
                    );
                })
            );

            this.groups.set(view.id, { value: view, disposable });
        }

        return view;
    }

    dispose(): void {
        super.dispose();

        this._onGridEvent.dispose();
    }

    /**
     * Ensure the local copy of the layout state is up-to-date
     */
    private syncConfigs(): void {
        const dirtyPanels = Array.from(this.dirtyPanels);

        if (dirtyPanels.length === 0) {
            // console.debug('[layout#syncConfigs] no dirty panels');
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

    private _addPanel(options: AddPanelOptions): IGroupPanel {
        const view = new DefaultGroupPanelView({
            content: this.createContentComponent(options.id, options.component),
            tab: this.createTabComponent(options.id, options.tabComponent),
        });

        const panel: IGroupPanel = new DockviewGroupPanel(
            options.id,
            this._api
        );
        panel.init({
            view,
            title: options.title || options.id,
            suppressClosable: options?.suppressClosable,
            params: options?.params || {},
        });

        this.registerPanel(panel);
        return panel;
    }

    private createContentComponent(
        id: string,
        componentName: string
    ): IContentRenderer {
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
    ): ITabRenderer {
        return createComponent(
            id,
            componentName,
            this.options.tabComponents || {},
            this.options.frameworkTabComponents,
            this.options.frameworkComponentFactory?.tab,
            () => new DefaultTab()
        );
    }

    private addPanelToNewGroup(
        panel: IGroupPanel,
        location: number[] = [0]
    ): void {
        const group = this.createGroup();
        this.doAddGroup(group, location);

        group.model.openPanel(panel);
    }

    private findGroup(panel: IGroupPanel): GroupviewPanel | undefined {
        return Array.from(this.groups.values()).find((group) =>
            group.value.model.containsPanel(panel)
        )?.value;
    }

    private addDirtyPanel(panel: IGroupPanel): void {
        this.dirtyPanels.add(panel);
        panel.setDirty(true);
        this._onGridEvent.fire({ kind: GroupChangeKind.PANEL_DIRTY });
        this.debouncedDeque();
    }
}
