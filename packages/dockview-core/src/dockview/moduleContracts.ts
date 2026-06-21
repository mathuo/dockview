/**
 * Service + host interfaces for the pluggable feature modules. Core references
 * only these interfaces — never a module's implementation — so each module is
 * decoupled from core and independently testable / removable. Keep this file
 * implementation-free.
 */
import { IDisposable } from '../lifecycle';
import { Event } from '../events';
import { DroptargetOverlayModel, Position } from '../dnd/droptarget';
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
    GroupNavigationDirection,
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
