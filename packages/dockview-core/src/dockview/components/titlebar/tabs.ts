import { getPanelData } from '../../../dnd/dataTransfer';
import {
    addClasses,
    isChildEntirelyVisibleWithinParent,
    OverflowObserver,
    removeClasses,
    toggleClass,
} from '../../../dom';
import { addDisposableListener, Emitter, Event } from '../../../events';
import {
    CompositeDisposable,
    Disposable,
    IDisposable,
    IValueDisposable,
    MutableDisposable,
} from '../../../lifecycle';
import { Scrollbar } from '../../../scrollbar';
import { DockviewComponent } from '../../dockviewComponent';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { DockviewWillShowOverlayLocationEvent } from '../../events';
import { DockviewPanel, IDockviewPanel } from '../../dockviewPanel';
import { DockviewHeaderDirection } from '../../options';
import { Tab } from '../tab/tab';
import { TabDragEvent, TabDropIndexEvent } from './tabsContainer';
import { ITabGroup } from '../../tabGroup';
import { TabGroupChip } from './tabGroupChip';
import { ITabGroupChipRenderer } from '../../framework';

interface TabAnimationState {
    sourceTabId: string;
    sourceIndex: number;
    tabPositions: Map<string, DOMRect>;
    /** Group-chip widths keyed by group ID, captured before collapse */
    chipPositions: Map<string, number>;
    currentInsertionIndex: number | null;
    targetTabGroupId: string | null;
    /** When set, the drag source is a group chip (entire group drag) */
    sourceTabGroupId: string | null;
    /** Cached panel IDs of the source group (avoids repeated lookups during drag) */
    sourceGroupPanelIds: Set<string> | null;
    /** Width of the group chip, captured before collapse */
    sourceChipWidth: number;
    /** Distance from cursor to the left edge of the drag image */
    cursorOffsetFromDragLeft: number;
    /** Total width of the dragged content (chip + tabs for groups, tab width for singles) */
    sourceGapWidth: number;
    /** Left edge of the tabs container at drag start */
    containerLeft: number;
}

export class Tabs extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly _tabsList: HTMLElement;
    private readonly _observerDisposable = new MutableDisposable();
    private readonly _scrollbar: Scrollbar | null = null;

    private _tabs: IValueDisposable<Tab>[] = [];
    private readonly _tabMap = new Map<string, IValueDisposable<Tab>>();
    private selectedIndex = -1;
    private _showTabsOverflowControl = false;
    private _direction: DockviewHeaderDirection = 'horizontal';
    private _animState: TabAnimationState | null = null;
    private _pendingCollapse = false;
    private _skipNextCollapseAnimation = false;
    private _voidContainer: HTMLElement | null = null;
    private _voidContainerListeners: IDisposable | null = null;
    private _extendedDropZone: HTMLElement | null = null;

    private readonly _chipRenderers = new Map<
        string,
        { chip: ITabGroupChipRenderer; disposable: IDisposable }
    >();

    private readonly _groupUnderlines = new Map<string, HTMLElement>();
    private _underlineRafId: number | null = null;

    private readonly _onTabDragStart = new Emitter<TabDragEvent>();
    readonly onTabDragStart: Event<TabDragEvent> = this._onTabDragStart.event;

    private readonly _onDrop = new Emitter<TabDropIndexEvent>();
    readonly onDrop: Event<TabDropIndexEvent> = this._onDrop.event;

    private readonly _onWillShowOverlay =
        new Emitter<DockviewWillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<DockviewWillShowOverlayLocationEvent> =
        this._onWillShowOverlay.event;

    private readonly _onOverflowTabsChange = new Emitter<{
        tabs: string[];
        reset: boolean;
    }>();
    readonly onOverflowTabsChange = this._onOverflowTabsChange.event;

    get showTabsOverflowControl(): boolean {
        return this._showTabsOverflowControl;
    }

    set showTabsOverflowControl(value: boolean) {
        if (this._showTabsOverflowControl == value) {
            return;
        }

        this._showTabsOverflowControl = value;

        if (value) {
            const observer = new OverflowObserver(this._tabsList);

            this._observerDisposable.value = new CompositeDisposable(
                observer,
                observer.onDidChange((event) => {
                    const hasOverflow = event.hasScrollX || event.hasScrollY;
                    this.toggleDropdown({ reset: !hasOverflow });
                }),
                addDisposableListener(this._tabsList, 'scroll', () => {
                    this.toggleDropdown({ reset: false });
                })
            );
        }
    }

    get element(): HTMLElement {
        return this._element;
    }

    set voidContainer(el: HTMLElement | null) {
        this._voidContainerListeners?.dispose();
        this._voidContainerListeners = null;
        this._voidContainer = el;

        if (el) {
            this._voidContainerListeners = new CompositeDisposable(
                addDisposableListener(el, 'dragover', (event) => {
                    if (this._animState) {
                        event.preventDefault();
                    }
                }),
                addDisposableListener(el, 'drop', (event) => {
                    if (
                        this._animState?.sourceTabGroupId &&
                        this._animState.currentInsertionIndex !== null
                    ) {
                        event.preventDefault();
                        event.stopPropagation();
                        this.handleVoidDrop();
                    }
                })
            );
        }
    }

    /**
     * Handle a drop that occurred on the void container (empty header
     * space to the right of the tabs). Returns `true` if the drop was
     * consumed by an active group drag, `false` otherwise.
     */
    handleVoidDrop(): boolean {
        if (!this._animState?.sourceTabGroupId) {
            return false;
        }
        const sourceTabGroupId = this._animState.sourceTabGroupId;
        const insertionIndex =
            this._animState.currentInsertionIndex ?? this._tabs.length;
        this._animState = null;
        this._commitGroupMove(sourceTabGroupId, insertionIndex);
        return true;
    }

    get panels(): string[] {
        return this._tabs.map((_) => _.value.panel.id);
    }

    get size(): number {
        return this._tabs.length;
    }

    get tabs(): Tab[] {
        return this._tabs.map((_) => _.value);
    }

    get direction(): DockviewHeaderDirection {
        return this._direction;
    }

    set direction(value: DockviewHeaderDirection) {
        if (this._direction === value) {
            return;
        }

        this._direction = value;
        if (this._scrollbar) {
            this._scrollbar.orientation = value;
        }
        removeClasses(this._tabsList, 'dv-horizontal', 'dv-vertical');
        if (value === 'vertical') {
            addClasses(
                this._tabsList,
                'dv-tabs-container-vertical',
                'dv-vertical'
            );
        } else {
            removeClasses(this._tabsList, 'dv-tabs-container-vertical');
            addClasses(this._tabsList, 'dv-horizontal');
        }

        for (const tab of this._tabs) {
            tab.value.setDirection(value);
        }
    }

    constructor(
        private readonly group: DockviewGroupPanel,
        private readonly accessor: DockviewComponent,
        options: {
            showTabsOverflowControl: boolean;
        }
    ) {
        super();

        this._tabsList = document.createElement('div');
        this._tabsList.className = 'dv-tabs-container';

        this.showTabsOverflowControl = options.showTabsOverflowControl;

        if (accessor.options.scrollbars === 'native') {
            this._element = this._tabsList;
        } else {
            this._scrollbar = new Scrollbar(this._tabsList);
            this._scrollbar.orientation = this.direction;
            this._element = this._scrollbar.element;
            this.addDisposables(this._scrollbar);
        }

        this.addDisposables(
            this._onOverflowTabsChange,
            this._observerDisposable,
            this._onWillShowOverlay,
            this._onDrop,
            this._onTabDragStart,
            addDisposableListener(this.element, 'pointerdown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }

                const isLeftClick = event.button === 0;

                if (isLeftClick) {
                    this.accessor.doSetGroupActive(this.group);
                }
            }),
            addDisposableListener(
                this._tabsList,
                'dragover',
                (event) => {
                    if (!this._animState) {
                        // Check for external drag from another group
                        if (
                            this.accessor.options.tabAnimation === 'default' ||
                            this.accessor.options.disableDnd
                        ) {
                            return;
                        }
                        const data = getPanelData();
                        if (
                            data &&
                            data.panelId &&
                            data.groupId !== this.group.id
                        ) {
                            const avgWidth = this.getAverageTabWidth();
                            this._animState = {
                                sourceTabId: data.panelId,
                                sourceIndex: -1,
                                tabPositions: this.snapshotTabPositions(),
                                chipPositions: this.snapshotChipWidths(),
                                currentInsertionIndex: null,
                                targetTabGroupId: null,
                                sourceTabGroupId: null,
                                sourceGroupPanelIds: null,
                                sourceChipWidth: 0,
                                cursorOffsetFromDragLeft: avgWidth / 2,
                                sourceGapWidth: avgWidth,
                                containerLeft:
                                    this._tabsList.getBoundingClientRect().left,
                            };
                        } else {
                            return;
                        }
                    }
                    event.preventDefault(); // allow drop to fire on the container
                    // For intra-group drag (sourceIndex >= 0) the gap
                    // animation is the sole visual indicator — clear any
                    // stale anchor overlay that may have been set while the
                    // cursor was over the panel content area or another zone.
                    // External drags (sourceIndex === -1) leave the overlay
                    // to the individual tab Droptargets so cross-group
                    // animation is not disrupted.
                    if (this._animState!.sourceIndex !== -1) {
                        this.group.model.dropTargetContainer?.model?.clear();
                    }
                    this.handleDragOver(event);
                },
                true
            ),
            addDisposableListener(
                this._tabsList,
                'dragleave',
                (event) => {
                    if (!this._animState) {
                        return;
                    }
                    const related = event.relatedTarget as HTMLElement | null;
                    // Ignore moves between children of the tabs list
                    if (related && this._tabsList.contains(related)) {
                        return;
                    }
                    // If moving into the broader drop zone (e.g. void container,
                    // left actions), keep _animState alive so the external
                    // dragover listeners can continue the gap animation.
                    if (related && this._extendedDropZone?.contains(related)) {
                        this.resetTabTransforms();
                        this._animState.currentInsertionIndex = null;
                        return;
                    }
                    // When leaving toward the void container (empty header space
                    // to the right), keep the animation state so the drop can
                    // still land at the end position.
                    const rt = event.relatedTarget as HTMLElement | null;
                    const isVoid =
                        this._voidContainer &&
                        rt &&
                        (rt === this._voidContainer ||
                            this._voidContainer.contains(rt));
                    if (isVoid) {
                        return;
                    }
                    this.resetTabTransforms();
                    if (this._animState) {
                        if (this._animState.sourceIndex === -1) {
                            // External drag left the header entirely — clear
                            // state (no dragend will fire on this tab list).
                            // Also clear the anchor overlay: the tab-level
                            // Droptarget onDragLeave does not clear the
                            // override target, so if the drag re-enters
                            // another group's header where canDisplayOverlay
                            // returns false (e.g. same-group smooth mode) the
                            // overlay would remain stranded here.
                            this.group.model.dropTargetContainer?.model?.clear();
                            this._animState = null;
                        } else {
                            this._animState.currentInsertionIndex = null;
                        }
                    }
                },
                true
            ),
            addDisposableListener(this._tabsList, 'dragend', () => {
                // Only fires for cancel (not after successful drop, since
                // source tab is removed from DOM and doesn't bubble)
                this.resetDragAnimation();
            }),
            addDisposableListener(
                this._tabsList,
                'drop',
                (event) => {
                    if (
                        this.accessor.options.tabAnimation !== 'smooth' ||
                        !this._animState ||
                        this._animState.currentInsertionIndex === null
                    ) {
                        return;
                    }

                    event.stopPropagation();
                    event.preventDefault();

                    // The capturing stopPropagation above prevents the
                    // individual tab's Droptarget.onDrop from firing, so
                    // the anchor overlay won't be cleared by that path.
                    // Clear it explicitly here before processing the drop.
                    this.group.model.dropTargetContainer?.model?.clear();

                    const animState = this._animState;
                    this._animState = null;
                    this._pendingCollapse = false;

                    // Handle group drag (entire group repositioned)
                    if (animState.sourceTabGroupId) {
                        this._commitGroupMove(
                            animState.sourceTabGroupId,
                            animState.currentInsertionIndex as number
                        );
                        return;
                    }

                    const insertionIndex =
                        animState.currentInsertionIndex as number;
                    const sourceIndex = animState.sourceIndex;
                    const adjustedIndex =
                        insertionIndex -
                        (sourceIndex !== -1 && sourceIndex < insertionIndex
                            ? 1
                            : 0);

                    const sourceCurrentGroup =
                        this.group.model.getTabGroupForPanel(
                            animState.sourceTabId
                        );
                    if (
                        adjustedIndex === sourceIndex &&
                        !animState.targetTabGroupId &&
                        !sourceCurrentGroup
                    ) {
                        this._uncollapsSourceTab(animState.sourceTabId);
                        this.resetTabTransforms();
                        return;
                    }

                    this._uncollapsSourceTab(animState.sourceTabId);

                    const firstPositions = this.snapshotTabPositions();
                    this.resetTabTransforms();
                    this._onDrop.fire({
                        event,
                        index: adjustedIndex,
                        targetTabGroupId: animState.targetTabGroupId,
                    });
                    this.runFlipAnimation(
                        firstPositions,
                        animState.sourceTabId,
                        animState.sourceIndex === -1,
                        {
                            from: Math.min(sourceIndex, adjustedIndex),
                            to: Math.max(sourceIndex, adjustedIndex),
                        }
                    );
                },
                true
            ),
            Disposable.from(() => {
                this.resetDragAnimation();
                this._disposeAllChips();

                for (const { value, disposable } of this._tabs) {
                    disposable.dispose();
                    value.dispose();
                }

                this._tabs = [];
                this._tabMap.clear();
            })
        );
    }

    indexOf(id: string): number {
        return this._tabs.findIndex((tab) => tab.value.panel.id === id);
    }

    isActive(tab: Tab): boolean {
        return (
            this.selectedIndex > -1 &&
            this._tabs[this.selectedIndex].value === tab
        );
    }

    setActivePanel(panel: IDockviewPanel): void {
        const isVertical = this._direction === 'vertical';
        let running = 0;

        for (const tab of this._tabs) {
            const isActivePanel = panel.id === tab.value.panel.id;
            tab.value.setActive(isActivePanel);

            if (isActivePanel) {
                const element = tab.value.element;
                const parentElement = element.parentElement!;

                if (isVertical) {
                    if (
                        running < parentElement.scrollTop ||
                        running + element.clientHeight >
                            parentElement.scrollTop + parentElement.clientHeight
                    ) {
                        parentElement.scrollTop = running;
                    }
                } else {
                    if (
                        running < parentElement.scrollLeft ||
                        running + element.clientWidth >
                            parentElement.scrollLeft + parentElement.clientWidth
                    ) {
                        parentElement.scrollLeft = running;
                    }
                }
            }

            running += isVertical
                ? tab.value.element.clientHeight
                : tab.value.element.clientWidth;
        }

        // Reposition underlines so the wrap-around follows the new active tab
        if (this._groupUnderlines.size > 0) {
            this._positionUnderlines();
        }
    }

    openPanel(panel: IDockviewPanel, index: number = this._tabs.length): void {
        if (this._tabMap.has(panel.id)) {
            return;
        }
        const tab = new Tab(panel, this.accessor, this.group);
        tab.setContent(panel.view.tab);
        if (this._direction !== 'horizontal') {
            tab.setDirection(this._direction);
        }

        const disposable = new CompositeDisposable(
            tab.onDragStart((event) => {
                this._onTabDragStart.fire({ nativeEvent: event, panel });

                if (this.accessor.options.tabAnimation === 'smooth') {
                    const tabWidth = tab.element.getBoundingClientRect().width;
                    const sourceIndex = this._tabs.findIndex(
                        (x) => x.value === tab
                    );

                    this._animState = {
                        sourceTabId: panel.id,
                        sourceIndex,
                        tabPositions: this.snapshotTabPositions(),
                        chipPositions: this.snapshotChipWidths(),
                        currentInsertionIndex: null,
                        targetTabGroupId: null,
                        sourceTabGroupId: null,
                        sourceGroupPanelIds: null,
                        sourceChipWidth: 0,
                        cursorOffsetFromDragLeft: tabWidth / 2,
                        sourceGapWidth: tabWidth,
                        containerLeft:
                            this._tabsList.getBoundingClientRect().left,
                    };

                    // Collapse the source tab after the browser captures the
                    // drag image, then open the gap at the source position in
                    // the same paint frame — no visual jump.
                    // Both collapse and gap must be instant (no transition).
                    this._pendingCollapse = true;
                    requestAnimationFrame(() => {
                        this._pendingCollapse = false;
                        if (!this._animState) {
                            return;
                        }
                        // Collapse source tab instantly (no transition)
                        tab.element.style.transition = 'none';
                        toggleClass(tab.element, 'dv-tab--dragging', true);
                        tab.element.offsetHeight; // force reflow

                        if (this._animState.currentInsertionIndex === null) {
                            this._animState.currentInsertionIndex = sourceIndex;
                        }
                        // Apply gap with transitions disabled on the target
                        this.applyDragOverTransforms(true);

                        // Re-enable transitions for subsequent moves
                        tab.element.style.removeProperty('transition');
                    });
                }
            }),
            tab.onTabClick((event) => {
                if (event.defaultPrevented) {
                    return;
                }
                if (this.group.api.location.type !== 'fixed') {
                    return;
                }
                if (this.group.activePanel === panel) {
                    // Clicking the active tab toggles expansion
                    if (this.group.api.isCollapsed()) {
                        this.group.api.expand();
                    } else {
                        this.group.api.collapse();
                    }
                } else {
                    // Clicking a non-active tab switches the active tab.
                    // If the group is collapsed, also expand it.
                    this.group.model.openPanel(panel);
                    if (this.group.api.isCollapsed()) {
                        this.group.api.expand();
                    }
                }
            }),
            tab.onPointerDown((event) => {
                if (event.defaultPrevented) {
                    return;
                }

                const isFloatingGroupsEnabled =
                    !this.accessor.options.disableFloatingGroups;

                const isFloatingWithOnePanel =
                    this.group.api.location.type === 'floating' &&
                    this.size === 1;

                if (
                    isFloatingGroupsEnabled &&
                    !isFloatingWithOnePanel &&
                    event.shiftKey
                ) {
                    event.preventDefault();

                    const panel = this.accessor.getGroupPanel(tab.panel.id);

                    const { top, left } = tab.element.getBoundingClientRect();
                    const { top: rootTop, left: rootLeft } =
                        this.accessor.element.getBoundingClientRect();

                    this.accessor.addFloatingGroup(panel as DockviewPanel, {
                        x: left - rootLeft,
                        y: top - rootTop,
                        inDragMode: true,
                    });
                    return;
                }

                switch (event.button) {
                    case 0:
                        if (this.group.api.location.type === 'fixed') {
                            // All tab interaction for fixed groups is handled by
                            // onTabClick to avoid race conditions with active panel state
                        } else {
                            if (this.group.activePanel !== panel) {
                                this.group.model.openPanel(panel);
                            }
                        }
                        break;
                }
            }),
            tab.onDrop((event) => {
                const animState = this._animState;
                this._animState = null;
                this._pendingCollapse = false;

                const tabIndex = this._tabs.findIndex((x) => x.value === tab);

                if (animState) {
                    const dropIndex =
                        event.position === 'right' ? tabIndex + 1 : tabIndex;

                    if (animState.sourceTabGroupId) {
                        this._commitGroupMove(
                            animState.sourceTabGroupId,
                            animState.currentInsertionIndex ?? dropIndex
                        );
                        return;
                    }

                    this._uncollapsSourceTab(animState.sourceTabId);

                    const firstPositions = this.snapshotTabPositions();
                    this.resetTabTransforms();

                    this._onDrop.fire({
                        event: event.nativeEvent,
                        index: dropIndex,
                        targetTabGroupId: animState.targetTabGroupId,
                    });

                    if (this.accessor.options.tabAnimation === 'smooth') {
                        this.runFlipAnimation(
                            firstPositions,
                            animState.sourceTabId,
                            animState.sourceIndex === -1,
                            animState.sourceIndex !== -1
                                ? {
                                      from: Math.min(
                                          animState.sourceIndex,
                                          dropIndex
                                      ),
                                      to: Math.max(
                                          animState.sourceIndex,
                                          dropIndex
                                      ),
                                  }
                                : undefined
                        );
                    }
                } else {
                    // Compute insertion index based on which half of the tab
                    // the pointer is over, then adjust for same-group removal:
                    // when the source tab sits before the insertion point,
                    // removing it shifts all subsequent indices down by one.
                    const afterPosition =
                        this._direction === 'vertical' ? 'bottom' : 'right';
                    const insertionIndex =
                        event.position === afterPosition
                            ? tabIndex + 1
                            : tabIndex;
                    const data = getPanelData();
                    const sourceIndex = data
                        ? this._tabs.findIndex(
                              (x) => x.value.panel.id === data.panelId
                          )
                        : -1;
                    const adjustedIndex =
                        insertionIndex -
                        (sourceIndex !== -1 && sourceIndex < insertionIndex
                            ? 1
                            : 0);
                    const targetTabGroupId =
                        this.group.model.getTabGroupForPanel(
                            tab.panel.id
                        )?.id ?? null;
                    this._onDrop.fire({
                        event: event.nativeEvent,
                        index: adjustedIndex,
                        targetTabGroupId,
                    });
                }
            }),
            tab.onWillShowOverlay((event) => {
                this._onWillShowOverlay.fire(
                    new DockviewWillShowOverlayLocationEvent(event, {
                        kind: 'tab',
                        panel: this.group.activePanel,
                        api: this.accessor.api,
                        group: this.group,
                        getData: getPanelData,
                    })
                );
            })
        );

        const value: IValueDisposable<Tab> = { value: tab, disposable };

        this.addTab(value, index);

        // A new tab may have been inserted between a chip and its
        // group's first tab — reposition all chips to stay correct.
        if (this._chipRenderers.size > 0) {
            for (const tabGroup of this.group.model.getTabGroups()) {
                this._positionChipForGroup(tabGroup);
            }
        }

        // If a tab was added during active drag, refresh positions
        if (this._animState) {
            this._animState.tabPositions = this.snapshotTabPositions();
            this._animState.chipPositions = this.snapshotChipWidths();
            this.applyDragOverTransforms();
        }
    }

    delete(id: string): void {
        if (this._animState?.sourceTabId === id) {
            this.resetTabTransforms();
            this._animState = null;
        }

        const index = this.indexOf(id);
        const tabToRemove = this._tabs.splice(index, 1)[0];
        this._tabMap.delete(id);

        const { value, disposable } = tabToRemove;

        disposable.dispose();
        value.dispose();
        value.element.remove();

        // If a non-source tab was removed during active drag, refresh positions
        if (this._animState) {
            this._animState.tabPositions = this.snapshotTabPositions();
            this._animState.chipPositions = this.snapshotChipWidths();
            this.applyDragOverTransforms();
        }
    }

    private addTab(
        tab: IValueDisposable<Tab>,
        index: number = this._tabs.length
    ): void {
        if (index < 0 || index > this._tabs.length) {
            throw new Error('invalid location');
        }

        // Use the tab element at `index` as the reference node rather than
        // `children[index]`, because `_tabsList` may contain non-tab children
        // (e.g. group chips, underlines) that shift the DOM indices.
        const refNode =
            index < this._tabs.length ? this._tabs[index].value.element : null;
        this._tabsList.insertBefore(tab.value.element, refNode);

        this._tabs = [
            ...this._tabs.slice(0, index),
            tab,
            ...this._tabs.slice(index),
        ];
        this._tabMap.set(tab.value.panel.id, tab);

        if (this.selectedIndex < 0) {
            this.selectedIndex = index;
        }
    }

    private toggleDropdown(options: { reset: boolean }): void {
        const tabs = options.reset
            ? []
            : this._tabs
                  .filter(
                      (tab) =>
                          !isChildEntirelyVisibleWithinParent(
                              tab.value.element,
                              this._tabsList
                          )
                  )
                  .map((x) => x.value.panel.id);

        this._onOverflowTabsChange.fire({ tabs, reset: options.reset });
    }

    updateDragAndDropState(): void {
        for (const tab of this._tabs) {
            tab.value.updateDragAndDropState();
        }
    }

    /**
     * Synchronize chip elements and CSS classes for all tab groups
     * in the parent group model. Call after any tab group mutation.
     */
    updateTabGroups(): void {
        const model = this.group.model;
        const tabGroups = model.getTabGroups();

        // Track which group IDs are still active
        const activeGroupIds = new Set<string>();

        for (const tabGroup of tabGroups) {
            activeGroupIds.add(tabGroup.id);
            this._ensureChipForGroup(tabGroup);
            this._positionChipForGroup(tabGroup);
        }

        // Remove chips for dissolved/destroyed groups
        for (const [groupId, entry] of this._chipRenderers) {
            if (!activeGroupIds.has(groupId)) {
                entry.chip.element.remove();
                entry.chip.dispose();
                entry.disposable.dispose();
                this._chipRenderers.delete(groupId);
            }
        }

        // Update CSS classes on all tabs
        this._updateTabGroupClasses();
    }

    private _ensureChipForGroup(tabGroup: ITabGroup): void {
        if (this._chipRenderers.has(tabGroup.id)) {
            return;
        }

        const createChip = this.accessor.options.createTabGroupChipComponent;
        const chip: ITabGroupChipRenderer = createChip
            ? createChip(tabGroup)
            : new TabGroupChip();

        chip.init({ tabGroup, api: this.accessor.api });

        const disposables: IDisposable[] = [
            tabGroup.onDidChange(() => {
                chip.update?.({ tabGroup });
                this._updateTabGroupClasses();
            }),
            tabGroup.onDidPanelChange(() => {
                this._positionChipForGroup(tabGroup);
                this._updateTabGroupClasses();
            }),
            tabGroup.onDidCollapseChange(() => {
                this._updateTabGroupClasses();
            }),
        ];

        // Wire chip context menu for default chip (has onContextMenu)
        if (chip instanceof TabGroupChip) {
            disposables.push(
                chip.onContextMenu((event) => {
                    this.accessor.contextMenuController.showForChip(
                        tabGroup,
                        this.group,
                        event
                    );
                })
            );
        }

        // Wire chip drag for default chip (has onDragStart)
        if (chip instanceof TabGroupChip) {
            disposables.push(
                chip.onDragStart((event) => {
                    if (this.accessor.options.tabAnimation === 'smooth') {
                        const firstPanelId = tabGroup.panelIds[0];
                        const firstIdx = firstPanelId
                            ? this._tabs.findIndex(
                                  (t) => t.value.panel.id === firstPanelId
                              )
                            : -1;
                        const chipRect = chip.element.getBoundingClientRect();

                        // Compute total group width (chip + all tabs)
                        let groupGapWidth = chipRect.width;
                        for (const pid of tabGroup.panelIds) {
                            const tabEntry = this._tabMap.get(pid);
                            if (tabEntry) {
                                groupGapWidth +=
                                    tabEntry.value.element.getBoundingClientRect()
                                        .width;
                            }
                        }

                        this._animState = {
                            sourceTabId: '',
                            sourceIndex: firstIdx,
                            tabPositions: this.snapshotTabPositions(),
                            chipPositions: this.snapshotChipWidths(),
                            currentInsertionIndex: null,
                            targetTabGroupId: null,
                            sourceTabGroupId: tabGroup.id,
                            sourceGroupPanelIds: new Set(tabGroup.panelIds),
                            sourceChipWidth: chipRect.width,
                            cursorOffsetFromDragLeft:
                                event.clientX - chipRect.left,
                            sourceGapWidth: groupGapWidth,
                            containerLeft:
                                this._tabsList.getBoundingClientRect().left,
                        };

                        // Collapse group tabs + chip after the browser
                        // captures the drag image, then open the gap at the
                        // source position — all instant (no transitions).
                        const groupPanelIds = new Set(tabGroup.panelIds);
                        this._pendingCollapse = true;
                        requestAnimationFrame(() => {
                            this._pendingCollapse = false;
                            if (!this._animState) {
                                return;
                            }
                            // Collapse all group tabs instantly
                            for (const t of this._tabs) {
                                if (groupPanelIds.has(t.value.panel.id)) {
                                    t.value.element.style.transition = 'none';
                                    toggleClass(
                                        t.value.element,
                                        'dv-tab--dragging',
                                        true
                                    );
                                }
                            }
                            // Collapse the group chip instantly
                            const chipEntry = this._chipRenderers.get(
                                tabGroup.id
                            );
                            if (chipEntry) {
                                chipEntry.chip.element.style.transition =
                                    'none';
                                toggleClass(
                                    chipEntry.chip.element,
                                    'dv-tab-group-chip--dragging',
                                    true
                                );
                            }
                            // Single reflow for the entire batch
                            this._tabsList.offsetHeight;

                            const underline = this._groupUnderlines.get(
                                tabGroup.id
                            );
                            if (underline) {
                                underline.style.display = 'none';
                            }

                            if (
                                this._animState.currentInsertionIndex === null
                            ) {
                                this._animState.currentInsertionIndex =
                                    firstIdx;
                            }
                            // Apply gap with transitions disabled
                            this.applyDragOverTransforms(true);

                            // Re-enable transitions for subsequent moves
                            for (const t of this._tabs) {
                                if (groupPanelIds.has(t.value.panel.id)) {
                                    t.value.element.style.removeProperty(
                                        'transition'
                                    );
                                }
                            }
                            if (chipEntry) {
                                chipEntry.chip.element.style.removeProperty(
                                    'transition'
                                );
                            }
                        });
                    }

                    // Build a composite drag image showing chip + group tabs
                    this._setGroupDragImage(event, tabGroup, chip.element);
                })
            );
        }

        const disposable = new CompositeDisposable(...disposables);

        this._chipRenderers.set(tabGroup.id, { chip, disposable });
    }

    private _positionChipForGroup(tabGroup: ITabGroup): void {
        const entry = this._chipRenderers.get(tabGroup.id);
        if (!entry) {
            return;
        }

        const chipEl = entry.chip.element;
        const panelIds = tabGroup.panelIds;

        if (panelIds.length === 0) {
            chipEl.remove();
            return;
        }

        // Find the first tab element of this group
        const firstPanelId = panelIds[0];
        const firstTabEntry = this._tabMap.get(firstPanelId);

        if (!firstTabEntry) {
            chipEl.remove();
            return;
        }

        // Insert chip before the first tab of the group
        const firstTabEl = firstTabEntry.value.element;
        if (chipEl.nextSibling !== firstTabEl) {
            this._tabsList.insertBefore(chipEl, firstTabEl);
        }
    }

    private _updateTabGroupClasses(): void {
        const model = this.group.model;
        const tabGroups = model.getTabGroups();
        let hasAnimation = false;

        // Build a lookup: panelId → tabGroup
        const panelGroupMap = new Map<string, ITabGroup>();
        for (const tg of tabGroups) {
            for (const pid of tg.panelIds) {
                panelGroupMap.set(pid, tg);
            }
        }

        for (const tabEntry of this._tabs) {
            const tab = tabEntry.value;
            const panelId = tab.panel.id;
            const tg = panelGroupMap.get(panelId);

            const isGrouped = !!tg;
            toggleClass(tab.element, 'dv-tab--grouped', isGrouped);

            if (tg) {
                const ids = tg.panelIds;
                const isFirst = ids[0] === panelId;
                const isLast = ids[ids.length - 1] === panelId;

                toggleClass(tab.element, 'dv-tab--group-first', isFirst);
                toggleClass(tab.element, 'dv-tab--group-last', isLast);

                // Collapse / expand with animation
                const isCollapsed = tab.element.classList.contains(
                    'dv-tab--group-collapsed'
                );
                if (!tg.collapsed && isCollapsed) {
                    // Collapsed → expanding: animate back
                    hasAnimation = true;
                    tab.element.classList.remove('dv-tab--group-collapsed');
                    tab.element.classList.add('dv-tab--group-expanding');
                    const onEnd = () => {
                        tab.element.classList.remove('dv-tab--group-expanding');
                        tab.element.style.removeProperty('width');
                        tab.element.removeEventListener('transitionend', onEnd);
                    };
                    tab.element.addEventListener('transitionend', onEnd);
                }
            } else {
                toggleClass(tab.element, 'dv-tab--group-first', false);
                toggleClass(tab.element, 'dv-tab--group-last', false);
                tab.element.classList.remove(
                    'dv-tab--group-collapsed',
                    'dv-tab--group-expanding'
                );
                tab.element.style.removeProperty('width');
            }
        }

        // Track active group IDs for underline cleanup
        const activeGroupIds = new Set<string>();

        // Handle collapse animation + underline per group
        for (const tg of tabGroups) {
            activeGroupIds.add(tg.id);

            // Ensure underline element exists
            let underline = this._groupUnderlines.get(tg.id);
            if (!underline) {
                underline = document.createElement('div');
                underline.className = 'dv-tab-group-underline';
                this._tabsList.appendChild(underline);
                this._groupUnderlines.set(tg.id, underline);
            }

            // Collapse animation
            const hasNewCollapse =
                tg.collapsed &&
                tg.panelIds.some((pid) => {
                    const te = this._tabMap.get(pid);
                    return (
                        te &&
                        !te.value.element.classList.contains(
                            'dv-tab--group-collapsed'
                        )
                    );
                });

            if (hasNewCollapse) {
                if (this._skipNextCollapseAnimation) {
                    // Apply collapsed state instantly (no animation)
                    for (const pid of tg.panelIds) {
                        const te = this._tabMap.get(pid);
                        if (te) {
                            te.value.element.classList.add(
                                'dv-tab--group-collapsed'
                            );
                        }
                    }
                } else {
                    hasAnimation = true;
                    for (const pid of tg.panelIds) {
                        const te = this._tabMap.get(pid);
                        if (
                            te &&
                            !te.value.element.classList.contains(
                                'dv-tab--group-collapsed'
                            )
                        ) {
                            const w =
                                te.value.element.getBoundingClientRect().width;
                            te.value.element.style.width = `${w}px`;
                            te.value.element.offsetHeight; // force reflow
                            te.value.element.classList.add(
                                'dv-tab--group-collapsed'
                            );
                        }
                    }
                }
            }
        }

        // Remove underlines for dissolved groups
        for (const [groupId, el] of this._groupUnderlines) {
            if (!activeGroupIds.has(groupId)) {
                el.remove();
                this._groupUnderlines.delete(groupId);
            }
        }

        this._skipNextCollapseAnimation = false;

        // Position underlines: use rAF loop during animations for fluid tracking
        if (hasAnimation) {
            this._trackUnderlines();
        } else {
            this._positionUnderlines();
        }
    }

    private _positionUnderlinesSync(): void {
        const containerRect = this._tabsList.getBoundingClientRect();
        const tabGroups = this.group.model.getTabGroups();
        const containerHeight = containerRect.height;
        const activePanelId = this.group.activePanel?.id;

        for (const tg of tabGroups) {
            const underline = this._groupUnderlines.get(tg.id);
            if (!underline) {
                continue;
            }

            const panelIds = tg.panelIds;
            if (panelIds.length === 0) {
                underline.style.display = 'none';
                continue;
            }

            underline.style.display = '';

            const chipEntry = this._chipRenderers.get(tg.id);
            const chipEl = chipEntry?.chip.element;

            let leftEdge: number;
            if (chipEl) {
                leftEdge =
                    chipEl.getBoundingClientRect().left - containerRect.left;
            } else {
                const firstPanelId = panelIds[0];
                const firstTabEntry = this._tabMap.get(firstPanelId);
                leftEdge = firstTabEntry
                    ? firstTabEntry.value.element.getBoundingClientRect().left -
                      containerRect.left
                    : 0;
            }

            // Measure the actual last tab position (follows CSS transitions in real-time)
            const lastPanelId = panelIds[panelIds.length - 1];
            const lastTabEntry = this._tabMap.get(lastPanelId);

            if (!lastTabEntry) {
                underline.style.left = `${leftEdge}px`;
                underline.style.width = '0px';
                underline.style.clipPath = '';
                continue;
            }

            const lastTabRect =
                lastTabEntry.value.element.getBoundingClientRect();
            let rightEdge = lastTabRect.right - containerRect.left;
            let width = rightEdge - leftEdge;

            // During collapse or expand: converge both edges toward chip center
            const isAnimating =
                tg.collapsed ||
                tg.panelIds.some((pid) => {
                    const te = this._tabMap.get(pid);
                    return (
                        te &&
                        te.value.element.classList.contains(
                            'dv-tab--group-expanding'
                        )
                    );
                });

            if (isAnimating && chipEl) {
                const chipRect = chipEl.getBoundingClientRect();
                const chipCenter =
                    chipRect.left + chipRect.width / 2 - containerRect.left;

                // Sum of current visible tab widths (shrinking or growing)
                let currentTabWidth = 0;
                let fullTabWidth = 0;
                for (const pid of tg.panelIds) {
                    const te = this._tabMap.get(pid);
                    if (!te) continue;
                    const el = te.value.element;
                    currentTabWidth += el.getBoundingClientRect().width;
                    fullTabWidth += el.scrollWidth;
                }

                // progress: 0 when tabs at 0 width, 1 when fully open
                const progress =
                    fullTabWidth > 0
                        ? Math.min(1, currentTabWidth / fullTabWidth)
                        : 0;

                // Interpolate left and right edges toward chip center
                leftEdge = chipCenter + (leftEdge - chipCenter) * progress;
                rightEdge = chipCenter + (rightEdge - chipCenter) * progress;
                width = Math.max(0, rightEdge - leftEdge);
            }

            underline.style.left = `${leftEdge}px`;
            underline.style.width = `${Math.max(0, width)}px`;

            // Chrome-style wrap-around: contour the active tab if it belongs to this group
            this._applyUnderlineShape(
                underline,
                tg,
                leftEdge,
                width,
                containerHeight,
                activePanelId,
                containerRect
            );
        }
    }

    /**
     * Position the underline as a Chrome-style wrap-around: bottom line
     * everywhere, but goes up-left, across-top, down-right around the
     * active tab. Uses 3 child elements: left line, U-wrap, right line.
     */
    private _applyUnderlineShape(
        underline: HTMLElement,
        tg: ITabGroup,
        groupLeft: number,
        groupWidth: number,
        containerHeight: number,
        activePanelId: string | undefined,
        containerRect: DOMRect
    ): void {
        const t = 2; // line thickness in px
        const h = containerHeight;
        const w = groupWidth;

        // Ensure child structure exists (left-line, wrap, right-line)
        if (underline.children.length !== 3) {
            underline.innerHTML = '';
            const leftLine = document.createElement('div');
            leftLine.className = 'dv-tab-group-underline-left';
            const wrap = document.createElement('div');
            wrap.className = 'dv-tab-group-underline-wrap';
            const rightLine = document.createElement('div');
            rightLine.className = 'dv-tab-group-underline-right';
            underline.appendChild(leftLine);
            underline.appendChild(wrap);
            underline.appendChild(rightLine);
        }

        const leftLine = underline.children[0] as HTMLElement;
        const wrap = underline.children[1] as HTMLElement;
        const rightLine = underline.children[2] as HTMLElement;

        if (w <= 0 || h <= 0) {
            leftLine.style.display = 'none';
            wrap.style.display = 'none';
            rightLine.style.display = 'none';
            return;
        }

        // Find the active tab within this group
        let activeTabEntry: IValueDisposable<Tab> | undefined;
        if (activePanelId && tg.panelIds.includes(activePanelId)) {
            activeTabEntry = this._tabMap.get(activePanelId);
        }

        const color = `var(--dv-tab-group-color-${tg.color})`;

        if (!activeTabEntry) {
            // No active tab in this group: single bottom line (use left line for full width)
            leftLine.style.cssText = `position:absolute;bottom:0;left:0;width:${w}px;height:${t}px;background:${color}`;
            wrap.style.display = 'none';
            rightLine.style.display = 'none';
            return;
        }

        const activeRect = activeTabEntry.value.element.getBoundingClientRect();
        const aL = Math.max(
            0,
            activeRect.left - containerRect.left - groupLeft
        );
        const aR = Math.min(
            w,
            activeRect.right - containerRect.left - groupLeft
        );

        if (aR <= aL) {
            leftLine.style.cssText = `position:absolute;bottom:0;left:0;width:${w}px;height:${t}px;background:${color}`;
            wrap.style.display = 'none';
            rightLine.style.display = 'none';
            return;
        }

        const r = 6; // corner radius where the line curves up

        // Hide the separate line elements — we draw everything in the wrap SVG
        leftLine.style.display = 'none';
        rightLine.style.display = 'none';

        // Draw the full underline as an SVG path:
        // bottom-left → right along bottom → curve up at aL → up left side →
        // curve at top-left → across top → curve at top-right → down right side →
        // curve at aR → right along bottom → bottom-right
        const svgW = w;
        const svgH = h;
        const half = t / 2;
        const yBot = svgH - half; // bottom line center (stroke centered)
        const yTop = half; // top line center

        const d = [
            `M 0,${yBot}`, // start at left
            `L ${aL - r},${yBot}`, // bottom line left segment
            `Q ${aL},${yBot} ${aL},${yBot - r}`, // curve up (bottom-left of U)
            `L ${aL},${yTop + r}`, // left side going up
            `Q ${aL},${yTop} ${aL + r},${yTop}`, // curve at top-left
            `L ${aR - r},${yTop}`, // top of U
            `Q ${aR},${yTop} ${aR},${yTop + r}`, // curve at top-right
            `L ${aR},${yBot - r}`, // right side going down
            `Q ${aR},${yBot} ${aR + r},${yBot}`, // curve at bottom-right of U
            `L ${svgW},${yBot}`, // bottom line right segment
        ].join(' ');

        wrap.style.cssText = `position:absolute;bottom:0;left:0;width:${svgW}px;height:${svgH}px`;
        wrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" style="display:block"><path d="${d}" fill="none" stroke="${color}" stroke-width="${t}"/></svg>`;
    }

    private _positionUnderlines(): void {
        requestAnimationFrame(() => {
            this._positionUnderlinesSync();
        });
    }

    /**
     * Continuously reposition underlines every frame for the duration
     * of a tab transition (~200ms), so the underline tracks tab sizes.
     */
    private _trackUnderlines(): void {
        if (this._underlineRafId !== null) {
            cancelAnimationFrame(this._underlineRafId);
        }

        const start = performance.now();
        const duration = 250; // slightly longer than transition to ensure we catch the end

        const tick = () => {
            this._positionUnderlinesSync();
            if (performance.now() - start < duration) {
                this._underlineRafId = requestAnimationFrame(tick);
            } else {
                this._underlineRafId = null;
            }
        };

        this._underlineRafId = requestAnimationFrame(tick);
    }

    private _disposeAllChips(): void {
        if (this._underlineRafId !== null) {
            cancelAnimationFrame(this._underlineRafId);
            this._underlineRafId = null;
        }

        for (const [, entry] of this._chipRenderers) {
            entry.chip.element.remove();
            entry.chip.dispose();
            entry.disposable.dispose();
        }
        this._chipRenderers.clear();

        for (const [, el] of this._groupUnderlines) {
            el.remove();
        }
        this._groupUnderlines.clear();
    }

    /**
     * Sets the broader container that is part of the same logical drop surface
     * as this tab list (e.g. the full header element).  When a dragleave from
     * the tabs list lands inside this container, `_animState` is preserved so
     * that external dragover listeners can continue the animation.
     */
    setExtendedDropZone(el: HTMLElement): void {
        this._extendedDropZone = el;
    }

    /**
     * Allows external elements (e.g. void container, left actions) to push an
     * insertion index into the animation while the cursor is outside the tabs
     * list itself.  Pass `null` to clear the indicator.
     */
    setExternalInsertionIndex(index: number | null): void {
        if (!this._animState) {
            return;
        }
        if (index === this._animState.currentInsertionIndex) {
            return;
        }
        this._animState.currentInsertionIndex = index;
        this.applyDragOverTransforms();
    }

    /**
     * Called when the drag cursor leaves the entire header area (not just the
     * tabs list).  Clears animation state for cross-group drags, which never
     * receive a `dragend` event on this tab list.
     */
    clearExternalAnimState(): void {
        if (!this._animState) {
            return;
        }
        this.resetTabTransforms();
        if (this._animState.sourceIndex === -1) {
            this._animState = null;
        } else {
            this._animState.currentInsertionIndex = null;
        }
    }

    private snapshotTabPositions(): Map<string, DOMRect> {
        const positions = new Map<string, DOMRect>();
        for (const tab of this._tabs) {
            positions.set(
                tab.value.panel.id,
                tab.value.element.getBoundingClientRect()
            );
        }
        return positions;
    }

    private snapshotChipWidths(): Map<string, number> {
        const widths = new Map<string, number>();
        for (const [groupId, entry] of this._chipRenderers) {
            widths.set(
                groupId,
                entry.chip.element.getBoundingClientRect().width
            );
        }
        return widths;
    }

    private getAverageTabWidth(): number {
        if (this._tabs.length === 0) {
            return 0;
        }
        const isVertical = this._direction === 'vertical';
        let total = 0;
        for (const tab of this._tabs) {
            const rect = tab.value.element.getBoundingClientRect();
            total += isVertical ? rect.height : rect.width;
        }
        return total / this._tabs.length;
    }

    private handleDragOver(event: DragEvent): void {
        if (!this._animState) {
            return;
        }

        const mouseX = event.clientX;

        let insertionIndex: number | null = null;
        let targetTabGroupId: string | null = null;

        const sourceGroupPanelIds = this._animState.sourceGroupPanelIds;

        // Accumulation approach: compute where the drag image's left edge
        // would be, then walk tabs left-to-right using their original widths.
        // A tab fits to the left of the gap if the cumulative width of all
        // preceding non-source tabs <= available space.
        const dragLeftEdge = mouseX - this._animState.cursorOffsetFromDragLeft;
        const availableSpace = dragLeftEdge - this._animState.containerLeft;
        let accWidth = 0;

        // Build lookup: first panel ID of each non-source group → group ID
        // so we can add chip widths when we encounter a group's first tab.
        const firstPanelToGroup = new Map<string, string>();
        if (this._chipRenderers.size > 0) {
            const tabGroups = this.group.model.getTabGroups();
            for (const tg of tabGroups) {
                if (tg.id === this._animState.sourceTabGroupId) {
                    continue;
                }
                if (tg.panelIds.length > 0) {
                    firstPanelToGroup.set(tg.panelIds[0], tg.id);
                }
            }
        }

        for (let i = 0; i < this._tabs.length; i++) {
            const tab = this._tabs[i].value;
            if (tab.panel.id === this._animState.sourceTabId) {
                continue;
            }
            if (sourceGroupPanelIds?.has(tab.panel.id)) {
                continue;
            }

            // If this tab is the first of a non-source group, include
            // the chip width (which sits before it in the DOM).
            const groupId = firstPanelToGroup.get(tab.panel.id);
            if (groupId) {
                const chipWidth =
                    this._animState.chipPositions.get(groupId) ?? 0;
                if (accWidth + chipWidth > availableSpace) {
                    // Chip alone overflows — gap goes before this group
                    if (insertionIndex === null) {
                        insertionIndex = i;
                    }
                    break;
                }
                accWidth += chipWidth;
            }

            // Use original width (before collapse/transforms)
            const origRect = this._animState.tabPositions.get(tab.panel.id);
            const tabWidth = origRect
                ? origRect.width
                : tab.element.getBoundingClientRect().width;

            // Shift at the midpoint: a tab moves left once the drag image
            // covers half of it (like Chrome's tab drag behavior).
            if (accWidth + tabWidth / 2 <= availableSpace) {
                accWidth += tabWidth;
                insertionIndex = i + 1;
            } else {
                if (insertionIndex === null) {
                    insertionIndex = i;
                }
                break;
            }
        }

        // Determine which tab group (if any) the insertion index falls within.
        //
        // We use snapshot-based positions (accWidth from the accumulation loop
        // above) to compute original chip boundaries.  This avoids reading
        // getBoundingClientRect() on chips whose live position is shifted by
        // the drag gap margin, which caused oscillation / visual jumps.
        if (insertionIndex !== null && this._chipRenderers.size > 0) {
            const isGroupDrag = !!this._animState.sourceTabGroupId;
            const tabGroups = this.group.model.getTabGroups();

            // Rebuild the accumulated width up to insertionIndex so we know
            // the original right edge of the chip (if any) that precedes it.
            // We walk exactly the same way as the accumulation loop above.
            let accUpTo = 0;
            for (let i = 0; i < this._tabs.length; i++) {
                const tab = this._tabs[i].value;
                if (tab.panel.id === this._animState.sourceTabId) {
                    continue;
                }
                if (sourceGroupPanelIds?.has(tab.panel.id)) {
                    continue;
                }
                if (i >= insertionIndex) {
                    break;
                }
                const gid = firstPanelToGroup.get(tab.panel.id);
                if (gid) {
                    accUpTo += this._animState.chipPositions.get(gid) ?? 0;
                }
                const origRect = this._animState.tabPositions.get(tab.panel.id);
                accUpTo += origRect
                    ? origRect.width
                    : tab.element.getBoundingClientRect().width;
            }

            for (const tg of tabGroups) {
                // Build effective panel list: exclude the source tab
                // so that dragging a tab out of its own group doesn't
                // inflate the group's index range.
                const effectivePanelIds = tg.panelIds.filter(
                    (pid) =>
                        pid !== this._animState!.sourceTabId &&
                        !sourceGroupPanelIds?.has(pid)
                );
                if (effectivePanelIds.length === 0) {
                    continue;
                }
                const firstIdx = this._tabs.findIndex(
                    (t) => t.value.panel.id === effectivePanelIds[0]
                );
                const lastIdx = this._tabs.findIndex(
                    (t) =>
                        t.value.panel.id ===
                        effectivePanelIds[effectivePanelIds.length - 1]
                );
                if (firstIdx === -1 || lastIdx === -1) {
                    continue;
                }

                const isInsideRange =
                    insertionIndex >= firstIdx && insertionIndex <= lastIdx;

                const isJustBeforeGroup =
                    !isInsideRange && insertionIndex === firstIdx - 1;

                if (!isInsideRange && !isJustBeforeGroup) {
                    continue;
                }

                if (isGroupDrag) {
                    // A group cannot be dropped inside another group.
                    // Snap the insertion index to just before or just
                    // after this group based on cursor position relative
                    // to the group's midpoint.
                    const groupMid = (firstIdx + lastIdx + 1) / 2;
                    if (insertionIndex < groupMid) {
                        insertionIndex = firstIdx;
                    } else {
                        insertionIndex = lastIdx + 1;
                    }
                    // targetTabGroupId stays null
                    break;
                }

                if (isJustBeforeGroup) {
                    // Check whether only the source tab (or source group
                    // tabs) sits between insertionIndex and firstIdx.
                    // If so, the source is being dragged away from that
                    // slot, so we ARE effectively "just before" the group
                    // and should still allow dropping into position 0.
                    let allInBetweenAreSource = true;
                    for (let j = insertionIndex; j < firstIdx; j++) {
                        const pid = this._tabs[j].value.panel.id;
                        if (
                            pid !== this._animState!.sourceTabId &&
                            !sourceGroupPanelIds?.has(pid)
                        ) {
                            allInBetweenAreSource = false;
                            break;
                        }
                    }
                    if (!allInBetweenAreSource) {
                        continue;
                    }

                    const chipWidth =
                        this._animState.chipPositions.get(tg.id) ?? 0;
                    const threshold = tg.collapsed
                        ? this._animState.containerLeft +
                          accUpTo +
                          chipWidth / 2
                        : this._animState.containerLeft + accUpTo + chipWidth;
                    if (mouseX >= threshold) {
                        insertionIndex = firstIdx;
                        targetTabGroupId = tg.id;
                    }
                    break;
                }

                if (isInsideRange) {
                    const chipWidth =
                        this._animState.chipPositions.get(tg.id) ?? 0;
                    const chipOriginalRight =
                        this._animState.containerLeft + accUpTo + chipWidth;
                    if (insertionIndex === firstIdx) {
                        if (mouseX >= chipOriginalRight) {
                            targetTabGroupId = tg.id;
                        }
                    } else {
                        targetTabGroupId = tg.id;
                    }
                    break;
                }
            }
        }

        if (
            insertionIndex === this._animState.currentInsertionIndex &&
            targetTabGroupId === this._animState.targetTabGroupId
        ) {
            return;
        }

        this._animState.currentInsertionIndex = insertionIndex;
        this._animState.targetTabGroupId = targetTabGroupId;
        this.applyDragOverTransforms();
    }

    /**
     * Batch-remove a CSS class from multiple elements instantly,
     * forcing only a single reflow for the entire batch.
     */
    private _removeClassInstantlyBatch(
        elements: HTMLElement[],
        cls: string
    ): void {
        const affected: HTMLElement[] = [];
        for (const el of elements) {
            if (el.classList.contains(cls)) {
                el.style.transition = 'none';
                toggleClass(el, cls, false);
                affected.push(el);
            }
        }
        if (affected.length > 0) {
            affected[0].offsetHeight; // single reflow for entire batch
            for (const el of affected) {
                el.style.removeProperty('transition');
            }
        }
    }

    /**
     * Remove `dv-tab--dragging` from the source tab instantly so it
     * regains its real width before FLIP snapshots.
     */
    private _uncollapsSourceTab(sourceTabId: string): void {
        const entry = this._tabMap.get(sourceTabId);
        if (entry) {
            this._removeClassInstantlyBatch(
                [entry.value.element],
                'dv-tab--dragging'
            );
        }
    }

    private applyDragOverTransforms(skipTransition = false): void {
        if (
            !this._animState ||
            this._animState.currentInsertionIndex === null
        ) {
            this.resetTabTransforms();
            return;
        }

        // Don't apply transforms until the source tab has been collapsed
        // in the rAF callback — otherwise the gap + visible source = jump.
        if (this._pendingCollapse) {
            return;
        }

        const insertionIndex = this._animState.currentInsertionIndex;

        // For group drags, gap = sum of all group member widths
        let gapWidth: number;
        const sourceGroupPanelIds = this._animState.sourceGroupPanelIds;
        if (this._animState.sourceTabGroupId && sourceGroupPanelIds) {
            gapWidth = this._animState.sourceGapWidth;
        } else {
            const sourceRect = this._animState.tabPositions.get(
                this._animState.sourceTabId
            );
            gapWidth = sourceRect
                ? sourceRect.width
                : this.getAverageTabWidth();
        }

        // When the insertion lands at or before a group's first tab, shift
        // the chip so the gap appears before the entire group.
        //
        // Two cases:
        // 1. targetTabGroupId is null (standalone drop) — always shift chip.
        // 2. targetTabGroupId is set AND the group is collapsed — shift chip
        //    because the collapsed tabs are invisible, so putting the gap on
        //    them has no visual effect.
        let chipToShift: HTMLElement | null = null;
        if (this._chipRenderers.size > 0) {
            const tabGroups = this.group.model.getTabGroups();
            for (const tg of tabGroups) {
                if (tg.id === this._animState.sourceTabGroupId) continue;
                const effectivePids = tg.panelIds.filter(
                    (pid) =>
                        pid !== this._animState!.sourceTabId &&
                        !sourceGroupPanelIds?.has(pid)
                );
                if (effectivePids.length === 0) continue;
                const firstIdx = this._tabs.findIndex(
                    (t) => t.value.panel.id === effectivePids[0]
                );

                // Only consider chip-shifting when dropping outside the
                // group, or when dropping inside a collapsed group (whose
                // tabs are invisible).
                const shouldShiftChip =
                    !this._animState.targetTabGroupId ||
                    (this._animState.targetTabGroupId === tg.id &&
                        tg.collapsed);

                if (!shouldShiftChip) continue;

                if (firstIdx >= insertionIndex) {
                    let hasTabs = false;
                    for (let j = insertionIndex; j < firstIdx; j++) {
                        const pid = this._tabs[j].value.panel.id;
                        if (pid === this._animState.sourceTabId) continue;
                        if (sourceGroupPanelIds?.has(pid)) continue;
                        hasTabs = true;
                        break;
                    }
                    if (!hasTabs) {
                        const chipEntry = this._chipRenderers.get(tg.id);
                        if (chipEntry) {
                            chipToShift = chipEntry.chip.element;
                        }
                    }
                    break;
                }
            }
        }

        // Helper: pick the correct shifting class for tabs vs chips.
        const shiftingClass = (el: HTMLElement): string =>
            el.classList.contains('dv-tab-group-chip')
                ? 'dv-tab-group-chip--shifting'
                : 'dv-tab--shifting';

        // Helper: apply a margin-left value to an element, optionally
        // bypassing CSS transitions for instant positioning.
        const setMargin = (el: HTMLElement, value: string) => {
            if (skipTransition) {
                el.style.transition = 'none';
                el.style.marginLeft = value;
                el.offsetHeight;
                el.style.removeProperty('transition');
            } else {
                el.style.marginLeft = value;
            }
            toggleClass(el, shiftingClass(el), true);
        };

        const clearMargin = (el: HTMLElement) => {
            const cls = shiftingClass(el);
            if (skipTransition || !el.style.marginLeft) {
                el.style.removeProperty('margin-left');
                toggleClass(el, cls, false);
            } else {
                el.style.marginLeft = '0px';
                toggleClass(el, cls, true);
                const onEnd = () => {
                    el.style.removeProperty('margin-left');
                    toggleClass(el, cls, false);
                    el.removeEventListener('transitionend', onEnd);
                };
                el.addEventListener('transitionend', onEnd);
            }
        };

        let gapApplied = false;

        // Reset all non-source chip margins first
        for (const [groupId, entry] of this._chipRenderers) {
            if (groupId === this._animState.sourceTabGroupId) continue;
            clearMargin(entry.chip.element);
        }

        // Apply gap to chip if insertion is before a group
        if (chipToShift) {
            setMargin(chipToShift, `${gapWidth}px`);
            gapApplied = true;
        }

        for (let i = 0; i < this._tabs.length; i++) {
            const tab = this._tabs[i].value;
            if (tab.panel.id === this._animState.sourceTabId) {
                continue;
            }
            if (sourceGroupPanelIds?.has(tab.panel.id)) {
                continue;
            }

            if (!gapApplied && i >= insertionIndex) {
                setMargin(tab.element, `${gapWidth}px`);
                gapApplied = true;
            } else {
                clearMargin(tab.element);
            }
        }

        // Reposition underlines to follow shifted chips/tabs
        this._trackUnderlines();
    }

    private resetTabTransforms(): void {
        for (const tab of this._tabs) {
            tab.value.element.style.removeProperty('margin-left');
            tab.value.element.style.removeProperty('margin-right');
            tab.value.element.style.removeProperty('margin-top');
            tab.value.element.style.removeProperty('margin-bottom');
            tab.value.element.style.removeProperty('transform');
            toggleClass(tab.value.element, 'dv-tab--shifting', false);
        }
        for (const [, entry] of this._chipRenderers) {
            entry.chip.element.style.removeProperty('margin-left');
            toggleClass(
                entry.chip.element,
                'dv-tab-group-chip--shifting',
                false
            );
        }
        this._positionUnderlines();
    }

    private _setGroupDragImage(
        event: DragEvent,
        tabGroup: ITabGroup,
        chipEl: HTMLElement
    ): void {
        if (!event.dataTransfer) {
            return;
        }

        const groupPanelIds = new Set(tabGroup.panelIds);
        const underlineEl = this._groupUnderlines.get(tabGroup.id);

        // Clone the entire tabs list so cloned nodes inherit all
        // theme styles, CSS variables and class-based rules.
        const clone = this._tabsList.cloneNode(true) as HTMLElement;
        clone.style.height = `${this._tabsList.offsetHeight}px`;
        clone.style.width = 'auto';
        clone.style.overflow = 'visible';
        clone.style.pointerEvents = 'none';

        // Remove elements not belonging to this group.
        // Keep: chip, group tabs, group underline.
        // Walk backwards so removals don't shift indices.
        const children = Array.from(clone.children);
        const realChildren = Array.from(this._tabsList.children);
        for (let i = children.length - 1; i >= 0; i--) {
            const real = realChildren[i];
            if (!real) {
                children[i].remove();
                continue;
            }
            if (real === chipEl || real === underlineEl) {
                continue; // keep the chip and underline
            }
            if (real.classList.contains('dv-tab')) {
                const tabEntry = this._tabs.find(
                    (t) => t.value.element === real
                );
                if (tabEntry && groupPanelIds.has(tabEntry.value.panel.id)) {
                    continue; // keep
                }
            }
            children[i].remove();
        }

        // Re-position the underline clone as a simple bottom line for the drag ghost
        const underlineClone = clone.querySelector('.dv-tab-group-underline');
        if (underlineClone instanceof HTMLElement) {
            underlineClone.innerHTML = '';
            underlineClone.style.left = '0px';
            underlineClone.style.width = '100%';
            underlineClone.style.top = 'auto';
            underlineClone.style.bottom = '0';
            underlineClone.style.height = '2px';
            underlineClone.style.backgroundColor = `var(--dv-tab-group-color-${tabGroup.color})`;
        }

        // Wrap the clone in a minimal ancestor chain so that CSS
        // selectors like `.dv-groupview.dv-active-group > .dv-tabs-and-actions-container .dv-tabs-container > .dv-tab`
        // match the cloned tabs and apply correct color/background.
        const wrapper = document.createElement('div');
        wrapper.className = 'dv-groupview dv-active-group';
        wrapper.style.position = 'fixed';
        wrapper.style.top = '-10000px';
        wrapper.style.left = '0px';
        wrapper.style.height = 'auto';
        wrapper.style.width = 'auto';
        wrapper.style.pointerEvents = 'none';

        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'dv-tabs-and-actions-container';
        actionsWrapper.style.height = 'auto';
        actionsWrapper.style.width = 'auto';
        wrapper.appendChild(actionsWrapper);
        actionsWrapper.appendChild(clone);

        // Append inside the dockview root so CSS variables are inherited
        this.accessor.element.appendChild(wrapper);

        // Compute cursor offset relative to the wrapper element.
        // The cloned chip is the first .dv-tab-group-chip in the clone.
        const clonedChip = clone.querySelector('.dv-tab-group-chip');
        const chipRect = chipEl.getBoundingClientRect();
        const cursorInChipX = event.clientX - chipRect.left;
        const cursorInChipY = event.clientY - chipRect.top;

        if (clonedChip) {
            const clonedChipRect = clonedChip.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();
            const offsetX =
                clonedChipRect.left - wrapperRect.left + cursorInChipX;
            const offsetY =
                clonedChipRect.top - wrapperRect.top + cursorInChipY;
            event.dataTransfer.setDragImage(wrapper, offsetX, offsetY);
        } else {
            event.dataTransfer.setDragImage(
                wrapper,
                cursorInChipX,
                cursorInChipY
            );
        }

        // Clean up after the browser captures the image
        requestAnimationFrame(() => {
            wrapper.remove();
        });
    }

    /**
     * Instantly remove drag-collapse classes from a group's chip and tabs
     * so that the subsequent rebuild doesn't trigger expand animations.
     */
    /**
     * Commit a group-drag drop: clear drag classes, move the group
     * in the model, and run a FLIP animation.
     */
    private _commitGroupMove(
        sourceTabGroupId: string,
        insertionIndex: number
    ): void {
        this._clearGroupDragClasses(sourceTabGroupId);
        const firstPositions = this.snapshotTabPositions();
        this.resetTabTransforms();
        this.group.model.moveTabGroup(sourceTabGroupId, insertionIndex);
        this.runFlipAnimation(firstPositions, '', false);
    }

    private _clearGroupDragClasses(sourceTabGroupId: string): void {
        const chipEntry = this._chipRenderers.get(sourceTabGroupId);
        if (chipEntry) {
            this._removeClassInstantlyBatch(
                [chipEntry.chip.element],
                'dv-tab-group-chip--dragging'
            );
        }
        this._removeClassInstantlyBatch(
            this._tabs.map((t) => t.value.element),
            'dv-tab--dragging'
        );
        // Restore underline
        const underline = this._groupUnderlines.get(sourceTabGroupId);
        if (underline) {
            underline.style.removeProperty('display');
        }
        // The subsequent moveTabGroup will re-create tabs and call
        // updateTabGroups → _updateTabGroupClasses. For collapsed groups
        // the new tabs don't have dv-tab--group-collapsed yet, which
        // would trigger the collapse animation. Skip it.
        this._skipNextCollapseAnimation = true;
    }

    private resetDragAnimation(): void {
        this._pendingCollapse = false;
        this.resetTabTransforms();

        // Clear drag-collapse classes instantly (no transition)
        if (this._animState?.sourceTabGroupId) {
            this._clearGroupDragClasses(this._animState.sourceTabGroupId);
        } else {
            this._removeClassInstantlyBatch(
                this._tabs.map((t) => t.value.element),
                'dv-tab--dragging'
            );
        }

        this._animState = null;

        // Restore any hidden underlines from group drags
        for (const [, el] of this._groupUnderlines) {
            el.style.removeProperty('display');
        }
    }

    private runFlipAnimation(
        firstPositions: Map<string, DOMRect>,
        sourceTabId: string,
        isCrossGroup: boolean = false,
        animRange?: { from: number; to: number }
    ): void {
        const isVertical = this._direction === 'vertical';
        let hasAnimation = false;

        for (let i = 0; i < this._tabs.length; i++) {
            const tab = this._tabs[i];
            const panelId = tab.value.panel.id;

            if (panelId === sourceTabId) {
                if (isCrossGroup) {
                    // Newly inserted tab: slide in from the end
                    const rect = tab.value.element.getBoundingClientRect();
                    tab.value.element.style.transform = isVertical
                        ? `translateY(${rect.height}px)`
                        : `translateX(${rect.width}px)`;
                    toggleClass(tab.value.element, 'dv-tab--shifting', true);
                    hasAnimation = true;
                }
                continue;
            }

            // Skip tabs outside the affected range (they don't logically move)
            if (
                animRange !== undefined &&
                (i < animRange.from || i > animRange.to)
            ) {
                continue;
            }

            const firstRect = firstPositions.get(panelId);
            if (!firstRect) {
                continue;
            }

            const lastRect = tab.value.element.getBoundingClientRect();
            const delta = isVertical
                ? firstRect.top - lastRect.top
                : firstRect.left - lastRect.left;

            if (Math.abs(delta) < 1) {
                continue;
            }

            tab.value.element.style.transform = isVertical
                ? `translateY(${delta}px)`
                : `translateX(${delta}px)`;
            toggleClass(tab.value.element, 'dv-tab--shifting', true);
            hasAnimation = true;
        }

        if (!hasAnimation) {
            return;
        }

        requestAnimationFrame(() => {
            for (const tab of this._tabs) {
                if (tab.value.element.style.transform) {
                    tab.value.element.style.transform = '';
                }
            }

            // Track underlines during the FLIP transition so they
            // follow tabs as they slide to their final positions.
            this._trackUnderlines();

            const onTransitionEnd = (event: TransitionEvent) => {
                if (event.propertyName === 'transform') {
                    this._tabsList.removeEventListener(
                        'transitionend',
                        onTransitionEnd
                    );
                    for (const tab of this._tabs) {
                        toggleClass(
                            tab.value.element,
                            'dv-tab--shifting',
                            false
                        );
                    }
                    // Final reposition after animation settles
                    this._positionUnderlines();
                }
            };

            this._tabsList.addEventListener('transitionend', onTransitionEnd);
        });
    }
}
