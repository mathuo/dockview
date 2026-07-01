import { getPanelData } from '../../../dnd/dataTransfer';
import { toggleClass } from '../../../dom';
import { CompositeDisposable, IValueDisposable } from '../../../lifecycle';
import { DockviewComponent } from '../../dockviewComponent';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import {
    DockviewHeaderDirection,
    OVERFLOW_WRAP_TABS_CLASS,
} from '../../options';
import { Tab } from '../tab/tab';
import { TabDropIndexEvent } from './tabsContainer';
import { TabGroupManager } from './tabGroups';

export interface TabAnimationState {
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

/**
 * Narrow view of {@link Tabs} required by {@link TabReorderController}. The
 * controller owns the tab drag-reorder + animation subsystem; everything it
 * needs to reach back into the owning `Tabs` instance is funnelled through
 * this interface so the boundary stays explicit.
 */
export interface ITabReorderHost {
    /** Live tab list (the `_tabs` array of the owning `Tabs`). */
    readonly tabItems: IValueDisposable<Tab>[];
    /** Panel-id → tab lookup (the `_tabMap` of the owning `Tabs`). */
    readonly tabMap: Map<string, IValueDisposable<Tab>>;
    /** The scrollable tab strip element (`.dv-tabs-container`). */
    readonly tabsList: HTMLElement;
    readonly direction: DockviewHeaderDirection;
    readonly groupPanel: DockviewGroupPanel;
    readonly component: DockviewComponent;
    readonly tabGroupManager: TabGroupManager;
    /** Fire the owning `Tabs`' drop event. */
    fireDrop(event: TabDropIndexEvent): void;
}

/**
 * Tab drag-reorder + FLIP animation subsystem extracted from `Tabs`. The DOM
 * event wiring remains in `Tabs` and delegates the reorder/animation logic to
 * this controller. All access back into `Tabs` goes through
 * {@link ITabReorderHost}.
 */
export class TabReorderController extends CompositeDisposable {
    private _animState: TabAnimationState | null = null;
    private readonly _pendingMarginCleanups = new Map<
        HTMLElement,
        () => void
    >();
    private _pendingCollapse = false;
    private _flipTransitionCleanup: (() => void) | null = null;
    private _voidContainer: HTMLElement | null = null;
    private _extendedDropZone: HTMLElement | null = null;
    private _pointerInsideTabsList = false;
    /** The tab element currently carrying a wrap-mode drop indicator, if any. */
    private _wrapIndicatorEl: HTMLElement | null = null;

    // Field-name mirrors so the extracted method bodies can stay verbatim.
    private get _tabs(): IValueDisposable<Tab>[] {
        return this.host.tabItems;
    }
    private get _tabMap(): Map<string, IValueDisposable<Tab>> {
        return this.host.tabMap;
    }
    private get _tabsList(): HTMLElement {
        return this.host.tabsList;
    }
    private get _direction(): DockviewHeaderDirection {
        return this.host.direction;
    }
    private get group(): DockviewGroupPanel {
        return this.host.groupPanel;
    }
    private get accessor(): DockviewComponent {
        return this.host.component;
    }
    private get _tabGroupManager(): TabGroupManager {
        return this.host.tabGroupManager;
    }

    /** Whether the tab strip is in multi-row wrap layout
     *  (`MultiRowTabsModule`, `overflow.mode: 'wrap'`). In wrap, the 1-D
     *  gap/FLIP animation is suppressed and reorder uses a 2-D hit-test. */
    private get _wrapMode(): boolean {
        return this._tabsList.classList.contains(OVERFLOW_WRAP_TABS_CLASS);
    }

    get animState(): TabAnimationState | null {
        return this._animState;
    }

    set animState(value: TabAnimationState | null) {
        this._animState = value;
    }

    get pendingCollapse(): boolean {
        return this._pendingCollapse;
    }

    set pendingCollapse(value: boolean) {
        this._pendingCollapse = value;
    }

    set voidContainerElement(el: HTMLElement | null) {
        this._voidContainer = el;
    }

    constructor(private readonly host: ITabReorderHost) {
        super();

        this.addDisposables({
            dispose: () => {
                this._flipTransitionCleanup?.();
            },
        });
    }

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

    snapshotTabPositions(): Map<string, DOMRect> {
        const positions = new Map<string, DOMRect>();
        for (const tab of this._tabs) {
            positions.set(
                tab.value.panel.id,
                tab.value.element.getBoundingClientRect()
            );
        }
        return positions;
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

    /**
     * Pointer-event entry point. The HTML5 path enters via the per-element
     * `dragover` listener; this one hit-tests the global pointer-drag
     * position against the tabs list and routes through the same shared
     * `processDragOver` / `processDragLeave` helpers.
     */
    handlePointerDragMove(clientX: number, clientY: number): void {
        const sourceDoc = this._tabsList.ownerDocument ?? document;
        const elAtPoint = sourceDoc.elementFromPoint(clientX, clientY);
        const inside =
            !!elAtPoint &&
            (this._tabsList.contains(elAtPoint) ||
                (!!this._extendedDropZone &&
                    this._extendedDropZone.contains(elAtPoint)));

        if (!inside) {
            if (this._pointerInsideTabsList) {
                this._pointerInsideTabsList = false;
                this.processDragLeave(elAtPoint);
            }
            return;
        }

        this._pointerInsideTabsList = true;
        this.processDragOver(clientX, clientY);
    }

    /**
     * Pointer-side cleanup hook: when any pointer drag ends, reset the
     * inside-strip flag and tear down any smooth-reorder anim state the
     * dragover bridge may have installed.
     */
    handlePointerDragEnd(e?: {
        clientX: number;
        clientY: number;
        pointerEvent: PointerEvent;
    }): void {
        // Multi-row wrap intra-group reorder — the pointer-backend analog of the
        // HTML5 tabs-list `drop` commit. In smooth wrap the per-tab pointer drop
        // target doesn't latch a drop state for the intra-group drag, so its
        // `onDrop` never fires; commit the reorder from the computed 2-D
        // insertion index when the drag ends over the strip. This can't
        // double-commit: `tab.onDrop` nulls `_animState` before this runs (the
        // backend calls `handleDrop` before `onDragEnd`), so if the per-tab path
        // *did* fire, `_animState` is already null and this is skipped. (HTML5
        // wrap drops commit via the tabs-list `drop` listener, which likewise
        // reads `currentInsertionIndex`.)
        if (
            this._wrapMode &&
            e &&
            this._animState &&
            // intra-group single-tab reorder only: `sourceIndex === -1` is a
            // cross-group drag (handled by the cross-group machinery), and
            // `sourceTabGroupId` is a group-chip drag (handled by the chip drop
            // target — which does NOT null `_animState`, so committing here too
            // would double-commit).
            this._animState.sourceIndex !== -1 &&
            !this._animState.sourceTabGroupId &&
            this._animState.currentInsertionIndex !== null &&
            this.isPointInsideTabsList(e.clientX, e.clientY)
        ) {
            this.commitWrapReorder(e.pointerEvent);
        }
        this._pointerInsideTabsList = false;
        this.resetDragAnimation();
    }

    private isPointInsideTabsList(clientX: number, clientY: number): boolean {
        const doc = this._tabsList.ownerDocument ?? document;
        const el = doc.elementFromPoint(clientX, clientY);
        return !!el && this._tabsList.contains(el);
    }

    /** Commit a wrap-mode intra-group reorder from the current 2-D insertion
     *  index (adjusted for the source's own position), then clear drag state. */
    private commitWrapReorder(event: PointerEvent): void {
        const animState = this._animState;
        if (!animState || animState.currentInsertionIndex === null) {
            return;
        }
        const insertionIndex = animState.currentInsertionIndex;
        const sourceIndex = animState.sourceIndex;
        const adjustedIndex =
            insertionIndex -
            (sourceIndex !== -1 && sourceIndex < insertionIndex ? 1 : 0);

        this._animState = null;
        this.clearWrapDropIndicator();
        this.uncollapseSourceTab(animState.sourceTabId);

        if (adjustedIndex === sourceIndex) {
            return;
        }
        this.host.fireDrop({
            event,
            index: adjustedIndex,
            targetTabGroupId: null,
        });
    }

    /**
     * Shared body of the dragover entry point. Refreshes stale anim state
     * for a changed drag identity, initializes anim state for incoming
     * cross-group drags, and dispatches to the gap-following math in
     * `handleDragOver`. Returns true when this tabs list has taken
     * ownership of the drag — HTML5 callers use this to gate
     * `event.preventDefault()`.
     */
    processDragOver(clientX: number, clientY?: number): boolean {
        if (this.accessor.options.disableDnd) {
            return false;
        }

        // Stale-state guard: if a previous drag's anim state is still here
        // but the current drag is a different identity, drop the stale one
        // so the new drag starts from a clean slate.
        if (this._animState) {
            const data = getPanelData();
            if (
                data?.tabGroupId &&
                data.groupId !== this.group.id &&
                this._animState.sourceTabGroupId !== data.tabGroupId
            ) {
                this._animState = null;
            }
        }

        if (!this._animState) {
            const data = getPanelData();
            // In default animation mode, individual tab drops are handled
            // by per-tab Droptargets; only chip drags need tabs-list-level
            // handling so drops on void space still work.
            if (
                this.accessor.options.theme?.tabAnimation === 'default' &&
                !data?.tabGroupId
            ) {
                return false;
            }
            if (
                data &&
                (data.panelId || data.tabGroupId) &&
                data.groupId !== this.group.id
            ) {
                const avgWidth = this.getAverageTabWidth();
                if (data.tabGroupId) {
                    // External group drag — look up the source group to
                    // size the gap.
                    const sourceGroup = this.accessor.getPanel(data.groupId);
                    const sourceTg = sourceGroup?.model
                        .getTabGroups()
                        .find((tg) => tg.id === data.tabGroupId);
                    const panelCount = sourceTg?.panelIds.length ?? 1;
                    const groupGapWidth = avgWidth * panelCount + avgWidth;
                    this._animState = {
                        sourceTabId: '',
                        sourceIndex: -1,
                        tabPositions: this.snapshotTabPositions(),
                        chipPositions:
                            this._tabGroupManager.snapshotChipWidths(),
                        currentInsertionIndex: null,
                        targetTabGroupId: null,
                        sourceTabGroupId: data.tabGroupId,
                        sourceGroupPanelIds: sourceTg
                            ? new Set(sourceTg.panelIds)
                            : new Set<string>(),
                        sourceChipWidth: avgWidth,
                        cursorOffsetFromDragLeft: groupGapWidth / 2,
                        sourceGapWidth: groupGapWidth,
                        containerLeft:
                            this._tabsList.getBoundingClientRect().left,
                    };
                } else {
                    this._animState = {
                        sourceTabId: data.panelId!,
                        sourceIndex: -1,
                        tabPositions: this.snapshotTabPositions(),
                        chipPositions:
                            this._tabGroupManager.snapshotChipWidths(),
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
                }
            } else {
                return false;
            }
        }

        // For intra-group drag (sourceIndex >= 0) the gap animation is the
        // sole visual indicator — clear any stale anchor overlay that may
        // have been set while the cursor was over the panel content area or
        // another zone. External drags (sourceIndex === -1) leave the
        // overlay to the individual tab Droptargets so cross-group
        // animation is not disrupted.
        if (this._animState!.sourceIndex !== -1) {
            this.group.model.dropTargetContainer?.model?.clear();
        }
        this.handleDragOver({ clientX, clientY });
        return true;
    }

    /**
     * Shared body of the dragleave entry point. Preserves anim state when
     * the drag moves between tabs-list children, into the extended drop
     * zone, or into the void container; tears it down otherwise.
     */
    processDragLeave(related: Element | null): void {
        if (!this._animState) {
            return;
        }
        // Moves between children of the tabs list aren't real leaves.
        if (related && this._tabsList.contains(related)) {
            return;
        }
        // Moving into the broader drop zone (e.g. void container, left
        // actions) — keep anim state alive so external listeners can
        // continue the gap animation.
        if (related && this._extendedDropZone?.contains(related)) {
            this.resetTabTransforms();
            this._animState.currentInsertionIndex = null;
            return;
        }
        // Leaving toward the void container (empty header space to the
        // right): keep anim state so a drop can still land at the end.
        const isVoid =
            this._voidContainer &&
            related &&
            (related === this._voidContainer ||
                this._voidContainer.contains(related));
        if (isVoid) {
            return;
        }
        this.resetTabTransforms();
        if (this._animState.sourceIndex === -1) {
            this.group.model.dropTargetContainer?.model?.clear();
            this._animState = null;
        } else {
            this._animState.currentInsertionIndex = null;
        }
    }

    handleDragOver(event: { clientX: number; clientY?: number }): void {
        if (!this._animState) {
            return;
        }

        // Multi-row wrap: the 1-D x-accumulation below assumes a single row.
        // In wrap use a 2-D hit-test (row by y, slot by x within the row) and
        // a discrete drop indicator instead of the gap animation. Group-chip
        // drags are excluded — they carry group-move semantics ("can't drop
        // inside another group") the single-tab hit-test doesn't model, and
        // chips don't wrap in v1, so they keep the 1-D path (whose gap animation
        // no-ops in wrap anyway).
        if (this._wrapMode && !this._animState.sourceTabGroupId) {
            this.handleWrappedDragOver(event.clientX, event.clientY ?? 0);
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
        if (this._tabGroupManager.chipRenderers.size > 0) {
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
                    insertionIndex ??= i;
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
                insertionIndex ??= i;
                break;
            }
        }

        // Determine which tab group (if any) the insertion index falls within.
        //
        // We use snapshot-based positions (accWidth from the accumulation loop
        // above) to compute original chip boundaries.  This avoids reading
        // getBoundingClientRect() on chips whose live position is shifted by
        // the drag gap margin, which caused oscillation / visual jumps.
        if (
            insertionIndex !== null &&
            this._tabGroupManager.chipRenderers.size > 0
        ) {
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

                if (isGroupDrag && isInsideRange) {
                    // A group cannot be dropped inside another group.
                    // Snap the insertion index to just before or just
                    // after this group based on cursor position relative
                    // to the group's midpoint. Only applies when the
                    // insertion would land *inside* the group — for
                    // `isJustBeforeGroup`, the index is already outside
                    // (immediately left of the group) and is a valid
                    // drop position, so leave it untouched (issue #1264).
                    const groupMid = (firstIdx + lastIdx + 1) / 2;
                    if (insertionIndex < groupMid) {
                        insertionIndex = firstIdx;
                    } else {
                        insertionIndex = lastIdx + 1;
                    }
                    // targetTabGroupId stays null
                    break;
                }

                if (isGroupDrag && isJustBeforeGroup) {
                    // Cursor is just before the group — accept this
                    // index as-is. Groups can be dropped at the slot
                    // immediately left of another group's first tab.
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

        if (this.accessor.options.theme?.tabAnimation === 'smooth') {
            this.applyDragOverTransforms();
        }
    }

    /**
     * Multi-row wrap drag-over: resolve the 2-D insertion slot and show a
     * discrete drop indicator. No gap/FLIP animation (that's 1-D and fights the
     * flow layout — `applyDragOverTransforms`/`runFlipAnimation` no-op in wrap).
     */
    private handleWrappedDragOver(clientX: number, clientY: number): void {
        if (!this._animState) {
            return;
        }
        const index = this.computeWrappedInsertionIndex(clientX, clientY);
        // targetTabGroupId stays null — wrap reorder is single-tab within the
        // group; group-chip drops keep the 1-D path (chips don't wrap in v1).
        if (
            index === this._animState.currentInsertionIndex &&
            this._animState.targetTabGroupId === null
        ) {
            return;
        }
        this._animState.currentInsertionIndex = index;
        this._animState.targetTabGroupId = null;
        this.updateWrapDropIndicator(index);
    }

    /**
     * The insertion slot (index into the full tab list) for a pointer at
     * `(clientX, clientY)` over a wrapped strip: pick the row whose vertical
     * span contains `clientY` (clamped to first/last), then the slot within that
     * row by x-midpoint. Excludes the drag source so its own position doesn't
     * bias the result; the drop path adjusts for the source offset.
     */
    private computeWrappedInsertionIndex(
        clientX: number,
        clientY: number
    ): number {
        const sourceId = this._animState?.sourceTabId;
        const sourceGroupIds = this._animState?.sourceGroupPanelIds;

        const entries: { index: number; rect: DOMRect }[] = [];
        for (let i = 0; i < this._tabs.length; i++) {
            const tab = this._tabs[i].value;
            if (tab.panel.id === sourceId) {
                continue;
            }
            if (sourceGroupIds?.has(tab.panel.id)) {
                continue;
            }
            entries.push({
                index: i,
                rect: tab.element.getBoundingClientRect(),
            });
        }
        if (entries.length === 0) {
            return this._tabs.length;
        }

        // Bucket into rows by top edge (2px tolerance for sub-pixel rounding).
        const rows: { top: number; bottom: number; items: typeof entries }[] =
            [];
        for (const entry of entries) {
            const row = rows.find((r) => Math.abs(r.top - entry.rect.top) <= 2);
            if (row) {
                row.items.push(entry);
                row.bottom = Math.max(row.bottom, entry.rect.bottom);
            } else {
                rows.push({
                    top: entry.rect.top,
                    bottom: entry.rect.bottom,
                    items: [entry],
                });
            }
        }
        rows.sort((a, b) => a.top - b.top);

        // Pick the row whose vertical span contains clientY; if the pointer is
        // in an inter-row gap (or above/below all rows), pick the nearest row by
        // vertical distance — NOT a blanket clamp to the last row, which would
        // misroute a between-rows hover to the bottom row.
        let row = rows.find((r) => clientY >= r.top && clientY <= r.bottom);
        if (!row) {
            const distance = (r: (typeof rows)[number]) =>
                clientY < r.top ? r.top - clientY : clientY - r.bottom;
            row = rows.reduce((nearest, r) =>
                distance(r) < distance(nearest) ? r : nearest
            );
        }

        // Within the row, insert before the first tab whose horizontal midpoint
        // is past the pointer; past all of them → after the row's last tab.
        const items = row.items.sort((a, b) => a.rect.left - b.rect.left);
        for (const item of items) {
            const midpoint = item.rect.left + item.rect.width / 2;
            if (clientX < midpoint) {
                return item.index;
            }
        }
        return items[items.length - 1].index + 1;
    }

    private updateWrapDropIndicator(index: number): void {
        this.clearWrapDropIndicator();
        const count = this._tabs.length;
        if (count === 0) {
            return;
        }
        if (index < count) {
            const el = this._tabs[index].value.element;
            el.classList.add('dv-tab--reorder-before');
            this._wrapIndicatorEl = el;
        } else {
            const el = this._tabs[count - 1].value.element;
            el.classList.add('dv-tab--reorder-after');
            this._wrapIndicatorEl = el;
        }
    }

    private clearWrapDropIndicator(): void {
        this._wrapIndicatorEl?.classList.remove(
            'dv-tab--reorder-before',
            'dv-tab--reorder-after'
        );
        this._wrapIndicatorEl = null;
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
            void affected[0].offsetHeight; // single reflow for entire batch
            for (const el of affected) {
                el.style.removeProperty('transition');
            }
        }
    }

    /**
     * Remove `dv-tab--dragging` from the source tab instantly so it
     * regains its real width before FLIP snapshots.
     */
    uncollapseSourceTab(sourceTabId: string): void {
        const entry = this._tabMap.get(sourceTabId);
        if (entry) {
            this._removeClassInstantlyBatch(
                [entry.value.element],
                'dv-tab--dragging'
            );
        }
    }

    applyDragOverTransforms(skipTransition = false): void {
        // The gap animation is 1-D (single-row margin shifting) and fights the
        // wrap flow layout — wrap uses a discrete drop indicator instead.
        if (this._wrapMode) {
            return;
        }
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
        if (this._tabGroupManager.chipRenderers.size > 0) {
            const tabGroups = this.group.model.getTabGroups();
            for (const tg of tabGroups) {
                if (tg.id === this._animState.sourceTabGroupId) continue;
                // Skip the group that the dragged tab belongs to — the
                // gap should appear after the chip (where the tab was),
                // not before it.
                if (tg.panelIds.includes(this._animState.sourceTabId)) continue;
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
                        const chipEntry =
                            this._tabGroupManager.chipRenderers.get(tg.id);
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
                void el.offsetHeight;
                el.style.removeProperty('transition');
            } else {
                el.style.marginLeft = value;
            }
            toggleClass(el, shiftingClass(el), true);
        };

        const clearMargin = (el: HTMLElement) => {
            const cls = shiftingClass(el);

            // Remove any previous pending listener for this element
            const prev = this._pendingMarginCleanups.get(el);
            if (prev) {
                prev();
            }

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
                    clearTimeout(fallbackTimer);
                    this._pendingMarginCleanups.delete(el);
                };
                // Fallback in case transitionend never fires
                // (e.g. element removed from DOM mid-transition)
                const fallbackTimer = setTimeout(onEnd, 300);
                this._pendingMarginCleanups.set(el, onEnd);
                el.addEventListener('transitionend', onEnd);
            }
        };

        let gapApplied = false;

        // Reset all non-source chip margins first
        for (const [groupId, entry] of this._tabGroupManager.chipRenderers) {
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
        this._tabGroupManager.trackUnderlines();
    }

    resetTabTransforms(): void {
        this.clearWrapDropIndicator();

        // Cancel any pending margin transitionend listeners
        for (const [, cleanup] of this._pendingMarginCleanups) {
            cleanup();
        }
        this._pendingMarginCleanups.clear();

        for (const tab of this._tabs) {
            tab.value.element.style.removeProperty('margin-left');
            tab.value.element.style.removeProperty('margin-right');
            tab.value.element.style.removeProperty('margin-top');
            tab.value.element.style.removeProperty('margin-bottom');
            tab.value.element.style.removeProperty('transform');
            toggleClass(tab.value.element, 'dv-tab--shifting', false);
        }
        for (const [, entry] of this._tabGroupManager.chipRenderers) {
            entry.chip.element.style.removeProperty('margin-left');
            toggleClass(
                entry.chip.element,
                'dv-tab-group-chip--shifting',
                false
            );
        }
        this._tabGroupManager.positionUnderlines();
    }

    /**
     * Commit a group-drag drop: clear drag classes, move the group
     * in the model, and run a FLIP animation.
     */
    commitGroupMove(sourceTabGroupId: string, insertionIndex: number): void {
        // Read transfer data first.
        const data = getPanelData();

        // Synchronously dispose the source chip's drag sources, which
        // clears the panelTransfer payload + iframe shield. Cross-group
        // moves dissolve the source chip on a microtask, which is too
        // late: a synchronous `getPanelData()` after this method (or any
        // sibling dragover handler firing in the same tick) would
        // otherwise see stale data still referencing the old tabGroupId.
        this._tabGroupManager.disposeChipDrag(sourceTabGroupId);

        // Check if the tab group exists in this group (within-group reorder)
        // or in another group (cross-group move).
        const isLocal = this.group.model
            .getTabGroups()
            .some((tg) => tg.id === sourceTabGroupId);

        if (isLocal) {
            if (this.accessor.options.theme?.tabAnimation === 'smooth') {
                this._clearGroupDragClasses(sourceTabGroupId);
                const firstPositions = this.snapshotTabPositions();
                this.resetTabTransforms();
                this.group.model.moveTabGroup(sourceTabGroupId, insertionIndex);
                this.runFlipAnimation(firstPositions, '', false);
            } else {
                this._tabGroupManager.skipNextCollapseAnimation = true;
                this.group.model.moveTabGroup(sourceTabGroupId, insertionIndex);
            }
        } else if (data) {
            // Cross-group: delegate to the component-level move which
            // handles panel transfer and tab group recreation.
            // Use the REAL tab group ID from transfer data, not the
            // potentially stale one from _animState.
            //
            // Clear any inline gap margin / shifting class applied to
            // destination tabs during dragover. Cross-group moves don't
            // run the FLIP path, and `moveGroupOrPanel` only inserts new
            // panels — it doesn't recreate existing destination tabs, so
            // their inline `margin-left` would otherwise persist as a
            // visible gap (issue #1243).
            this.resetTabTransforms();
            this.accessor.moveGroupOrPanel({
                from: {
                    groupId: data.groupId,
                    tabGroupId: data.tabGroupId ?? sourceTabGroupId,
                },
                to: {
                    group: this.group,
                    position: 'center',
                    index: insertionIndex,
                },
            });
        }
    }

    private _clearGroupDragClasses(sourceTabGroupId: string): void {
        const chipEntry =
            this._tabGroupManager.chipRenderers.get(sourceTabGroupId);
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
        const underline =
            this._tabGroupManager.groupUnderlines.get(sourceTabGroupId);
        if (underline) {
            underline.style.removeProperty('display');
        }
        // The subsequent moveTabGroup will re-create tabs and call
        // updateTabGroups → _updateTabGroupClasses. For collapsed groups
        // the new tabs don't have dv-tab--group-collapsed yet, which
        // would trigger the collapse animation. Skip it.
        this._tabGroupManager.skipNextCollapseAnimation = true;
    }

    resetDragAnimation(): void {
        this._pendingCollapse = false;

        // After a drop, `tab.onDrop` consumes _animState (sets it to null)
        // and immediately calls `runFlipAnimation`, which sets transforms
        // and queues an rAF to trigger the CSS transition. dragend fires
        // synchronously on the source element BEFORE that rAF runs — if
        // we cleared transforms here we'd clobber the in-flight FLIP, so
        // gate the cleanup on _animState still being set (i.e. drag was
        // cancelled rather than dropped).
        if (this._animState) {
            this.resetTabTransforms();
            if (this._animState.sourceTabGroupId) {
                this._clearGroupDragClasses(this._animState.sourceTabGroupId);
            } else {
                this._removeClassInstantlyBatch(
                    this._tabs.map((t) => t.value.element),
                    'dv-tab--dragging'
                );
            }
            this._animState = null;
            // Restore any hidden underlines from group drags.
            for (const [, el] of this._tabGroupManager.groupUnderlines) {
                el.style.removeProperty('display');
            }
        }
    }

    runFlipAnimation(
        firstPositions: Map<string, DOMRect>,
        sourceTabId: string,
        isCrossGroup: boolean = false,
        animRange?: { from: number; to: number }
    ): void {
        // The FLIP is a 1-D (single-axis) slide; across wrapped rows it would
        // animate wrong deltas, so wrap does a discrete reorder (no FLIP).
        if (this._wrapMode) {
            return;
        }

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
            this._tabGroupManager.trackUnderlines();

            // Clean up any previous flip transition listener
            this._flipTransitionCleanup?.();

            const onTransitionEnd = (event: TransitionEvent) => {
                if (event.propertyName === 'transform') {
                    cleanup();
                    for (const tab of this._tabs) {
                        toggleClass(
                            tab.value.element,
                            'dv-tab--shifting',
                            false
                        );
                    }
                    // Final reposition after animation settles
                    this._tabGroupManager.positionUnderlines();
                }
            };

            const cleanup = () => {
                this._tabsList.removeEventListener(
                    'transitionend',
                    onTransitionEnd
                );
                this._flipTransitionCleanup = null;
            };

            this._flipTransitionCleanup = cleanup;
            this._tabsList.addEventListener('transitionend', onTransitionEnd);
        });
    }
}
