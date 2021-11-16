import {
    getRelativeLocation,
    SerializedGridObject,
    getGridLocation,
} from '../gridview/gridview';
import { Position } from '../dnd/droptarget';
import { tail, sequenceEquals } from '../array';
import { GroupviewPanelState, IGroupPanel } from '../groupview/groupPanel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { CompositeDisposable, IValueDisposable } from '../lifecycle';
import { Event, Emitter } from '../events';
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
    DockviewOptions as DockviewComponentOptions,
    MovementOptions,
    TabContextMenuEvent,
} from './options';
import {
    BaseGrid,
    GroupChangeKind,
    IBaseGrid,
    toTarget,
} from '../gridview/baseComponentGridview';
import { DockviewApi } from '../api/component.api';
import { State } from '../api/panelApi';
import { LayoutMouseEvent, MouseEventKind } from '../groupview/tab';
import { Orientation } from '../splitview/core/splitview';
import { DefaultTab } from './components/tab/defaultTab';
import {
    GroupChangeKind2,
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
    readonly activePanel: IGroupPanel | undefined;
    readonly totalPanels: number;
    readonly panels: IGroupPanel[];
    tabHeight: number | undefined;
    deserializer: IPanelDeserializer | undefined;
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
    removePanel(panel: IGroupPanel): void;
    getGroupPanel: (id: string) => IGroupPanel | undefined;
    fireMouseEvent(event: LayoutMouseEvent): void;
    createWatermarkComponent(): IWatermarkRenderer;

    // lifecycle
    addEmptyGroup(options?: AddGroupOptions): void;
    closeAllGroups: () => Promise<boolean>;
    // events
    onTabInteractionEvent: Event<LayoutMouseEvent>;
    onTabContextMenu: Event<TabContextMenuEvent>;
    moveToNext(options?: MovementOptions): void;
    moveToPrevious(options?: MovementOptions): void;
    setActivePanel(panel: IGroupPanel): void;
    focus(): void;
    toJSON(): SerializedDockview;
    fromJSON(data: SerializedDockview): void;
}

export class DockviewComponent
    extends BaseGrid<GroupviewPanel>
    implements IDockviewComponent
{
    private readonly _panels = new Map<string, IValueDisposable<IGroupPanel>>();
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
    private _deserializer: IPanelDeserializer | undefined;
    private panelState: State = {};
    private _api: DockviewApi;
    private _options: DockviewComponentOptions;

    get totalPanels(): number {
        return this._panels.size;
    }

    get panels(): IGroupPanel[] {
        return Array.from(this._panels.values()).map((_) => _.value);
    }

    get deserializer(): IPanelDeserializer | undefined {
        return this._deserializer;
    }

    set deserializer(value: IPanelDeserializer | undefined) {
        this._deserializer = value;
    }

    get options(): DockviewComponentOptions {
        return this._options;
    }

    get activePanel(): IGroupPanel | undefined {
        const activeGroup = this.activeGroup;

        if (!activeGroup) {
            return undefined;
        }

        return activeGroup.model.activePanel;
    }

    set tabHeight(height: number | undefined) {
        this.options.tabHeight = height;
        this._groups.forEach((value) => {
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

    focus(): void {
        this.activeGroup?.focus();
    }

    getGroupPanel(id: string): IGroupPanel | undefined {
        return this._panels.get(id)?.value;
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

    private registerPanel(panel: IGroupPanel): void {
        if (this._panels.has(panel.id)) {
            throw new Error(`panel ${panel.id} already exists`);
        }

        const disposable = new CompositeDisposable(
            panel.onDidStateChange(() => this.addDirtyPanel(panel))
        );

        this._panels.set(panel.id, { value: panel, disposable });
    }

    private unregisterPanel(panel: IGroupPanel): void {
        if (!this._panels.has(panel.id)) {
            throw new Error(`panel ${panel.id} doesn't exist`);
        }
        const item = this._panels.get(panel.id);

        if (item) {
            item.disposable.dispose();
            item.value.dispose();
        }

        this._panels.delete(panel.id);
    }

    /**
     * Serialize the current state of the layout
     *
     * @returns A JSON respresentation of the layout
     */
    toJSON(): SerializedDockview {
        this.syncConfigs();

        const data = this.gridview.serialize();

        const panels = Array.from(this._panels.values()).reduce(
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
        this._panels.forEach((panel) => {
            panel.disposable.dispose();
            panel.value.dispose();
        });
        this._panels.clear();
        this._groups.clear();

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

        this._onGridEvent.fire({ kind: GroupChangeKind.LAYOUT_FROM_JSON });
    }

    async closeAllGroups(): Promise<boolean> {
        for (const entry of this._groups.entries()) {
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

    removePanel(panel: IGroupPanel): void {
        this.unregisterPanel(panel);
        const group = panel.group;

        if (!group) {
            throw new Error(
                `cannot remove panel ${panel.id}. it's missing a group.`
            );
        }

        group.model.removePanel(panel);

        if (group.model.size === 0) {
            this.removeGroup(group);
        }
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
            const referencePanel = this._panels.get(
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
            this.removePanel(panel);
        });

        if (this._groups.size === 1) {
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
            ? this._groups.get(groupId)?.value
            : undefined;

        if (!target || target === Position.Center) {
            const groupItem: IGroupPanel | undefined =
                sourceGroup?.model.removePanel(itemId) ||
                this._panels.get(itemId)?.value;

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
                    this._panels.get(itemId)?.value;

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

    override doSetGroupActive(
        group: GroupviewPanel | undefined,
        skipFocus?: boolean
    ) {
        const isGroupAlreadyFocused = this._activeGroup === group;
        super.doSetGroupActive(group, skipFocus);

        if (!isGroupAlreadyFocused && this._activeGroup?.model.activePanel) {
            this._onGridEvent.fire({
                kind: GroupChangeKind.PANEL_ACTIVE,
                panel: this._activeGroup?.model.activePanel,
            });
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

        if (id && this._groups.has(options.id!)) {
            console.warn(
                `Duplicate group id ${options?.id}. reassigning group id to avoid errors`
            );
            id = undefined;
        }

        if (!id) {
            id = nextGroupId.next();
            while (this._groups.has(id)) {
                id = nextGroupId.next();
            }
        }

        const view = new GroupviewPanel(this, id, options);

        if (!this._groups.has(view.id)) {
            const disposable = new CompositeDisposable(
                view.model.onMove((event) => {
                    const { groupId, itemId, target, index } = event;
                    this.moveGroupOrPanel(view, groupId, itemId, target, index);
                }),
                view.model.onDidGroupChange((event) => {
                    switch (event.kind) {
                        case GroupChangeKind2.ADD_PANEL:
                            this._onGridEvent.fire({
                                kind: GroupChangeKind.ADD_PANEL,
                                panel: event.panel,
                            });
                            break;
                        case GroupChangeKind2.GROUP_ACTIVE:
                            this._onGridEvent.fire({
                                kind: GroupChangeKind.GROUP_ACTIVE,
                                panel: event.panel,
                            });
                            break;
                        case GroupChangeKind2.REMOVE_PANEL:
                            this._onGridEvent.fire({
                                kind: GroupChangeKind.REMOVE_PANEL,
                                panel: event.panel,
                            });
                            break;
                        case GroupChangeKind2.PANEL_ACTIVE:
                            this._onGridEvent.fire({
                                kind: GroupChangeKind.PANEL_ACTIVE,
                                panel: event.panel,
                            });
                            break;
                    }
                })
            );

            this._groups.set(view.id, { value: view, disposable });
        }

        // TODO: must be called after the above listeners have been setup,
        // not an ideal pattern
        view.initialize();

        if (typeof this.options.tabHeight === 'number') {
            view.model.tabHeight = this.options.tabHeight;
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
            //
        }

        this.dirtyPanels.clear();

        const partialPanelState = dirtyPanels
            .map((panel) => this._panels.get(panel.id))
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
            .filter((p) => this._panels.has(p.id))
            .forEach((panel) => {
                panel.setDirty(false);
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
        return Array.from(this._groups.values()).find((group) =>
            group.value.model.containsPanel(panel)
        )?.value;
    }

    private addDirtyPanel(panel: IGroupPanel): void {
        this.dirtyPanels.add(panel);
        panel.setDirty(true);
        this.debouncedDeque();
    }
}
