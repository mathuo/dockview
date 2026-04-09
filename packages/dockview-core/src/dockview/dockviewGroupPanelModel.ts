import { DockviewApi } from '../api/component.api';
import { getPanelData, PanelTransfer } from '../dnd/dataTransfer';
import { Position } from '../dnd/droptarget';
import { DockviewComponent } from './dockviewComponent';
import { addClasses, isAncestor, removeClasses, toggleClass } from '../dom';
import {
    addDisposableListener,
    DockviewEvent,
    Emitter,
    Event,
    IDockviewEvent,
} from '../events';
import {
    DockviewGroupDropLocation,
    DockviewWillShowOverlayLocationEvent,
    DockviewWillShowOverlayLocationEventOptions,
} from './events';
import { IViewSize } from '../gridview/gridview';
import {
    CompositeDisposable,
    IDisposable,
    MutableDisposable,
} from '../lifecycle';
import {
    IPanel,
    PanelInitParameters,
    PanelUpdateEvent,
    Parameters,
} from '../panel/types';
import {
    ContentContainer,
    IContentContainer,
} from './components/panel/content';
import {
    GroupDragEvent,
    ITabsContainer,
    TabDragEvent,
    TabsContainer,
} from './components/titlebar/tabsContainer';
import { IWatermarkRenderer } from './types';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import {
    DockviewDndOverlayEvent,
    DockviewUnhandledDragOverEvent,
    IHeaderActionsRenderer,
    DockviewHeaderDirection,
    DockviewHeaderPosition,
} from './options';
import { OverlayRenderContainer } from '../overlay/overlayRenderContainer';
import { TitleEvent } from '../api/dockviewPanelApi';
import { Contraints } from '../gridview/gridviewPanel';
import { DropTargetAnchorContainer } from '../dnd/dropTargetAnchorContainer';
import {
    TabGroup,
    ITabGroup,
    TabGroupColor,
    SerializedTabGroup,
} from './tabGroup';
import { EdgeGroupPosition } from './dockviewShell';

interface GroupMoveEvent {
    groupId: string;
    itemId?: string;
    target: Position;
    index?: number;
}

interface CoreGroupOptions {
    locked?: DockviewGroupPanelLocked;
    hideHeader?: boolean;
    headerPosition?: 'top' | 'bottom' | 'left' | 'right';
    skipSetActive?: boolean;
    constraints?: Partial<Contraints>;
    initialWidth?: number;
    initialHeight?: number;
}

export interface GroupOptions extends CoreGroupOptions {
    readonly panels?: IDockviewPanel[];
    readonly activePanel?: IDockviewPanel;
    readonly id?: string;
}

export interface GroupPanelViewState extends CoreGroupOptions {
    views: string[];
    activeView?: string;
    id: string;
    tabGroups?: SerializedTabGroup[];
}

export interface DockviewGroupChangeEvent {
    readonly panel: IDockviewPanel;
}

export class DockviewDidDropEvent extends DockviewEvent {
    get nativeEvent(): DragEvent {
        return this.options.nativeEvent;
    }

    get position(): Position {
        return this.options.position;
    }

    get panel(): IDockviewPanel | undefined {
        return this.options.panel;
    }

    get group(): DockviewGroupPanel | undefined {
        return this.options.group;
    }

    get api(): DockviewApi {
        return this.options.api;
    }

    constructor(
        private readonly options: {
            readonly nativeEvent: DragEvent;
            readonly position: Position;
            readonly panel?: IDockviewPanel;
            getData(): PanelTransfer | undefined;
            group?: DockviewGroupPanel;
            api: DockviewApi;
        }
    ) {
        super();
    }

    getData(): PanelTransfer | undefined {
        return this.options.getData();
    }
}

export class DockviewWillDropEvent extends DockviewDidDropEvent {
    private readonly _kind: DockviewGroupDropLocation;

    get kind(): DockviewGroupDropLocation {
        return this._kind;
    }

    constructor(options: {
        readonly nativeEvent: DragEvent;
        readonly position: Position;
        readonly panel?: IDockviewPanel;
        getData(): PanelTransfer | undefined;
        kind: DockviewGroupDropLocation;
        group?: DockviewGroupPanel;
        api: DockviewApi;
    }) {
        super(options);

        this._kind = options.kind;
    }
}

export interface IHeader {
    hidden: boolean;
    direction: DockviewHeaderDirection;
}

export type DockviewGroupPanelLocked = boolean | 'no-drop-target';

export interface IDockviewGroupPanelModel extends IPanel {
    readonly isActive: boolean;
    readonly size: number;
    readonly panels: IDockviewPanel[];
    readonly activePanel: IDockviewPanel | undefined;
    readonly header: IHeader;
    readonly isContentFocused: boolean;
    readonly onDidDrop: Event<DockviewDidDropEvent>;
    readonly onWillDrop: Event<DockviewWillDropEvent>;
    readonly onDidAddPanel: Event<DockviewGroupChangeEvent>;
    readonly onDidRemovePanel: Event<DockviewGroupChangeEvent>;
    readonly onDidActivePanelChange: Event<DockviewGroupChangeEvent>;
    readonly onMove: Event<GroupMoveEvent>;
    locked: DockviewGroupPanelLocked;
    headerPosition: DockviewHeaderPosition;
    setActive(isActive: boolean): void;
    initialize(): void;
    // state
    isPanelActive: (panel: IDockviewPanel) => boolean;
    indexOf(panel: IDockviewPanel): number;
    // panel lifecycle
    openPanel(
        panel: IDockviewPanel,
        options?: {
            index?: number;
            skipFocus?: boolean;
            skipSetPanelActive?: boolean;
            skipSetGroupActive?: boolean;
        }
    ): void;
    closePanel(panel: IDockviewPanel): void;
    closeAllPanels(): void;
    containsPanel(panel: IDockviewPanel): boolean;
    removePanel: (panelOrId: IDockviewPanel | string) => IDockviewPanel;
    moveToNext(options?: {
        panel?: IDockviewPanel;
        suppressRoll?: boolean;
    }): void;
    moveToPrevious(options?: {
        panel?: IDockviewPanel;
        suppressRoll?: boolean;
    }): void;
    canDisplayOverlay(
        event: DragEvent,
        position: Position,
        target: DockviewGroupDropLocation
    ): boolean;
}

export type DockviewGroupLocation =
    | { type: 'grid' }
    | { type: 'floating' }
    | { type: 'popout'; getWindow: () => Window; popoutUrl?: string }
    | { type: 'edge'; position: EdgeGroupPosition };

export class DockviewGroupPanelModel
    extends CompositeDisposable
    implements IDockviewGroupPanelModel
{
    private readonly tabsContainer: ITabsContainer;
    private readonly contentContainer: IContentContainer;
    private _activePanel: IDockviewPanel | undefined;
    private watermark?: IWatermarkRenderer;
    private _isGroupActive = false;
    private _locked: DockviewGroupPanelLocked = false;
    private _rightHeaderActions: IHeaderActionsRenderer | undefined;
    private _leftHeaderActions: IHeaderActionsRenderer | undefined;
    private _prefixHeaderActions: IHeaderActionsRenderer | undefined;
    private readonly _rightHeaderActionsDisposable = new MutableDisposable();
    private readonly _leftHeaderActionsDisposable = new MutableDisposable();
    private readonly _prefixHeaderActionsDisposable = new MutableDisposable();
    private _headerPosition: DockviewHeaderPosition | undefined;
    private _location: DockviewGroupLocation = { type: 'grid' };

    private mostRecentlyUsed: IDockviewPanel[] = [];
    private _overwriteRenderContainer: OverlayRenderContainer | null = null;
    private _overwriteDropTargetContainer: DropTargetAnchorContainer | null =
        null;

    private readonly _onDidChange = new Emitter<IViewSize | undefined>();
    readonly onDidChange: Event<IViewSize | undefined> =
        this._onDidChange.event;

    private _width = 0;
    private _height = 0;

    private readonly _panels: IDockviewPanel[] = [];
    private readonly _panelDisposables = new Map<string, IDisposable>();
    private readonly _tabGroupDisposables = new Map<string, IDisposable>();
    private readonly _pendingMicrotaskDisposables = new Set<IDisposable>();

    private readonly _onMove = new Emitter<GroupMoveEvent>();
    readonly onMove: Event<GroupMoveEvent> = this._onMove.event;

    private readonly _onDidDrop = new Emitter<DockviewDidDropEvent>();
    readonly onDidDrop: Event<DockviewDidDropEvent> = this._onDidDrop.event;

    private readonly _onWillDrop = new Emitter<DockviewWillDropEvent>();
    readonly onWillDrop: Event<DockviewWillDropEvent> = this._onWillDrop.event;

    private readonly _onWillShowOverlay =
        new Emitter<DockviewWillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<DockviewWillShowOverlayLocationEvent> =
        this._onWillShowOverlay.event;

    private readonly _onTabDragStart = new Emitter<TabDragEvent>();
    readonly onTabDragStart: Event<TabDragEvent> = this._onTabDragStart.event;

    private readonly _onGroupDragStart = new Emitter<GroupDragEvent>();
    readonly onGroupDragStart: Event<GroupDragEvent> =
        this._onGroupDragStart.event;

    private readonly _onDidAddPanel = new Emitter<DockviewGroupChangeEvent>();
    readonly onDidAddPanel: Event<DockviewGroupChangeEvent> =
        this._onDidAddPanel.event;

    private readonly _onDidPanelTitleChange = new Emitter<TitleEvent>();
    readonly onDidPanelTitleChange: Event<TitleEvent> =
        this._onDidPanelTitleChange.event;

    private readonly _onDidPanelParametersChange = new Emitter<Parameters>();
    readonly onDidPanelParametersChange: Event<Parameters> =
        this._onDidPanelParametersChange.event;

    private readonly _onDidRemovePanel =
        new Emitter<DockviewGroupChangeEvent>();
    readonly onDidRemovePanel: Event<DockviewGroupChangeEvent> =
        this._onDidRemovePanel.event;

    private readonly _onDidActivePanelChange =
        new Emitter<DockviewGroupChangeEvent>();
    readonly onDidActivePanelChange: Event<DockviewGroupChangeEvent> =
        this._onDidActivePanelChange.event;

    private readonly _onUnhandledDragOverEvent =
        new Emitter<DockviewDndOverlayEvent>();
    readonly onUnhandledDragOverEvent: Event<DockviewDndOverlayEvent> =
        this._onUnhandledDragOverEvent.event;

    private readonly _tabGroups: TabGroup[] = [];
    private readonly _tabGroupMap = new Map<string, TabGroup>();
    private readonly _panelToTabGroup = new Map<string, TabGroup>();
    private _tabGroupIdCounter = 0;
    private _pendingTabGroupUpdate = false;

    private readonly _onDidCreateTabGroup = new Emitter<{
        tabGroup: ITabGroup;
    }>();
    readonly onDidCreateTabGroup = this._onDidCreateTabGroup.event;

    private readonly _onDidDestroyTabGroup = new Emitter<{
        tabGroup: ITabGroup;
    }>();
    readonly onDidDestroyTabGroup = this._onDidDestroyTabGroup.event;

    private readonly _onDidAddPanelToTabGroup = new Emitter<{
        tabGroup: ITabGroup;
        panelId: string;
    }>();
    readonly onDidAddPanelToTabGroup = this._onDidAddPanelToTabGroup.event;

    private readonly _onDidRemovePanelFromTabGroup = new Emitter<{
        tabGroup: ITabGroup;
        panelId: string;
    }>();
    readonly onDidRemovePanelFromTabGroup =
        this._onDidRemovePanelFromTabGroup.event;

    private readonly _onDidTabGroupChange = new Emitter<{
        tabGroup: ITabGroup;
    }>();
    readonly onDidTabGroupChange = this._onDidTabGroupChange.event;

    private readonly _onDidTabGroupCollapsedChange = new Emitter<{
        tabGroup: ITabGroup;
    }>();
    readonly onDidTabGroupCollapsedChange =
        this._onDidTabGroupCollapsedChange.event;

    private readonly _api: DockviewApi;

    get tabGroups(): readonly ITabGroup[] {
        return this._tabGroups;
    }

    get element(): HTMLElement {
        throw new Error('dockview: not supported');
    }

    get activePanel(): IDockviewPanel | undefined {
        return this._activePanel;
    }

    get locked(): DockviewGroupPanelLocked {
        return this._locked;
    }

    set locked(value: DockviewGroupPanelLocked) {
        this._locked = value;

        toggleClass(
            this.container,
            'dv-locked-groupview',
            value === 'no-drop-target' || value
        );
    }

    get isActive(): boolean {
        return this._isGroupActive;
    }

    get panels(): IDockviewPanel[] {
        return this._panels;
    }

    get size(): number {
        return this._panels.length;
    }

    get isEmpty(): boolean {
        return this._panels.length === 0;
    }

    get hasWatermark(): boolean {
        return !!(
            this.watermark && this.container.contains(this.watermark.element)
        );
    }

    get header(): IHeader {
        return this.tabsContainer;
    }

    get isContentFocused(): boolean {
        if (!document.activeElement) {
            return false;
        }
        return isAncestor(
            document.activeElement,
            this.contentContainer.element
        );
    }

    get headerPosition(): DockviewHeaderPosition {
        return this._headerPosition ?? 'top';
    }

    set headerPosition(value: DockviewHeaderPosition) {
        this._headerPosition = value;
        removeClasses(
            this.container,
            'dv-groupview-header-top',
            'dv-groupview-header-bottom',
            'dv-groupview-header-left',
            'dv-groupview-header-right'
        );
        addClasses(this.container, `dv-groupview-header-${value}`);

        const direction =
            value === 'top' || value === 'bottom' ? 'horizontal' : 'vertical';
        this.tabsContainer.direction = direction;
        this.header.direction = direction;

        // resize the active panel to fit the new header direction
        // if not, the panel will overflow the tabs container
        if (this._activePanel?.layout) {
            this._activePanel.layout(this._width, this._height);
        }

        if (
            this._leftHeaderActions ||
            this._rightHeaderActions ||
            this._prefixHeaderActions
        ) {
            this.updateHeaderActions();
        }
    }

    get location(): DockviewGroupLocation {
        return this._location;
    }

    set location(value: DockviewGroupLocation) {
        this._location = value;

        toggleClass(this.container, 'dv-groupview-floating', false);
        toggleClass(this.container, 'dv-groupview-popout', false);
        toggleClass(this.container, 'dv-groupview-edge', false);

        switch (value.type) {
            case 'grid':
                this.contentContainer.dropTarget.setTargetZones([
                    'top',
                    'bottom',
                    'left',
                    'right',
                    'center',
                ]);
                break;
            case 'floating':
                this.contentContainer.dropTarget.setTargetZones(['center']);
                this.contentContainer.dropTarget.setTargetZones(
                    value
                        ? ['center']
                        : ['top', 'bottom', 'left', 'right', 'center']
                );

                toggleClass(this.container, 'dv-groupview-floating', true);

                break;
            case 'popout':
                this.contentContainer.dropTarget.setTargetZones(['center']);

                toggleClass(this.container, 'dv-groupview-popout', true);

                break;
            case 'edge':
                this.contentContainer.dropTarget.setTargetZones(['center']);

                toggleClass(this.container, 'dv-groupview-edge', true);

                break;
        }

        this.groupPanel.api._onDidLocationChange.fire({
            location: this.location,
        });
    }

    constructor(
        private readonly container: HTMLElement,
        private readonly accessor: DockviewComponent,
        public id: string,
        private readonly options: GroupOptions,
        private readonly groupPanel: DockviewGroupPanel
    ) {
        super();

        toggleClass(this.container, 'dv-groupview', true);

        this._api = new DockviewApi(this.accessor);

        this.tabsContainer = new TabsContainer(this.accessor, this.groupPanel);

        this.contentContainer = new ContentContainer(this.accessor, this);

        container.append(
            this.tabsContainer.element,
            this.contentContainer.element
        );

        this.header.hidden = !!options.hideHeader;
        this.locked = options.locked ?? false;
        this.headerPosition =
            options.headerPosition ?? accessor.defaultHeaderPosition;

        this.addDisposables(
            this._onTabDragStart,
            this._onGroupDragStart,
            this._onWillShowOverlay,
            this._rightHeaderActionsDisposable,
            this._leftHeaderActionsDisposable,
            this._prefixHeaderActionsDisposable,
            this.tabsContainer.onTabDragStart((event) => {
                this._onTabDragStart.fire(event);
            }),
            this.tabsContainer.onGroupDragStart((event) => {
                this._onGroupDragStart.fire(event);
            }),
            this.tabsContainer.onDrop((event) => {
                // Capture panel data before handleDropEvent (which may trigger moves)
                const dragData = getPanelData();
                const draggedPanelId = dragData?.panelId ?? null;

                this.handleDropEvent(
                    'header',
                    event.event,
                    'center',
                    event.index
                );

                // Update tab group membership after the move completes
                if (draggedPanelId && event.targetTabGroupId) {
                    // Compute the local index within the target tab group
                    // from the global panel index so the panel is inserted
                    // at the correct position, not just appended.
                    const tabGroup = this._tabGroupMap.get(
                        event.targetTabGroupId
                    );
                    let localIndex: number | undefined;
                    if (tabGroup) {
                        const globalIdx = this._panels.findIndex(
                            (p) => p.id === draggedPanelId
                        );
                        if (globalIdx !== -1) {
                            // Count how many of this group's panels
                            // appear before the dragged panel
                            localIndex = 0;
                            for (const pid of tabGroup.panelIds) {
                                const pidIdx = this._panels.findIndex(
                                    (p) => p.id === pid
                                );
                                if (pidIdx < globalIdx) {
                                    localIndex++;
                                }
                            }
                        }
                    }
                    this.addPanelToTabGroup(
                        event.targetTabGroupId,
                        draggedPanelId,
                        localIndex
                    );
                } else if (draggedPanelId && event.targetTabGroupId === null) {
                    // Dropped outside any group — remove from current group
                    this.removePanelFromTabGroup(draggedPanelId);
                }
            }),

            this.contentContainer.onDidFocus(() => {
                this.accessor.doSetGroupActive(this.groupPanel);
            }),
            this.contentContainer.onDidBlur(() => {
                // noop
            }),
            this.contentContainer.dropTarget.onDrop((event) => {
                this.handleDropEvent(
                    'content',
                    event.nativeEvent,
                    event.position
                );
            }),
            this.tabsContainer.onWillShowOverlay((event) => {
                this._onWillShowOverlay.fire(event);
            }),
            this.contentContainer.dropTarget.onWillShowOverlay((event) => {
                this._onWillShowOverlay.fire(
                    new DockviewWillShowOverlayLocationEvent(event, {
                        kind: 'content',
                        panel: this.activePanel,
                        api: this._api,
                        group: this.groupPanel,
                        getData: getPanelData,
                    })
                );
            }),
            this._onMove,
            this._onDidChange,
            this._onDidDrop,
            this._onWillDrop,
            this._onDidAddPanel,
            this._onDidRemovePanel,
            this._onDidActivePanelChange,
            this._onUnhandledDragOverEvent,
            this._onDidPanelTitleChange,
            this._onDidPanelParametersChange,
            this._onDidCreateTabGroup,
            this._onDidDestroyTabGroup,
            this._onDidAddPanelToTabGroup,
            this._onDidRemovePanelFromTabGroup,
            this._onDidTabGroupChange,
            this._onDidTabGroupCollapsedChange,
            this._onDidCreateTabGroup.event(() => {
                this._scheduleTabGroupUpdate();
            }),
            this._onDidDestroyTabGroup.event(() => {
                this._scheduleTabGroupUpdate();
            }),
            this._onDidAddPanelToTabGroup.event(() => {
                this._scheduleTabGroupUpdate();
            }),
            this._onDidRemovePanelFromTabGroup.event(() => {
                this._scheduleTabGroupUpdate();
            }),
            this._onDidTabGroupChange.event(() => {
                this._scheduleTabGroupUpdate();
            }),
            this._onDidTabGroupCollapsedChange.event(() => {
                this._scheduleTabGroupUpdate();
            })
        );
    }

    private _scheduleTabGroupUpdate(): void {
        if (this._pendingTabGroupUpdate) {
            return;
        }
        this._pendingTabGroupUpdate = true;
        queueMicrotask(() => {
            this._pendingTabGroupUpdate = false;
            if (!this.isDisposed) {
                this.tabsContainer.updateTabGroups();
            }
        });
    }

    createTabGroup(options?: {
        label?: string;
        color?: TabGroupColor;
        id?: string;
    }): ITabGroup {
        const id = options?.id ?? `tg-${this.id}-${this._tabGroupIdCounter++}`;
        const tabGroup = new TabGroup(id, {
            label: options?.label,
            color: options?.color,
        });
        this._tabGroups.push(tabGroup);
        this._tabGroupMap.set(id, tabGroup);

        this._tabGroupDisposables.set(
            id,
            new CompositeDisposable(
                tabGroup.onDidChange(() => {
                    this._onDidTabGroupChange.fire({ tabGroup });
                }),
                tabGroup.onDidCollapseChange((isCollapsed) => {
                    if (isCollapsed) {
                        this._handleGroupCollapse(tabGroup);
                    } else {
                        this._handleGroupExpand(tabGroup);
                    }
                    this._onDidTabGroupCollapsedChange.fire({
                        tabGroup,
                    });
                }),
                tabGroup.onDidDestroy(() => {
                    this._removeTabGroupInternal(tabGroup);
                })
            )
        );

        this._onDidCreateTabGroup.fire({ tabGroup });
        return tabGroup;
    }

    dissolveTabGroup(tabGroupId: string): void {
        const tabGroup = this._tabGroupMap.get(tabGroupId);
        if (!tabGroup) {
            return;
        }

        // Remove all panels from the group (they stay in the flat panel list)
        const panelIds = [...tabGroup.panelIds];
        for (const panelId of panelIds) {
            tabGroup.removePanel(panelId);
            this._panelToTabGroup.delete(panelId);
            this._onDidRemovePanelFromTabGroup.fire({ tabGroup, panelId });
        }

        tabGroup.dispose();
    }

    addPanelToTabGroup(
        tabGroupId: string,
        panelId: string,
        index?: number
    ): void {
        const tabGroup = this._tabGroupMap.get(tabGroupId);
        if (!tabGroup) {
            return;
        }

        // Ensure the panel actually exists in this group model
        if (!this._panels.some((p) => p.id === panelId)) {
            return;
        }

        // Remove from any existing group first
        const existingGroup = this.getTabGroupForPanel(panelId);
        if (existingGroup) {
            if (existingGroup.id === tabGroupId) {
                return; // already in this group
            }
            this.removePanelFromTabGroup(panelId);
        }

        tabGroup.addPanel(panelId, index);
        this._panelToTabGroup.set(panelId, tabGroup);

        // Enforce contiguity: move the panel in the flat _panels array
        // to the correct global position matching its group-local index
        this._enforceContiguity(tabGroup, panelId);

        this._onDidAddPanelToTabGroup.fire({ tabGroup, panelId });
    }

    /**
     * Move a panel to a new index within its tab group.
     * Updates both the group's panelIds order and the flat _panels array.
     */
    movePanelWithinGroup(
        tabGroupId: string,
        panelId: string,
        newIndex: number
    ): void {
        const tabGroup = this._tabGroupMap.get(tabGroupId);
        if (!tabGroup || !tabGroup.containsPanel(panelId)) {
            return;
        }

        // Remove and re-add at new index within the group
        tabGroup.removePanel(panelId);
        tabGroup.addPanel(panelId, newIndex);

        // Re-enforce contiguity in the flat array
        this._enforceContiguity(tabGroup, panelId);

        this.tabsContainer.updateTabGroups();
    }

    /**
     * Move a panel from one tab group to another.
     */
    movePanelBetweenGroups(
        sourcePanelId: string,
        targetTabGroupId: string,
        targetIndex?: number
    ): void {
        const sourceGroup = this._findTabGroupForPanel(sourcePanelId);
        const targetGroup = this._tabGroupMap.get(targetTabGroupId);

        if (!targetGroup) {
            return;
        }

        if (sourceGroup) {
            sourceGroup.removePanel(sourcePanelId);
            this._panelToTabGroup.delete(sourcePanelId);
            this._onDidRemovePanelFromTabGroup.fire({
                tabGroup: sourceGroup,
                panelId: sourcePanelId,
            });

            // Auto-destroy empty source group
            if (sourceGroup.isEmpty) {
                sourceGroup.dispose();
            }
        }

        targetGroup.addPanel(sourcePanelId, targetIndex);
        this._panelToTabGroup.set(sourcePanelId, targetGroup);
        this._enforceContiguity(targetGroup, sourcePanelId);
        this._onDidAddPanelToTabGroup.fire({
            tabGroup: targetGroup,
            panelId: sourcePanelId,
        });
    }

    /**
     * Move an entire tab group to a new position in the tab bar.
     * The group's internal panel order is preserved.
     */
    moveTabGroup(tabGroupId: string, targetIndex: number): void {
        const tabGroup = this._tabGroupMap.get(tabGroupId);
        if (!tabGroup || tabGroup.panelIds.length === 0) {
            return;
        }

        // Collect group panels in their current order
        const groupPanelIds = new Set(tabGroup.panelIds);
        const groupPanels = tabGroup.panelIds
            .map((pid) => this._panels.find((p) => p.id === pid))
            .filter((p): p is IDockviewPanel => p !== undefined);

        if (groupPanels.length === 0) {
            return;
        }

        // Count how many group panels sit before the target index so
        // we can compensate after removing them from the array.
        let groupPanelsBefore = 0;
        for (let i = 0; i < Math.min(targetIndex, this._panels.length); i++) {
            if (groupPanelIds.has(this._panels[i].id)) {
                groupPanelsBefore++;
            }
        }

        // Remove group panels from the flat array
        for (const panel of groupPanels) {
            const idx = this._panels.indexOf(panel);
            if (idx !== -1) {
                this._panels.splice(idx, 1);
            }
        }

        // Adjust target index to account for removed panels
        const adjustedIndex = targetIndex - groupPanelsBefore;

        // Clamp target index to valid range after removal
        const insertAt = Math.max(
            0,
            Math.min(adjustedIndex, this._panels.length)
        );

        // Insert group panels at the target position
        this._panels.splice(insertAt, 0, ...groupPanels);

        // Rebuild the tabs container to match new order
        for (const panel of this._panels) {
            this.tabsContainer.delete(panel.id);
        }
        for (let i = 0; i < this._panels.length; i++) {
            this.tabsContainer.openPanel(this._panels[i], i);
        }

        this.tabsContainer.updateTabGroups();
    }

    /**
     * Ensure a panel is at the correct global index in _panels
     * to maintain contiguity of its tab group members.
     */
    private _enforceContiguity(tabGroup: TabGroup, panelId: string): void {
        const panel = this._panels.find((p) => p.id === panelId);
        if (!panel) {
            return;
        }

        const localIndex = tabGroup.indexOfPanel(panelId);
        const globalIndex = this._computeGlobalIndex(tabGroup, localIndex);

        const currentIndex = this._panels.indexOf(panel);
        if (currentIndex === globalIndex) {
            return;
        }

        // Move panel in the flat array
        this._panels.splice(currentIndex, 1);
        const adjustedIndex =
            globalIndex > currentIndex ? globalIndex - 1 : globalIndex;
        this._panels.splice(adjustedIndex, 0, panel);

        // Reorder in the tabs container to match
        this.tabsContainer.delete(panelId);
        this.tabsContainer.openPanel(panel, adjustedIndex);
    }

    /**
     * Compute the global index in _panels for a group-local index.
     * Finds where the group's panels start in the flat array and offsets.
     */
    private _computeGlobalIndex(
        tabGroup: TabGroup,
        localIndex: number
    ): number {
        const groupPanelIds = tabGroup.panelIds;

        if (groupPanelIds.length <= 1) {
            // Only one panel (the one being added), keep current position
            const panel = this._panels.find((p) => p.id === groupPanelIds[0]);
            return panel ? this._panels.indexOf(panel) : this._panels.length;
        }

        // Find the first existing group member (other than the one at localIndex)
        // to anchor the group position
        for (let i = 0; i < groupPanelIds.length; i++) {
            if (i === localIndex) {
                continue;
            }
            const existingPanel = this._panels.find(
                (p) => p.id === groupPanelIds[i]
            );
            if (existingPanel) {
                const existingGlobalIndex = this._panels.indexOf(existingPanel);
                // Offset based on relative position within group
                return Math.max(0, existingGlobalIndex + (localIndex - i));
            }
        }

        return this._panels.length;
    }

    removePanelFromTabGroup(panelId: string): void {
        const tabGroup = this._findTabGroupForPanel(panelId);
        if (!tabGroup) {
            return;
        }

        tabGroup.removePanel(panelId);
        this._panelToTabGroup.delete(panelId);
        this._onDidRemovePanelFromTabGroup.fire({ tabGroup, panelId });

        // Auto-destroy empty groups
        if (tabGroup.isEmpty) {
            tabGroup.dispose();
        }
    }

    getTabGroups(): readonly ITabGroup[] {
        return this._tabGroups;
    }

    getTabGroupForPanel(panelId: string): ITabGroup | undefined {
        return this._findTabGroupForPanel(panelId);
    }

    private _findTabGroupForPanel(panelId: string): TabGroup | undefined {
        return this._panelToTabGroup.get(panelId);
    }

    private _removeTabGroupInternal(tabGroup: TabGroup): void {
        const index = this._tabGroups.indexOf(tabGroup);
        if (index !== -1) {
            this._tabGroups.splice(index, 1);
            this._tabGroupMap.delete(tabGroup.id);
            for (const panelId of tabGroup.panelIds) {
                this._panelToTabGroup.delete(panelId);
            }

            this._onDidDestroyTabGroup.fire({ tabGroup });

            // Dispose the external listeners (onDidChange, onDidCollapseChange)
            // we registered on this group. We cannot dispose synchronously
            // here because this method runs inside the onDidDestroy fire
            // loop — disposing the CompositeDisposable that holds the
            // onDidDestroy subscription would splice listeners mid-iteration.
            // Schedule cleanup on the next microtask instead.
            const tabGroupDisposable = this._tabGroupDisposables.get(
                tabGroup.id
            );
            this._tabGroupDisposables.delete(tabGroup.id);
            if (tabGroupDisposable) {
                this._pendingMicrotaskDisposables.add(tabGroupDisposable);
                queueMicrotask(() => {
                    this._pendingMicrotaskDisposables.delete(
                        tabGroupDisposable
                    );
                    tabGroupDisposable.dispose();
                });
            }
        }
    }

    private _handleGroupCollapse(tabGroup: TabGroup): void {
        if (!this._activePanel) {
            return;
        }

        // Only act if the active panel belongs to the collapsed group
        if (!tabGroup.containsPanel(this._activePanel.id)) {
            return;
        }

        const activePanelIndex = this._panels.indexOf(this._activePanel);

        // Search right first, then left, for a visible (non-collapsed-group) panel
        for (let i = activePanelIndex + 1; i < this._panels.length; i++) {
            const candidate = this._panels[i];
            const candidateGroup = this._findTabGroupForPanel(candidate.id);
            if (!candidateGroup || !candidateGroup.collapsed) {
                this.doSetActivePanel(candidate);
                this.updateContainer();
                return;
            }
        }

        for (let i = activePanelIndex - 1; i >= 0; i--) {
            const candidate = this._panels[i];
            const candidateGroup = this._findTabGroupForPanel(candidate.id);
            if (!candidateGroup || !candidateGroup.collapsed) {
                this.doSetActivePanel(candidate);
                this.updateContainer();
                return;
            }
        }

        // All tabs are in collapsed groups — show watermark
        this.contentContainer.closePanel();
        this.doSetActivePanel(undefined);
        this.updateContainer();
    }

    private _handleGroupExpand(tabGroup: TabGroup): void {
        if (this._activePanel) {
            return;
        }

        // Watermark is showing because all groups were collapsed.
        // Activate the first panel in the newly expanded group.
        const firstPanelId = tabGroup.panelIds[0];
        if (firstPanelId) {
            const panel = this._panels.find((p) => p.id === firstPanelId);
            if (panel) {
                this.doSetActivePanel(panel);
                this.updateContainer();
            }
        }
    }

    /** Restore tab groups from serialized data (used by fromJSON) */
    restoreTabGroups(serializedGroups: SerializedTabGroup[]): void {
        // Bump counter past any restored numeric suffixes to avoid ID collisions
        for (const data of serializedGroups) {
            const match = data.id.match(/-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10) + 1;
                if (num > this._tabGroupIdCounter) {
                    this._tabGroupIdCounter = num;
                }
            }
        }

        for (const data of serializedGroups) {
            const tabGroup = this.createTabGroup({
                id: data.id,
                label: data.label,
                color: data.color,
            });

            const concreteGroup = this._tabGroupMap.get(tabGroup.id)!;
            for (const panelId of data.panelIds) {
                // Only add panels that actually exist in this group model
                if (this._panels.some((p) => p.id === panelId)) {
                    tabGroup.addPanel(panelId);
                    this._panelToTabGroup.set(panelId, concreteGroup);
                    this._enforceContiguity(concreteGroup, panelId);
                }
            }

            if (data.collapsed) {
                tabGroup.collapse();
            }

            // Auto-destroy if no valid panels were added
            if (tabGroup.isEmpty) {
                tabGroup.dispose();
            }
        }
    }

    focusContent(): void {
        this.contentContainer.element.focus();
    }

    set renderContainer(value: OverlayRenderContainer | null) {
        this.panels.forEach((panel) => {
            this.renderContainer.detatch(panel);
        });

        this._overwriteRenderContainer = value;

        this.panels.forEach((panel) => {
            this.rerender(panel);
        });
    }

    get renderContainer(): OverlayRenderContainer {
        return (
            this._overwriteRenderContainer ??
            this.accessor.overlayRenderContainer
        );
    }

    set dropTargetContainer(value: DropTargetAnchorContainer | null) {
        this._overwriteDropTargetContainer = value;
    }

    get dropTargetContainer(): DropTargetAnchorContainer | null {
        return (
            this._overwriteDropTargetContainer ??
            this.accessor.rootDropTargetContainer
        );
    }

    initialize(): void {
        if (this.options.panels) {
            this.options.panels.forEach((panel) => {
                this.doAddPanel(panel);
            });
        }

        if (this.options.activePanel) {
            this.openPanel(this.options.activePanel);
        }

        // must be run after the constructor otherwise this.parent may not be
        // correctly initialized
        this.setActive(this.isActive, true);
        this.updateContainer();

        this.updateHeaderActions();
    }

    updateHeaderActions(): void {
        if (this.accessor.options.createRightHeaderActionComponent) {
            this._rightHeaderActions =
                this.accessor.options.createRightHeaderActionComponent(
                    this.groupPanel
                );
            this._rightHeaderActionsDisposable.value = this._rightHeaderActions;
            this._rightHeaderActions.init({
                containerApi: this._api,
                api: this.groupPanel.api,
                group: this.groupPanel,
            });
            this.tabsContainer.setRightActionsElement(
                this._rightHeaderActions.element
            );
        } else {
            this._rightHeaderActions = undefined;
            this._rightHeaderActionsDisposable.dispose();
            this.tabsContainer.setRightActionsElement(undefined);
        }

        if (this.accessor.options.createLeftHeaderActionComponent) {
            this._leftHeaderActions =
                this.accessor.options.createLeftHeaderActionComponent(
                    this.groupPanel
                );
            this._leftHeaderActionsDisposable.value = this._leftHeaderActions;
            this._leftHeaderActions.init({
                containerApi: this._api,
                api: this.groupPanel.api,
                group: this.groupPanel,
            });
            this.tabsContainer.setLeftActionsElement(
                this._leftHeaderActions.element
            );
        } else {
            this._leftHeaderActions = undefined;
            this._leftHeaderActionsDisposable.dispose();
            this.tabsContainer.setLeftActionsElement(undefined);
        }

        if (this.accessor.options.createPrefixHeaderActionComponent) {
            this._prefixHeaderActions =
                this.accessor.options.createPrefixHeaderActionComponent(
                    this.groupPanel
                );
            this._prefixHeaderActionsDisposable.value =
                this._prefixHeaderActions;
            this._prefixHeaderActions.init({
                containerApi: this._api,
                api: this.groupPanel.api,
                group: this.groupPanel,
            });
            this.tabsContainer.setPrefixActionsElement(
                this._prefixHeaderActions.element
            );
        } else {
            this._prefixHeaderActions = undefined;
            this._prefixHeaderActionsDisposable.dispose();
            this.tabsContainer.setPrefixActionsElement(undefined);
        }
    }

    rerender(panel: IDockviewPanel): void {
        this.contentContainer.renderPanel(panel, { asActive: false });
    }

    public indexOf(panel: IDockviewPanel): number {
        return this.tabsContainer.indexOf(panel.id);
    }

    public toJSON(): GroupPanelViewState {
        const result: GroupPanelViewState = {
            views: this.tabsContainer.panels,
            activeView: this._activePanel?.id,
            id: this.id,
        };

        if (this.locked !== false) {
            result.locked = this.locked;
        }

        if (this.header.hidden) {
            result.hideHeader = true;
        }

        if (this.headerPosition !== 'top') {
            result.headerPosition = this.headerPosition;
        }

        if (this._tabGroups.length > 0) {
            result.tabGroups = this._tabGroups.map((tg) => tg.toJSON());
        }

        return result;
    }

    public moveToNext(options?: {
        panel?: IDockviewPanel;
        suppressRoll?: boolean;
    }): void {
        if (!options) {
            options = {};
        }
        if (!options.panel) {
            options.panel = this.activePanel;
        }

        const index = options.panel ? this.panels.indexOf(options.panel) : -1;

        let normalizedIndex: number;

        if (index < this.panels.length - 1) {
            normalizedIndex = index + 1;
        } else if (!options.suppressRoll) {
            normalizedIndex = 0;
        } else {
            return;
        }

        this.openPanel(this.panels[normalizedIndex]);
    }

    public moveToPrevious(options?: {
        panel?: IDockviewPanel;
        suppressRoll?: boolean;
    }): void {
        if (!options) {
            options = {};
        }
        if (!options.panel) {
            options.panel = this.activePanel;
        }

        if (!options.panel) {
            return;
        }

        const index = this.panels.indexOf(options.panel);

        let normalizedIndex: number;

        if (index > 0) {
            normalizedIndex = index - 1;
        } else if (!options.suppressRoll) {
            normalizedIndex = this.panels.length - 1;
        } else {
            return;
        }

        this.openPanel(this.panels[normalizedIndex]);
    }

    public containsPanel(panel: IDockviewPanel): boolean {
        return this.panels.includes(panel);
    }

    init(_params: PanelInitParameters): void {
        //noop
    }

    update(_params: PanelUpdateEvent): void {
        //noop
    }

    focus(): void {
        this._activePanel?.focus();
    }

    public openPanel(
        panel: IDockviewPanel,
        options: {
            index?: number;
            skipSetActive?: boolean;
            skipSetGroupActive?: boolean;
        } = {}
    ): void {
        /**
         * set the panel group
         * add the panel
         * check if group active
         * check if panel active
         */

        if (
            typeof options.index !== 'number' ||
            options.index > this.panels.length
        ) {
            options.index = this.panels.length;
        }

        const skipSetActive = !!options.skipSetActive;

        // ensure the group is updated before we fire any events
        panel.updateParentGroup(this.groupPanel, {
            skipSetActive: options.skipSetActive,
        });

        this.doAddPanel(panel, options.index, {
            skipSetActive: skipSetActive,
        });

        if (this._activePanel === panel) {
            this.contentContainer.renderPanel(panel, { asActive: true });
            return;
        }

        if (!skipSetActive) {
            this.doSetActivePanel(panel);
        }

        if (!options.skipSetGroupActive) {
            this.accessor.doSetGroupActive(this.groupPanel);
        }

        if (!options.skipSetActive) {
            this.updateContainer();
        }
    }

    public removePanel(
        groupItemOrId: IDockviewPanel | string,
        options: {
            skipSetActive?: boolean;
            skipSetActiveGroup?: boolean;
        } = {
            skipSetActive: false,
        }
    ): IDockviewPanel {
        const id =
            typeof groupItemOrId === 'string'
                ? groupItemOrId
                : groupItemOrId.id;

        const panelToRemove = this._panels.find((panel) => panel.id === id);

        if (!panelToRemove) {
            throw new Error('invalid operation');
        }

        return this._removePanel(panelToRemove, options);
    }

    public closeAllPanels(): void {
        if (this.panels.length > 0) {
            // take a copy since we will be edting the array as we iterate through
            const arrPanelCpy = [...this.panels];
            for (const panel of arrPanelCpy) {
                this.doClose(panel);
            }
        } else {
            this.accessor.removeGroup(this.groupPanel);
        }
    }

    public closePanel(panel: IDockviewPanel): void {
        this.doClose(panel);
    }

    private doClose(panel: IDockviewPanel): void {
        const isLast =
            this.panels.length === 1 && this.accessor.groups.length === 1;

        this.accessor.removePanel(
            panel,
            isLast && this.accessor.options.noPanelsOverlay === 'emptyGroup'
                ? { removeEmptyGroup: false }
                : undefined
        );
    }

    public isPanelActive(panel: IDockviewPanel): boolean {
        return this._activePanel === panel;
    }

    updateActions(element: HTMLElement | undefined): void {
        this.tabsContainer.setRightActionsElement(element);
    }

    public setActive(isGroupActive: boolean, force = false): void {
        if (!force && this.isActive === isGroupActive) {
            return;
        }

        this._isGroupActive = isGroupActive;

        toggleClass(this.container, 'dv-active-group', isGroupActive);
        toggleClass(this.container, 'dv-inactive-group', !isGroupActive);

        this.tabsContainer.setActive(this.isActive);

        if (!this._activePanel && this.panels.length > 0) {
            this.doSetActivePanel(this.panels[0]);
        }

        this.updateContainer();
    }

    public layout(width: number, height: number): void {
        this._width = width;
        this._height = height;

        this.contentContainer.layout(this._width, this._height);

        if (this._activePanel?.layout) {
            this._activePanel.layout(this._width, this._height);
        }
    }

    private _removePanel(
        panel: IDockviewPanel,
        options: {
            skipSetActive?: boolean;
            skipSetActiveGroup?: boolean;
        }
    ): IDockviewPanel {
        const isActivePanel = this._activePanel === panel;

        this.doRemovePanel(panel);

        if (isActivePanel && this.panels.length > 0) {
            const nextPanel = this.mostRecentlyUsed[0];
            this.openPanel(nextPanel, {
                skipSetActive: options.skipSetActive,
                skipSetGroupActive: options.skipSetActiveGroup,
            });
        }

        if (this._activePanel && this.panels.length === 0) {
            this.doSetActivePanel(undefined);
        }

        if (!options.skipSetActive) {
            this.updateContainer();
        }

        return panel;
    }

    private doRemovePanel(panel: IDockviewPanel): void {
        const index = this.panels.indexOf(panel);

        if (this._activePanel === panel) {
            this.contentContainer.closePanel();
        }

        this.tabsContainer.delete(panel.id);
        this._panels.splice(index, 1);

        if (this.mostRecentlyUsed.includes(panel)) {
            const index = this.mostRecentlyUsed.indexOf(panel);
            this.mostRecentlyUsed.splice(index, 1);
        }

        const disposable = this._panelDisposables.get(panel.id);
        if (disposable) {
            disposable.dispose();
            this._panelDisposables.delete(panel.id);
        }

        // Remove panel from its tab group (auto-destroys empty groups)
        this.removePanelFromTabGroup(panel.id);

        this._onDidRemovePanel.fire({ panel });
    }

    private doAddPanel(
        panel: IDockviewPanel,
        index: number = this.panels.length,
        options: {
            skipSetActive: boolean;
        } = { skipSetActive: false }
    ): void {
        const existingPanel = this._panels.indexOf(panel);
        const hasExistingPanel = existingPanel > -1;

        this.tabsContainer.show();
        this.contentContainer.show();

        this.tabsContainer.openPanel(panel, index);

        if (!options.skipSetActive) {
            this.contentContainer.openPanel(panel);
        } else if (panel.api.renderer === 'always') {
            this.contentContainer.renderPanel(panel, { asActive: false });
        }

        if (hasExistingPanel) {
            // TODO - need to ensure ordering hasn't changed and if it has need to re-order this.panels
            return;
        }

        this.updateMru(panel);
        this.panels.splice(index, 0, panel);

        this._panelDisposables.set(
            panel.id,
            new CompositeDisposable(
                panel.api.onDidTitleChange((event) =>
                    this._onDidPanelTitleChange.fire(event)
                ),
                panel.api.onDidParametersChange((event) =>
                    this._onDidPanelParametersChange.fire(event)
                )
            )
        );

        this._onDidAddPanel.fire({ panel });
    }

    private doSetActivePanel(panel: IDockviewPanel | undefined): void {
        if (this._activePanel === panel) {
            return;
        }

        this._activePanel = panel;

        if (panel) {
            this.tabsContainer.setActivePanel(panel);

            this.contentContainer.openPanel(panel);

            panel.layout(this._width, this._height);

            this.updateMru(panel);

            // Refresh focus state to handle programmatic activation without DOM focus change
            this.contentContainer.refreshFocusState();

            this._onDidActivePanelChange.fire({
                panel,
            });
        }
    }

    private updateMru(panel: IDockviewPanel): void {
        if (this.mostRecentlyUsed.includes(panel)) {
            this.mostRecentlyUsed.splice(
                this.mostRecentlyUsed.indexOf(panel),
                1
            );
        }
        this.mostRecentlyUsed = [panel, ...this.mostRecentlyUsed];
    }

    private updateContainer(): void {
        this.panels.forEach((panel) => panel.runEvents());

        const shouldShowWatermark = this.isEmpty || !this._activePanel;

        if (shouldShowWatermark && !this.watermark) {
            const watermark = this.accessor.createWatermarkComponent();
            watermark.init({
                containerApi: this._api,
                group: this.groupPanel,
            });
            this.watermark = watermark;

            addDisposableListener(this.watermark.element, 'pointerdown', () => {
                if (!this.isActive) {
                    this.accessor.doSetGroupActive(this.groupPanel);
                }
            });

            this.contentContainer.element.appendChild(this.watermark.element);
        }
        if (!shouldShowWatermark && this.watermark) {
            this.watermark.element.remove();
            this.watermark.dispose?.();
            this.watermark = undefined;
        }
    }

    canDisplayOverlay(
        event: DragEvent,
        position: Position,
        target: DockviewGroupDropLocation
    ): boolean {
        const firedEvent = new DockviewUnhandledDragOverEvent(
            event,
            target,
            position,
            getPanelData,
            this.accessor.getPanel(this.id)
        );

        this._onUnhandledDragOverEvent.fire(firedEvent);

        return firedEvent.isAccepted;
    }

    private handleDropEvent(
        type: 'header' | 'content',
        event: DragEvent,
        position: Position,
        index?: number
    ): void {
        if (this.locked === 'no-drop-target') {
            return;
        }

        function getKind(): DockviewGroupDropLocation {
            switch (type) {
                case 'header':
                    return typeof index === 'number' ? 'tab' : 'header_space';
                case 'content':
                    return 'content';
            }
        }

        const panel =
            typeof index === 'number' ? this.panels[index] : undefined;

        const willDropEvent = new DockviewWillDropEvent({
            nativeEvent: event,
            position,
            panel,
            getData: () => getPanelData(),
            kind: getKind(),
            group: this.groupPanel,
            api: this._api,
        });

        this._onWillDrop.fire(willDropEvent);

        if (willDropEvent.defaultPrevented) {
            return;
        }

        const data = getPanelData();

        if (data && data.viewId === this.accessor.id) {
            if (type === 'content') {
                if (data.groupId === this.id) {
                    // don't allow to drop on self for center position

                    if (position === 'center') {
                        return;
                    }

                    if (data.panelId === null) {
                        // don't allow group move to drop anywhere on self
                        return;
                    }
                }
            }

            if (type === 'header') {
                if (data.groupId === this.id) {
                    if (data.panelId === null) {
                        return;
                    }
                }
            }

            if (data.panelId === null) {
                // this is a group move dnd event
                const { groupId } = data;

                this._onMove.fire({
                    target: position,
                    groupId: groupId,
                    index,
                });
                return;
            }

            const fromSameGroup =
                this.tabsContainer.indexOf(data.panelId) !== -1;

            if (fromSameGroup && this.tabsContainer.size === 1) {
                return;
            }

            const { groupId, panelId } = data;
            const isSameGroup = this.id === groupId;
            if (isSameGroup && !position) {
                const oldIndex = this.tabsContainer.indexOf(panelId);
                if (oldIndex === index) {
                    return;
                }
            }

            this._onMove.fire({
                target: position,
                groupId: data.groupId,
                itemId: data.panelId,
                index,
            });
        } else {
            this._onDidDrop.fire(
                new DockviewDidDropEvent({
                    nativeEvent: event,
                    position,
                    panel,
                    getData: () => getPanelData(),
                    group: this.groupPanel,
                    api: this._api,
                })
            );
        }
    }

    updateDragAndDropState(): void {
        this.tabsContainer.updateDragAndDropState();
    }

    public dispose(): void {
        super.dispose();

        this.watermark?.element.remove();
        this.watermark?.dispose?.();
        this.watermark = undefined;

        // Dispose all tab groups
        for (const tabGroup of [...this._tabGroups]) {
            tabGroup.dispose();
        }
        for (const disposable of this._tabGroupDisposables.values()) {
            disposable.dispose();
        }
        this._tabGroupDisposables.clear();

        // Dispose any microtask-deferred disposables that haven't run yet
        for (const disposable of this._pendingMicrotaskDisposables) {
            disposable.dispose();
        }
        this._pendingMicrotaskDisposables.clear();

        for (const panel of this.panels) {
            panel.dispose();
        }

        this.tabsContainer.dispose();
        this.contentContainer.dispose();
    }
}
