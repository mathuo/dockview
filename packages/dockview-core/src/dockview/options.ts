import { DockviewApi } from '../api/component.api';
import { Direction } from '../gridview/baseComponentGridview';
import { IGridView } from '../gridview/gridview';
import { IContentRenderer, ITabRenderer, IWatermarkRenderer } from './types';
import { Parameters } from '../panel/types';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { DockviewMessages } from './accessibilityMessages';
export type { DockviewMessages } from './accessibilityMessages';
import { PanelTransfer } from '../dnd/dataTransfer';
import { IDisposable } from '../lifecycle';
import { Box } from '../types';
import {
    DroptargetOverlayModel,
    Position,
    PositionResolver,
} from '../dnd/droptarget';
import { GroupOptions } from './dockviewGroupPanelModel';
import { DockviewGroupDropLocation } from './events';
import { IDockviewPanel } from './dockviewPanel';
import { DockviewPanelRenderer } from '../overlay/overlayRenderContainer';
import {
    IGroupDragGhostRenderer,
    IGroupHeaderProps,
    ITabGroupChipRenderer,
} from './framework';
import { FloatingGroupOptions } from './dockviewComponent';
import { Constraints } from '../gridview/gridviewPanel';
import { AcceptableEvent, IAcceptableEvent } from '../events';
import { DockviewTheme } from './theme';
import { ITabGroup } from './tabGroup';
import { CspNonceProvider } from '../dom';
export { CspNonceProvider };
import { DockviewTabGroupColorEntry } from './tabGroupAccent';

export interface IHeaderActionsRenderer extends IDisposable {
    readonly element: HTMLElement;
    init(params: IGroupHeaderProps): void;
}

export type BuiltInContextMenuItem =
    | 'close'
    | 'closeOthers'
    | 'closeAll'
    | 'separator';

export type BuiltInChipContextMenuItem = 'separator' | 'colorPicker' | 'rename';

export interface ContextMenuItemConfig {
    label?: string;
    /**
     * A framework component to render as the menu item.
     * The component type is opaque to core; the framework adapter renders it.
     */
    component?: unknown;
    componentProps?: object;
    /**
     * A raw DOM element to embed as-is in the context menu.
     * Use this when you want to render custom content without a framework component.
     */
    element?: HTMLElement;
    action?: () => void;
    disabled?: boolean;
}

export type ContextMenuItem = BuiltInContextMenuItem | ContextMenuItemConfig;

export interface DropOverlayModelParams {
    /** Which of a group's drop targets the overlay is for. `'edge'` is shaped by `dndEdges`, not this option. */
    location: DockviewGroupDropLocation;
    /** The group the target belongs to, where known (tab / header_space / content). */
    group?: DockviewGroupPanel;
}

/** A layout change to be announced — see the `getAnnouncement` option. */
export interface LiveRegionEvent {
    /**
     * What changed: a panel was added (`'open'`) or removed (`'close'`); a
     * group was maximized (`'maximize'`) / restored (`'restore'`); or a group
     * moved to a floating window (`'float'`), back into the grid (`'dock'`), or
     * out to a popout window (`'popout'`). `panel` is the affected panel — for
     * group events, the group's active panel.
     */
    kind:
        | 'open'
        | 'close'
        | 'maximize'
        | 'restore'
        | 'float'
        | 'dock'
        | 'popout';
    panel: IDockviewPanel;
}

/** A resolved announcement handed to a custom `announcer`. */
export interface AnnouncementEvent {
    /** The (already localised) text to announce. */
    message: string;
    /** `'assertive'` interrupts the screen reader; `'polite'` waits for a pause. */
    politeness: 'polite' | 'assertive';
}

/**
 * Key bindings for {@link DockviewComponentOptions.keyboardNavigation}. Each
 * value is a string of `+`-separated parts, modifiers first, e.g. `'ctrl+]'`,
 * `'shift+f6'`. Recognised modifiers: `ctrl`, `shift`, `alt`, `meta` (alias
 * `cmd`). The final part is the `KeyboardEvent.key` to match, case-insensitively
 * (`']'`, `'f6'`, `'arrowleft'`).
 */
export interface DockviewKeybindings {
    /** Switch to the next tab in the focused group. Default `ctrl+]`. */
    nextTab: string;
    /** Switch to the previous tab in the focused group. Default `ctrl+[`. */
    prevTab: string;
    /** Move focus to the next group. Default `f6`. */
    focusNextGroup: string;
    /** Move focus to the previous group. Default `shift+f6`. */
    focusPrevGroup: string;
    /** Move focus from panel content to the focused group's tab strip. Default `ctrl+shift+\`. */
    focusTabs: string;
}

export interface KeyboardNavigationOptions {
    /** Override individual {@link DockviewKeybindings}; unset keys keep their defaults. */
    keymap?: Partial<DockviewKeybindings>;
}

export interface GetTabContextMenuItemsParams {
    panel: IDockviewPanel;
    group: DockviewGroupPanel;
    api: DockviewApi;
    event: MouseEvent;
}

export interface GetTabGroupChipContextMenuItemsParams {
    tabGroup: ITabGroup;
    group: DockviewGroupPanel;
    api: DockviewApi;
    event: MouseEvent;
}

export interface IContextMenuItemComponentProps {
    panel: IDockviewPanel;
    group: DockviewGroupPanel;
    api: DockviewApi;
    /** Call to close the context menu */
    close: () => void;
    componentProps?: object;
}

export interface IContextMenuItemRenderer extends IDisposable {
    readonly element: HTMLElement;
    init(props: IContextMenuItemComponentProps): void;
}

export interface CreateContextMenuItemComponentOptions {
    id: string;
    component: unknown;
}

export interface ViewFactoryData {
    content: string;
    tab?: string;
}

export type DockviewHeaderPosition = 'top' | 'bottom' | 'left' | 'right';
export type DockviewHeaderDirection = 'horizontal' | 'vertical';

export type DockviewDndStrategy = 'auto' | 'pointer' | 'html5';

/**
 * Context handed to {@link DockviewOptions.transformFloatingGroupDrag} on each
 * pointer-move frame while a floating group is being dragged.
 */
export interface FloatingGroupDragContext {
    /** The floating group being dragged. */
    readonly group: DockviewGroupPanel;
    /** Proposed top-left + size this frame, in container pixels (pre-clamp). */
    readonly proposed: Box;
    /** Size of the container the floating group is dragged within. */
    readonly container: { width: number; height: number };
    /**
     * Bounds of the other floating groups (relative to the same container),
     * snapshotted at drag start.
     */
    readonly others: readonly Box[];
}

export interface DockviewOptions {
    /**
     * Disable the auto-resizing which is controlled through a `ResizeObserver`.
     * Call `.layout(width, height)` to manually resize the container.
     */
    disableAutoResizing?: boolean;
    hideBorders?: boolean;
    singleTabMode?: 'fullwidth' | 'default';
    disableFloatingGroups?: boolean;
    floatingGroupBounds?:
        | 'boundedWithinViewport'
        | {
              minimumHeightWithinViewport?: number;
              minimumWidthWithinViewport?: number;
          };
    /**
     * Adjust a floating group's position while it is being dragged. Runs on
     * each pointer-move frame with the proposed top-left (before the container
     * clamp) and returns an adjusted top-left, or nothing to leave it
     * unchanged. Use it for snapping, alignment, or custom bounds. Move only —
     * resizing a floating group is unaffected.
     *
     * `context.others` holds the bounds of the other floating groups (relative
     * to the same container), snapshotted at drag start, so the callback can
     * align the dragged group against its siblings.
     */
    transformFloatingGroupDrag?: (
        context: FloatingGroupDragContext
    ) => { top: number; left: number } | void;
    /**
     * Selects which element moves a floating group when dragged.
     *
     * - `'titlebar'` (default): a dedicated, blank drag-handle bar is rendered
     *   above the group's tab bar. Dragging it moves the floating window;
     *   shift+drag (mouse) / long-press (touch) redocks into the grid. Style
     *   it with the `--dv-floating-titlebar-*` theme variables.
     * - `'tabbar'`: the legacy behaviour — the empty space in the tab bar
     *   (the "void container") doubles as the move handle. No dedicated bar
     *   is rendered.
     */
    floatingGroupDragHandle?: 'titlebar' | 'tabbar';
    popoutUrl?: string;
    nonce?: CspNonceProvider;
    defaultRenderer?: DockviewPanelRenderer;
    defaultHeaderPosition?: DockviewHeaderPosition;
    debug?: boolean;
    // #start dnd
    dndEdges?: false | DroptargetOverlayModel;
    disableDnd?: boolean;
    /**
     * Selects which drag-and-drop implementation is active.
     *
     * - `'auto'` (default): HTML5 drag-and-drop drives mouse drags; pointer
     *   events drive touch and pen drags. Matches the historical behaviour.
     * - `'pointer'`: pointer events drive every input type. Useful in
     *   environments where HTML5 drag-and-drop is unreliable (some Linux
     *   browsers, certain Safari versions, embedded webviews). Cross-window
     *   HTML5 drag and the HTML5 native drag image are not available in this
     *   mode.
     * - `'html5'`: HTML5 drag-and-drop only — disables touch / pen drag.
     */
    dndStrategy?: DockviewDndStrategy;
    /**
     * Override how a pointer location maps to a drop {@link Position} (or `null`
     * for no drop) on the 5-way group/layout drop targets — the group content
     * and the whole-layout edges — replacing the built-in cursor-quadrant logic.
     * Tab/header reorder targets are unaffected. Unset ⇒ the default quadrant
     * behaviour, unchanged. Read live, so it can be swapped via
     * {@link DockviewApi.updateOptions}.
     */
    dropPositionResolver?: PositionResolver;
    /**
     * Show an aim-at-a-cell "compass" drop guide over a group while dragging,
     * instead of resolving the drop by which quadrant the cursor is in. Default
     * off ⇒ the cursor-quadrant behaviour, unchanged. Provided by the Drop Guide
     * module. Pass an object to restrict which inner cells appear (`zones`) or to
     * hide the outer whole-layout-edge cells (`edges: false`, default on).
     */
    dndGuide?: boolean | { zones?: Position[]; edges?: boolean };
    // #end dnd
    locked?: boolean;
    className?: string;
    /**
     * Define the behaviour of the dock when there are no panels to display. Defaults to `watermark`.
     */
    noPanelsOverlay?: 'emptyGroup' | 'watermark';
    theme?: DockviewTheme;
    disableTabsOverflowList?: boolean;
    /**
     * Select `native` to use built-in scrollbar behaviours and `custom` to use an internal implementation
     * that allows for improved scrollbar overlay UX.
     *
     * This is only applied to the tab header section. Defaults to `custom`.
     */
    scrollbars?: 'native' | 'custom';
    /**
     * Return the items to display in the tab context menu on right-click.
     *
     * Use built-in string shortcuts (`'close'`, `'closeOthers'`, `'closeAll'`, `'separator'`)
     * or provide a `ContextMenuItemConfig` object for custom items.
     *
     * If omitted, no context menu is shown.
     * Return an empty array to suppress the menu for specific cases.
     */
    getTabContextMenuItems?: (
        params: GetTabContextMenuItemsParams
    ) => ContextMenuItem[];
    /**
     * Return the items to display in the tab group chip context menu on right-click.
     *
     * Use built-in string shortcuts (`'separator'`, `'colorPicker'`, `'rename'`) or provide a
     * `ContextMenuItemConfig` object for custom items.
     * `'colorPicker'` renders a native grid of color swatches for the tab group.
     * `'rename'` renders an inline text input to rename the tab group.
     *
     * If omitted, no context menu is shown on chip right-click.
     * Return an empty array to suppress the menu for specific cases.
     */
    getTabGroupChipContextMenuItems?: (
        params: GetTabGroupChipContextMenuItemsParams
    ) => (BuiltInChipContextMenuItem | ContextMenuItemConfig)[];
    /**
     * Factory to create custom tab group chip renderers.
     * If not provided, the default chip renderer is used.
     */
    createTabGroupChipComponent?: (
        tabGroup: ITabGroup
    ) => ITabGroupChipRenderer;
    /**
     * Factory to create the custom ghost element shown while dragging a
     * group of panels (the small floating chip that follows the cursor).
     *
     * If not provided, a default ghost rendering `"Multiple Panels (N)"`
     * is used. Supplying a factory replaces the entire default ghost,
     * enabling i18n / custom visuals.
     */
    createGroupDragGhostComponent?: (
        group: DockviewGroupPanel
    ) => IGroupDragGhostRenderer;
    /**
     * Shape the drop overlay shown over a group's drop targets — the tab
     * strip (`'tab'`), the header void space (`'header_space'`) and the
     * panel content area (`'content'`). Return a {@link DroptargetOverlayModel}
     * to override that target's default overlay (size, activation threshold,
     * small-element boundaries), or `undefined` to keep the default.
     *
     * `group` is provided where known (tab / header_space). The outer-layout
     * edge overlay is shaped by `dndEdges`, not this option, so `'edge'` is
     * not dispatched here.
     */
    dropOverlayModel?: (
        params: DropOverlayModelParams
    ) => DroptargetOverlayModel | undefined;
    /**
     * Built-in screen-reader announcements of layout changes (a visually-hidden
     * `aria-live` region narrating panel open/close etc.). On by default —
     * set to `false` to disable, e.g. when the host app provides its own
     * announcement system. Honoured live via `updateOptions`.
     */
    announcements?: boolean;
    /**
     * Localise or override the built-in announcement strings (the default
     * messages are English). Return a string to use it, `null` / `''` to
     * suppress that announcement, or `undefined` to keep the default. This is
     * how non-English apps translate announcements — core ships no message
     * catalog, only the default strings + this hook.
     */
    getAnnouncement?: (event: LiveRegionEvent) => string | null | undefined;
    /**
     * Route announcements to your own screen-reader infrastructure instead of
     * the built-in `aria-live` regions (e.g. an app-wide live region). When
     * set, dockview hands you each {@link AnnouncementEvent} and writes nothing
     * to its own regions. `getAnnouncement` (localisation) still applies first.
     */
    announcer?: (event: AnnouncementEvent) => void;
    /**
     * Translate / override the strings dockview speaks to assistive technology
     * — both the LiveRegion announcements and the keyboard-docking narration.
     * Provide any subset of {@link DockviewMessages}; unset entries keep the
     * English defaults. (`getAnnouncement` still applies first, per-event, for
     * announcements.)
     */
    messages?: Partial<DockviewMessages>;
    /**
     * Operate the dock with the keyboard. `true` enables the default bindings;
     * pass an object to override individual ones via `keymap`. Off by default
     * (opt-in while the feature matures). Enables:
     *
     * - **Switch tab** within the focused group — `Ctrl`+`]` / `Ctrl`+`[`.
     * - **Move focus between groups** — `F6` / `Shift`+`F6` (sequential) or
     *   `Ctrl`+`Shift`+arrow keys (spatial: focus the group in that direction).
     * - **Dock the active panel** without a mouse — `Ctrl`+`M` arms a two-phase
     *   move (arrows cycle the target group with a live drop preview +
     *   screen-reader narration, `Enter` docks, `Escape` cancels).
     *
     * Defaults avoid `Cmd`-based and browser-reserved combinations (e.g.
     * `Cmd`+`M` is the macOS minimise-window shortcut); use {@link keymap} to
     * rebind for your platform.
     */
    keyboardNavigation?: boolean | KeyboardNavigationOptions;
    /**
     * Undo / redo for layout mutations (close / move / float / popout / add /
     * maximize / tab-group changes). Off by default — set `{ enabled: true }`
     * to record. Drive it via `api.undo()` / `api.redo()`; dockview binds no
     * keys itself (that's the host app's call, and collides with the keyboard
     * navigation keymap). Honoured live via `updateOptions`.
     */
    layoutHistory?: LayoutHistoryOptions;
    /**
     * Replace the built-in tab group color palette with a user-defined list.
     *
     * Each entry has an `id` (stored on `tabGroup.color` and serialized),
     * a `value` (any CSS color expression — hex, rgb(), `var(...)`, etc.),
     * and an optional `label` shown in the context menu picker.
     *
     * If omitted, the default 9-color palette is used. The list fully
     * replaces the defaults — there is no merge.
     */
    tabGroupColors?: DockviewTabGroupColorEntry[];
    /**
     * Controls how dockview applies tab group color accents.
     *
     * - `'palette'` (default): write `--dv-tab-group-color`, render the
     *   color picker, and apply built-in accent styling.
     * - `'off'`: opt out entirely. No `--dv-tab-group-color` is written,
     *   the color picker is suppressed, and chips/indicators render
     *   without the accent. The `tg.color` data field is preserved so
     *   custom chip renderers can still read it and roll their own visual.
     */
    tabGroupAccent?: 'palette' | 'off';
}

export interface LayoutHistoryOptions {
    /** Record mutations. Default `false` (module is registered but inert). */
    enabled?: boolean;
    /** Max undo depth (bounded ring). Default `25`. */
    depth?: number;
    /** Also record mutations originating from `DockviewApi` calls (the app's
     *  own programmatic changes). Default `false` — only user gestures. */
    undoableProgrammaticMutations?: boolean;
    /** Clear the stacks when the whole layout is replaced via `fromJSON` /
     *  `clear`. Default `true`. */
    clearOnFromJSON?: boolean;
    /** Record sash-resize as undoable steps, coalescing a continuous drag into
     *  a single entry. Default `true`. */
    recordResize?: boolean;
    /** Debounce window (ms) for coalescing a continuous resize drag into one
     *  undo entry. Default `400`. */
    coalesceMs?: number;
}

export type TabAnimation = 'smooth' | 'default';

export interface DockviewDndOverlayEvent extends IAcceptableEvent {
    /** Narrow with `instanceof DragEvent` before reading `dataTransfer`. */
    nativeEvent: DragEvent | PointerEvent;
    target: DockviewGroupDropLocation;
    position: Position;
    group?: DockviewGroupPanel;
    getData: () => PanelTransfer | undefined;
}

export class DockviewUnhandledDragOverEvent
    extends AcceptableEvent
    implements DockviewDndOverlayEvent
{
    constructor(
        readonly nativeEvent: DragEvent | PointerEvent,
        readonly target: DockviewGroupDropLocation,
        readonly position: Position,
        readonly getData: () => PanelTransfer | undefined,
        readonly group?: DockviewGroupPanel
    ) {
        super();
    }
}

export const PROPERTY_KEYS_DOCKVIEW: (keyof DockviewOptions)[] = (() => {
    /**
     * by readong the keys from an empty value object TypeScript will error
     * when we add or remove new properties to `DockviewOptions`
     */
    const properties: Record<keyof DockviewOptions, undefined> = {
        disableAutoResizing: undefined,
        hideBorders: undefined,
        singleTabMode: undefined,
        disableFloatingGroups: undefined,
        floatingGroupBounds: undefined,
        transformFloatingGroupDrag: undefined,
        floatingGroupDragHandle: undefined,
        popoutUrl: undefined,
        nonce: undefined,
        defaultRenderer: undefined,
        defaultHeaderPosition: undefined,
        debug: undefined,
        locked: undefined,
        disableDnd: undefined,
        dndStrategy: undefined,
        className: undefined,
        noPanelsOverlay: undefined,
        dndEdges: undefined,
        dropPositionResolver: undefined,
        dndGuide: undefined,
        theme: undefined,
        disableTabsOverflowList: undefined,
        scrollbars: undefined,
        getTabContextMenuItems: undefined,
        getTabGroupChipContextMenuItems: undefined,
        createTabGroupChipComponent: undefined,
        createGroupDragGhostComponent: undefined,
        dropOverlayModel: undefined,
        announcements: undefined,
        getAnnouncement: undefined,
        announcer: undefined,
        messages: undefined,
        keyboardNavigation: undefined,
        layoutHistory: undefined,
        tabGroupColors: undefined,
        tabGroupAccent: undefined,
    };

    return Object.keys(properties) as (keyof DockviewOptions)[];
})();

export interface CreateComponentOptions {
    /**
     * The unqiue identifer of the component
     */
    id: string;
    /**
     * The component name, this should determine what is rendered.
     */
    name: string;
}

export interface DockviewFrameworkOptions {
    defaultTabComponent?: string;
    createRightHeaderActionComponent?: (
        group: DockviewGroupPanel
    ) => IHeaderActionsRenderer;
    createLeftHeaderActionComponent?: (
        group: DockviewGroupPanel
    ) => IHeaderActionsRenderer;
    createPrefixHeaderActionComponent?: (
        group: DockviewGroupPanel
    ) => IHeaderActionsRenderer;
    createTabComponent?: (
        options: CreateComponentOptions
    ) => ITabRenderer | undefined;
    createComponent: (options: CreateComponentOptions) => IContentRenderer;
    createWatermarkComponent?: () => IWatermarkRenderer;
    createContextMenuItemComponent?: (
        options: CreateContextMenuItemComponentOptions
    ) => IContextMenuItemRenderer | undefined;
}

export type DockviewComponentOptions = DockviewOptions &
    DockviewFrameworkOptions;

export interface PanelOptions<P extends object = Parameters> {
    component: string;
    tabComponent?: string;
    params?: P;
    id: string;
    title?: string;
}

type RelativePanel = {
    direction?: Direction;
    referencePanel: string | IDockviewPanel;
    /**
     * The index to place the panel within a group, only applicable if the placement is within an existing group
     */
    index?: number;
};

type RelativeGroup = {
    direction?: Direction;
    referenceGroup: string | DockviewGroupPanel;
    /**
     * The index to place the panel within a group, only applicable if the placement is within an existing group
     */
    index?: number;
};

type AbsolutePosition = {
    direction: Omit<Direction, 'within'>;
};

export type AddPanelPositionOptions =
    | RelativePanel
    | RelativeGroup
    | AbsolutePosition;

export function isPanelOptionsWithPanel(
    data: AddPanelPositionOptions
): data is RelativePanel {
    if ((data as RelativePanel).referencePanel) {
        return true;
    }
    return false;
}

export function isPanelOptionsWithGroup(
    data: AddPanelPositionOptions
): data is RelativeGroup {
    if ((data as RelativeGroup).referenceGroup) {
        return true;
    }
    return false;
}

type AddPanelFloatingGroupUnion = {
    floating: Partial<FloatingGroupOptions> | true;
    position: never;
};

type AddPanelPositionUnion = {
    floating: false;
    position: AddPanelPositionOptions;
};

type AddPanelOptionsUnion = AddPanelFloatingGroupUnion | AddPanelPositionUnion;

export type AddPanelOptions<P extends object = Parameters> = {
    params?: P;
    /**
     * The unique id for the panel
     */
    id: string;
    /**
     * The title for the panel which can be accessed within both the tab and component.
     *
     * If using the default tab renderer this title will be displayed in the tab.
     */
    title?: string;
    /**
     * The id of the component renderer
     */
    component: string;
    /**
     * The id of the tab componnet renderer
     */
    tabComponent?: string;
    /**
     * The rendering mode of the panel.
     *
     * This dictates what happens to the HTML of the panel when it is hidden.
     */
    renderer?: DockviewPanelRenderer;
    /**
     * If true then add the panel without setting it as the active panel.
     *
     * Defaults to `false` which forces newly added panels to become active.
     */
    inactive?: boolean;
    initialWidth?: number;
    initialHeight?: number;
} & Partial<AddPanelOptionsUnion> &
    Partial<Constraints>;

type AddGroupOptionsWithPanel = {
    referencePanel: string | IDockviewPanel;
    direction?: Omit<Direction, 'within'>;
};

type AddGroupOptionsWithGroup = {
    referenceGroup: string | DockviewGroupPanel;
    direction?: Omit<Direction, 'within'>;
};

export type AddGroupOptions = (
    | AddGroupOptionsWithGroup
    | AddGroupOptionsWithPanel
    | AbsolutePosition
) &
    GroupOptions;

export function isGroupOptionsWithPanel(
    data: AddGroupOptions
): data is AddGroupOptionsWithPanel {
    if ((data as AddGroupOptionsWithPanel).referencePanel) {
        return true;
    }
    return false;
}

export function isGroupOptionsWithGroup(
    data: AddGroupOptions
): data is AddGroupOptionsWithGroup {
    if ((data as AddGroupOptionsWithGroup).referenceGroup) {
        return true;
    }
    return false;
}

export interface MovementOptions2 {
    group?: IGridView;
}

export interface MovementOptions extends MovementOptions2 {
    includePanel?: boolean;
    group?: DockviewGroupPanel;
}
