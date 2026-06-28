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
import { IDragGhostSpec } from '../dnd/backend';
import { DockviewApi } from '../api/component.api';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import { ITabGroup } from './tabGroup';
import { TabGroupColorPalette } from './tabGroupAccent';
import { PopupService } from './components/popupService';
import { DockviewComponentOptions } from './options';
import {
    DockviewLayoutMutationEvent,
    DockviewLayoutMutationKind,
    DockviewOrigin,
    GroupNavigationDirection,
    SerializedDockview,
} from './dockviewComponent';
import { DockviewWillDropEvent } from './dockviewGroupPanelModel';
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
    /** The layout root element — the surface the outer-cell edge preview is
     *  drawn over (its coordinate space). */
    getLayoutElement(): HTMLElement;
    /**
     * The element the content drop target measures its quadrants against (the
     * `dndPanelOverlay` outline — the whole group, or just its content). The
     * compass paints its cells in this frame so they line up with where a drop
     * actually resolves, not a different box.
     */
    getDropOverlayElement(group: DockviewGroupPanel): HTMLElement | undefined;
}

export interface IDropGuideService extends IDisposable {
    /**
     * The cell hit-test resolver, installed by the host at the drop-target seam
     * in place of the default cursor-quadrant logic — or `undefined` when the
     * compass is disabled (`dndGuide` unset), so the default behaviour runs.
     */
    readonly resolver: PositionResolver | undefined;
}
