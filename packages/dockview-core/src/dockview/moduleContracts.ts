/**
 * Service + host interfaces for the pluggable feature modules. Core references
 * only these interfaces — never a module's implementation — so each module is
 * decoupled from core and independently testable / removable. Keep this file
 * implementation-free.
 */
import { IDisposable } from '../lifecycle';
import { Event } from '../events';
import {
    DroptargetOverlayModel,
    Position,
    PositionResolver,
} from '../dnd/droptarget';
import { Box } from '../types';
import { IDragGhostSpec } from '../dnd/backend';
import { DockviewApi } from '../api/component.api';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import { ITabGroup } from './tabGroup';
import { TabGroupColorPalette } from './tabGroupAccent';
import { PopupService } from './components/popupService';
import {
    DockviewComponentOptions,
    FloatingGroupDragContext,
    SmartGuidesOptions,
} from './options';
import {
    DockviewLayoutMutationEvent,
    DockviewLayoutMutationKind,
    DockviewOrigin,
    GroupNavigationDirection,
    SerializedDockview,
} from './dockviewComponent';
import { DockviewWillDropEvent } from './dockviewGroupPanelModel';
import { EdgeGroupPosition } from './dockviewShell';
import {
    GroupDragEvent,
    TabDragEvent,
} from './components/titlebar/tabsContainer';
import {
    DockviewGroupDropLocation,
    DockviewTabGroupChangeEvent,
    DockviewTabGroupPanelChangeEvent,
    DockviewTabGroupCollapsedChangeEvent,
    DockviewWillShowOverlayLocationEvent,
} from './events';

// --- ContextMenu ---

export interface IContextMenuHost {
    readonly options: DockviewComponentOptions;
    readonly api: DockviewApi;
    readonly tabGroupColorPalette: TabGroupColorPalette;
    getPopupServiceForGroup(group: DockviewGroupPanel): PopupService;
}

export interface IContextMenuService {
    show(
        panel: IDockviewPanel,
        group: DockviewGroupPanel,
        event: MouseEvent
    ): void;
    showForChip(
        tabGroup: ITabGroup,
        group: DockviewGroupPanel,
        event: MouseEvent
    ): void;
}

// --- TabGroupChips ---

export interface ITabGroupChipsHost {
    readonly onDidAddGroup: Event<DockviewGroupPanel>;
    readonly onDidRemoveGroup: Event<DockviewGroupPanel>;

    fireDidCreateTabGroup(event: DockviewTabGroupChangeEvent): void;
    fireDidDestroyTabGroup(event: DockviewTabGroupChangeEvent): void;
    fireDidAddPanelToTabGroup(event: DockviewTabGroupPanelChangeEvent): void;
    fireDidRemovePanelFromTabGroup(
        event: DockviewTabGroupPanelChangeEvent
    ): void;
    fireDidTabGroupChange(event: DockviewTabGroupChangeEvent): void;
    fireDidTabGroupCollapsedChange(
        event: DockviewTabGroupCollapsedChangeEvent
    ): void;
}

export interface ITabGroupChipsService extends IDisposable {
    /**
     * Subscribe to the per-group tab-group events on the given group and
     * re-fire them on the host's component-level emitters. Returns a
     * disposable that detaches the subscriptions; intended to be bundled
     * into the per-group CompositeDisposable so cleanup happens when the
     * group is removed.
     */
    attachToGroup(group: DockviewGroupPanel): IDisposable;
}

// --- Accessibility ---

export interface IAccessibilityHost {
    /**
     * The outermost dockview element (the shell, which also contains edge
     * groups). A getter — it must resolve to the shell once that exists, not
     * the inner gridview, or keydowns from edge groups are missed.
     */
    readonly rootElement: HTMLElement;
    readonly options: DockviewComponentOptions;
    readonly groups: DockviewGroupPanel[];
    readonly activeGroup: DockviewGroupPanel | undefined;
    readonly activePanel: IDockviewPanel | undefined;
    /**
     * Live popout `Window` handles + a signal when that set changes. Keyboard
     * services attach their document listeners to each popout document too, so
     * the keys work *inside* a popped-out window (a separate `document`).
     */
    getPopoutWindows(): Window[];
    readonly onDidChangePopouts: Event<void>;
    /**
     * Does this dock own `node`, in *any* of its windows? True when the node is
     * inside the main shell, or inside one of this component's popout documents.
     * Replaces a single-document `rootElement.contains` so keyboard handling and
     * focus gating recognise events/elements that live in a popout window.
     */
    ownsElement(node: Node): boolean;
    /**
     * The next / previous group in gridview (spatial) order, wrapping round —
     * the one piece of navigation that needs the grid internals. All other
     * focus logic lives in the service, using the public group API.
     */
    adjacentGroup(
        group: DockviewGroupPanel,
        reverse: boolean
    ): DockviewGroupPanel | undefined;
    /** The nearest grid group in a spatial direction — drives Alt+Arrow nav. */
    adjacentGroupInDirection(
        group: DockviewGroupPanel,
        direction: GroupNavigationDirection
    ): DockviewGroupPanel | undefined;
    /** Fires before / after a structural layout change — used to restore focus on close. */
    readonly onWillMutateLayout: Event<DockviewLayoutMutationEvent>;
    readonly onDidMutateLayout: Event<DockviewLayoutMutationEvent>;
    showDropPreview(group: DockviewGroupPanel, position: Position): IDisposable;
    announce(message: string): void;
    dockPanel(
        panel: IDockviewPanel,
        group: DockviewGroupPanel,
        position: Position
    ): void;
    /** Float the panel into a new floating group — the keyboard-move "float" terminal action. */
    floatPanel(panel: IDockviewPanel): void;
}

export interface IAccessibilityService extends IDisposable {}

/**
 * Marker for the advanced keyboard docking service (spatial group focus +
 * keyboard move mode). Self-driven; the component never calls into it.
 */
export interface IKeyboardDockingService extends IDisposable {}

// --- AdvancedDnD ---

export interface IAdvancedDnDHost {
    readonly options: DockviewComponentOptions;
    readonly api: DockviewApi;
    fireWillDragPanel(event: TabDragEvent): void;
    fireWillDragGroup(event: GroupDragEvent): void;
    fireWillDrop(event: DockviewWillDropEvent): void;
    fireWillShowOverlay(event: DockviewWillShowOverlayLocationEvent): void;
}

export interface IAdvancedDnDService extends IDisposable {
    dispatchWillDragPanel(event: TabDragEvent): void;
    dispatchWillDragGroup(event: GroupDragEvent): void;
    dispatchWillDrop(event: DockviewWillDropEvent): void;
    dispatchWillShowOverlay(event: DockviewWillShowOverlayLocationEvent): void;
    /**
     * Resolve the custom group drag ghost from
     * `createGroupDragGhostComponent`, or `undefined` when no factory is
     * configured (the caller then renders the default chip). Returning
     * `undefined` is also what happens when this module is absent.
     */
    buildGroupDragGhost(group: DockviewGroupPanel): IDragGhostSpec | undefined;
    /**
     * Resolve the app-supplied overlay model for a group drop target via the
     * `dropOverlayModel` option, or `undefined` to keep the target's default.
     */
    resolveOverlayModel(
        location: DockviewGroupDropLocation,
        group?: DockviewGroupPanel
    ): DroptargetOverlayModel | undefined;
    /**
     * Render the drop-preview overlay on a group at `position` — the same
     * overlay a mouse drag shows — without a live drag. Returns a disposable
     * that clears it. Used by keyboard docking so keyboard and mouse previews
     * are identical (single source of truth). Commit the move via the public
     * `api.moveGroupOrPanel({ to: { group, position } })`.
     */
    showPreviewOverlay(
        group: DockviewGroupPanel,
        position: Position
    ): IDisposable;
}

// --- LayoutHistory ---

/**
 * The narrow surface the layout-history service needs from the host
 * (`DockviewComponent`). It reads/writes whole-layout snapshots and listens to
 * the mutation-transaction boundary — the only place a *pre-image* can be taken
 * before a mutation runs.
 */
export interface ILayoutHistoryHost {
    readonly options: DockviewComponentOptions;
    toJSON(): SerializedDockview;
    fromJSON(
        data: SerializedDockview,
        options?: { reuseExistingPanels: boolean }
    ): void;
    /** Fires before a structural mutation — used to capture the pre-image. */
    readonly onWillMutateLayout: Event<DockviewLayoutMutationEvent>;
    /** Fires after a structural mutation — used to capture the post-image. */
    readonly onDidMutateLayout: Event<DockviewLayoutMutationEvent>;
    /** Coalesced (microtask-buffered) ping after any layout change — the only
     *  signal for sash resize, which does not go through the mutation boundary. */
    readonly onDidLayoutChange: Event<void>;
    /** Settles once any in-flight popout-window restoration (from `fromJSON`)
     *  completes. Popouts re-open asynchronously, so undo/redo holds its guard
     *  until this resolves. Already-resolved when nothing is restoring. */
    readonly popoutRestorationPromise: Promise<void>;
}

/** Entry labels — the mutation kinds plus the synthetic `'resize'` (sash drag,
 *  which has no mutation-boundary kind of its own). */
export type LayoutHistoryKind = DockviewLayoutMutationKind | 'resize';

export interface LayoutHistoryChangeEvent {
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly undoCount: number;
    readonly redoCount: number;
    readonly lastEntry?: {
        kind: LayoutHistoryKind;
        origin: DockviewOrigin;
    };
}

export interface ILayoutHistoryService extends IDisposable {
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly onDidChangeHistory: Event<LayoutHistoryChangeEvent>;
    undo(): void;
    redo(): void;
    /** Drop both stacks (e.g. on document switch). */
    clear(): void;
}

// --- DropGuide ---

/**
 * The narrow surface the Drop Guide ("compass") service needs from the host
 * (`DockviewComponent`). The service owns the compass widget + the cell
 * hit-test resolver; the component installs that resolver at the drop-target
 * seam (`dropPositionResolver`) and surfaces the drag-over signal the widget
 * follows. It never re-implements drop resolution or the commit path.
 */
export interface IDropGuideHost {
    readonly options: DockviewComponentOptions;
    /**
     * Fires on each drag-over with the hovered group + native event — the
     * signal the compass widget mounts/follows. The service filters for
     * `kind === 'content'`.
     */
    readonly onWillShowOverlay: Event<DockviewWillShowOverlayLocationEvent>;
    /**
     * Whether a drop at `position` on `group`'s content is actually allowed
     * (the per-position `canDisplayOverlay` veto) — used to gate which compass
     * cells are shown, so only legal drops appear.
     */
    canDropOnGroup(
        group: DockviewGroupPanel,
        position: Position,
        event: DragEvent | PointerEvent
    ): boolean;
    /**
     * The element the content drop target measures its quadrants against (the
     * `dndPanelOverlay` outline — the whole group, or just its content). The
     * compass paints its cells in this frame so they line up with where a drop
     * actually resolves, not a different box.
     */
    getDropOverlayElement(group: DockviewGroupPanel): HTMLElement | undefined;
    /** The layout root element — the (positioned) surface the outer-cell
     *  landing preview is drawn over (where a whole-layout-edge dock lands). */
    getLayoutElement(): HTMLElement;
}

export interface IDropGuideService extends IDisposable {
    /**
     * The cell hit-test resolver, installed by the host at the drop-target seam
     * in place of the default cursor-quadrant logic — or `undefined` when the
     * compass is disabled (`dndGuide` unset), so the default behaviour runs.
     */
    readonly resolver: PositionResolver | undefined;
}

// --- SmartGuides ---

/**
 * The narrow surface the Smart Guides service needs from the host
 * (`DockviewComponent`). The service owns candidate generation, snap resolution
 * and the guide overlay; it only reads the floating container (for guide
 * geometry) and the drag-end signal from the host, never mutating layout. The
 * per-frame snap itself is driven by the component composing the service into
 * the float drag loop's `transformFloatingGroupDrag`, so it is not a host
 * member.
 */
export interface ISmartGuidesHost {
    readonly options: DockviewComponentOptions;
    /**
     * The positioning parent for floating groups, in whose coordinate space the
     * guide overlay is drawn (container-relative, never client/viewport space).
     * This is the same element floats are placed in
     * (`_floatingOverlayHost ?? gridview.element`).
     */
    getFloatingContainer(): HTMLElement;
    /**
     * Fires with the dragged group the first time a floating group move-drag
     * actually moves — the signal to (re)build per-drag state from a clean slate.
     * Tears down any session left over from a drag that ended without a normal
     * pointerup (e.g. a redock long-press, which aborts without an end event).
     */
    readonly onDidStartFloatingGroupDrag: Event<DockviewGroupPanel>;
    /**
     * Fires with the dragged group when a floating group's move-drag ends
     * (pointerup / cancel) — the signal to tear down the guides and per-drag
     * state. A resize-end fires it too; with no active drag session that is a
     * harmless no-op.
     */
    readonly onDidEndFloatingGroupDrag: Event<DockviewGroupPanel>;
    /**
     * The live floating windows other than `exclude`, each with its group
     * identity and container-relative box — the snap-together detector needs
     * identity (which neighbour to dock into), not just geometry.
     */
    getFloatingGroupSnapshots(
        exclude: DockviewGroupPanel
    ): readonly { group: DockviewGroupPanel; box: Box }[];
    /**
     * The underlying grid's splitter (sash) rectangles, in the same
     * container-relative space, for the optional `snapTargets.splitters` source.
     * Empty when there are no sashes.
     */
    getGridSplitterRects(): Box[];
    /**
     * Commit a snap-together: dock / merge the dragged float into a target group
     * at `position`. Reuses the existing move primitive (`moveGroupOrPanel`) so
     * events + undo cover it; a no-op when `dragged === target`.
     */
    mergeFloatInto(
        dragged: DockviewGroupPanel,
        target: DockviewGroupPanel,
        position: SmartGuidesSnapPosition
    ): void;
}

/** Where a snapped-together float docks relative to its target. */
export type SmartGuidesSnapPosition =
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'center';

/** Fired when a dragged float commits an alignment snap on drop. */
export interface SmartGuidesSnapEvent {
    readonly group: DockviewGroupPanel;
    /** Which axes were snapped at release. */
    readonly axes: ('x' | 'y')[];
}

/** Fired when a dragged float commits a dock/merge on drop. */
export interface SmartGuidesSnapTogetherEvent {
    readonly dragged: DockviewGroupPanel;
    readonly target: DockviewGroupPanel;
    readonly position: SmartGuidesSnapPosition;
}

export interface ISmartGuidesService extends IDisposable {
    /**
     * Snap the proposed drag position against the other floating groups,
     * drawing an alignment guide on the snapped edge. Returns an adjusted
     * top-left, or nothing to leave the proposed position unchanged — which is
     * also the pass-through when `smartGuides` is unset / disabled.
     */
    transformFloatingGroupDrag(
        context: FloatingGroupDragContext
    ): { top: number; left: number } | void;
    /** Whether snapping is currently active (option present + enabled). */
    readonly enabled: boolean;
    /** Toggle snapping at runtime (overrides `smartGuides.enabled`). */
    setEnabled(enabled: boolean): void;
    /** Merge a partial option override in at runtime. */
    updateOptions(options: Partial<SmartGuidesOptions>): void;
    readonly onDidSnapFloat: Event<SmartGuidesSnapEvent>;
    readonly onDidSnapTogether: Event<SmartGuidesSnapTogetherEvent>;
}

// --- AutoHideEdgeGroup ---

/**
 * The narrow surface the auto-hide service needs from the host
 * (`DockviewComponent`). Collapse/expand is delegated to the existing free
 * edge-group machinery (`setEdgeGroupCollapsed` → shell) — the module owns
 * interaction + presentation, never layout/sizing.
 */
export interface IAutoHideEdgeGroupHost {
    readonly options: DockviewComponentOptions;
    /** Fires when any group is added — the service filters for `location.type === 'edge'`. */
    readonly onDidAddGroup: Event<DockviewGroupPanel>;
    readonly onDidRemoveGroup: Event<DockviewGroupPanel>;
    /** The edge group at a position, or undefined. */
    getEdgeGroupPanel(
        position: EdgeGroupPosition
    ): DockviewGroupPanel | undefined;
    /** Collapse/expand an edge group — the single mutate path (fires
     *  `onDidCollapsedChange`, no-op guarded). */
    setEdgeGroupCollapsed(group: DockviewGroupPanel, collapsed: boolean): void;
    /** The element the slide-out peek mounts on — the shell, which is also the
     *  `OverlayRenderContainer` root, so `always`-rendered content anchors in
     *  the same coordinate space as the peek. */
    readonly overlayRoot: HTMLElement;
    /** The size an edge group expands to — sizes the peek overlay. */
    getEdgeGroupExpandedSize(position: EdgeGroupPosition): number;
    /** Record the peek state so `group.api.isPeeking()` / `onDidPeekChange`
     *  reflect it (the module owns the actual overlay). */
    setEdgeGroupPeeking(group: DockviewGroupPanel, peeking: boolean): void;
    /** Reposition a single `renderer:'always'` panel's overlay over its
     *  reference container, optionally forcing it visible. The peek reparents a
     *  group's content container into the slide-out overlay; the always-rendered
     *  content is NOT reparented (its parent stays constant) — it's re-anchored
     *  over the moving container and force-shown for the duration of the peek.
     *  `clip` (viewport rect) clips the overlay to the peek's reveal window so an
     *  `always` panel emerges from the strip's inner edge instead of sliding in
     *  from the screen edge; omit it to clear any clip. */
    repositionPanelOverlay(
        panel: IDockviewPanel,
        forceVisible: boolean,
        clip?: DOMRect
    ): void;
    /** Announce a message to assistive technology via the shared live region
     *  (no-op when no live-region service / `announcements: false`). */
    announce(message: string): void;
}

export interface IAutoHideEdgeGroupService extends IDisposable {
    /** Peek (true) / close (false) the collapsed edge group at `position`. */
    peek(position: EdgeGroupPosition, peek: boolean): void;
    /** Pin (re-dock / expand) the edge group at `position`. */
    pin(position: EdgeGroupPosition): void;
    /** Auto-hide (collapse to strip) the edge group at `position`. */
    autoHide(position: EdgeGroupPosition): void;
}

// --- MultiRowTabs ---

/**
 * The narrow surface the multi-row (wrapping) tabs service needs from the host
 * (`DockviewComponent`). The wrap layout itself is CSS; the service only toggles
 * the wrap class on a group's tab list, measures the wrapped row count, and asks
 * the host to relayout so the now-taller header shrinks the content area
 * (the free header-aware content-sizing seam does the actual subtraction). It
 * owns no tab model, overflow detection, or panel sizing math.
 */
export interface IMultiRowTabsHost {
    readonly options: DockviewComponentOptions;
    /** Fires when any group is added — the service attaches a wrap controller. */
    readonly onDidAddGroup: Event<DockviewGroupPanel>;
    readonly onDidRemoveGroup: Event<DockviewGroupPanel>;
    /** Fires after `updateOptions` — the service re-applies wrap to every group
     *  so a runtime `overflow.mode` change takes effect. */
    readonly onDidOptionsChange: Event<void>;
    /**
     * The scrollable tab list element (`.dv-tabs-container`) for a group — the
     * element the wrap class is toggled on and whose child tab geometry the
     * row-count measurement reads. Undefined if the group has no tab header.
     */
    getTabsListElement(group: DockviewGroupPanel): HTMLElement | undefined;
    /**
     * Re-run a group's layout with its current dimensions so a header-height
     * change (a new wrapped row) propagates to the content + active panel. Wraps
     * the free `DockviewGroupPanel.relayout()`.
     */
    relayoutGroup(group: DockviewGroupPanel): void;
}

export interface IMultiRowTabsService extends IDisposable {
    /** Whether wrap mode is currently active (`overflow.mode === 'wrap'`). */
    readonly enabled: boolean;
}
