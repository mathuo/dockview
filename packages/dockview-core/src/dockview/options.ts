import { DockviewApi } from '../api/component.api';
import { Direction } from '../gridview/baseComponentGridview';
import { IGridView } from '../gridview/gridview';
import { IContentRenderer, ITabRenderer, IWatermarkRenderer } from './types';
import { Parameters } from '../panel/types';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { PanelTransfer } from '../dnd/dataTransfer';
import { IDisposable } from '../lifecycle';
import { DroptargetOverlayModel, Position } from '../dnd/droptarget';
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
import { Contraints } from '../gridview/gridviewPanel';
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
    /**
     * @deprecated use `dndEdges` instead. To be removed in a future version.
     * */
    rootOverlayModel?: DroptargetOverlayModel;
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
        floatingGroupDragHandle: undefined,
        popoutUrl: undefined,
        nonce: undefined,
        defaultRenderer: undefined,
        defaultHeaderPosition: undefined,
        debug: undefined,
        rootOverlayModel: undefined,
        locked: undefined,
        disableDnd: undefined,
        dndStrategy: undefined,
        className: undefined,
        noPanelsOverlay: undefined,
        dndEdges: undefined,
        theme: undefined,
        disableTabsOverflowList: undefined,
        scrollbars: undefined,
        getTabContextMenuItems: undefined,
        getTabGroupChipContextMenuItems: undefined,
        createTabGroupChipComponent: undefined,
        createGroupDragGhostComponent: undefined,
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
    Partial<Contraints>;

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
