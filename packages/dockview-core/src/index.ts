export {
    getPaneData,
    getPanelData,
    PaneTransfer,
    PanelTransfer,
} from './dnd/dataTransfer';

/**
 * Events, Emitters and Disposables are very common concepts that many codebases will contain, however we need
 * to export them for dockview framework packages to use.
 * To be a good citizen these are exported with a `Dockview` prefix to prevent accidental use by others.
 */
export { Emitter as DockviewEmitter, Event as DockviewEvent } from './events';
export {
    IDisposable as DockviewIDisposable,
    MutableDisposable as DockviewMutableDisposable,
    CompositeDisposable as DockviewCompositeDisposable,
    Disposable as DockviewDisposable,
} from './lifecycle';

export * from './panel/types';

export * from './splitview/splitview';
export {
    SplitviewComponentOptions,
    PanelViewInitParameters,
    SplitviewOptions,
    SplitviewFrameworkOptions,
    PROPERTY_KEYS_SPLITVIEW,
} from './splitview/options';

export * from './paneview/paneview';
export * from './gridview/gridview';
export {
    GridviewComponentOptions,
    GridviewOptions,
    GridviewFrameworkOptions,
    PROPERTY_KEYS_GRIDVIEW,
} from './gridview/options';
export * from './gridview/baseComponentGridview';

export {
    DraggablePaneviewPanel,
    PaneviewDidDropEvent,
} from './paneview/draggablePaneviewPanel';

export * from './dockview/components/panel/content';
export * from './dockview/components/tab/tab';
export {
    DockviewGroupPanelModel,
    DockviewDidDropEvent,
    DockviewWillDropEvent,
    DockviewGroupChangeEvent,
    DockviewGroupActivePanelChangeEvent,
    DockviewGroupLocation,
} from './dockview/dockviewGroupPanelModel';
export {
    DockviewWillShowOverlayLocationEvent,
    DockviewTabGroupChangeEvent,
    DockviewTabGroupCollapsedChangeEvent,
    DockviewTabGroupPanelChangeEvent,
    DockviewGroupDropLocation,
} from './dockview/events';
export {
    TabDragEvent,
    GroupDragEvent,
} from './dockview/components/titlebar/tabsContainer';
export * from './dockview/types';
export * from './dockview/dockviewGroupPanel';
export {
    IGroupPanelBaseProps,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    IDockviewHeaderActionsProps,
    IGroupHeaderProps,
    IWatermarkPanelProps,
    DockviewReadyEvent,
    ITabGroupChipRenderer,
    IGroupDragGhostRenderer,
} from './dockview/framework';

export * from './dockview/options';
export * from './dockview/theme';
export * from './dockview/dockviewPanel';
export {
    DockviewTabGroupColor,
    ITabGroup,
    SerializedTabGroup,
    TabGroupOptions,
} from './dockview/tabGroup';
export {
    DEFAULT_TAB_GROUP_COLORS,
    DockviewTabGroupColorEntry,
    TabGroupColorPalette,
    applyTabGroupAccent,
    resolveTabGroupAccent,
} from './dockview/tabGroupAccent';
export { DefaultTab } from './dockview/components/tab/defaultTab';
export {
    DefaultDockviewDeserialzier,
    IPanelDeserializer,
} from './dockview/deserializer';

export * from './dockview/dockviewComponent';
export {
    EdgeGroupOptions,
    EdgeGroupPosition,
    SerializedEdgeGroups,
} from './dockview/dockviewShell';
export * from './gridview/gridviewComponent';
export * from './splitview/splitviewComponent';
export * from './paneview/paneviewComponent';
export {
    PaneviewComponentOptions,
    PaneviewOptions,
    PaneviewFrameworkOptions,
    PROPERTY_KEYS_PANEVIEW,
    PaneviewUnhandledDragOverEvent,
    PaneviewDndOverlayEvent,
} from './paneview/options';

export * from './gridview/gridviewPanel';
export { SplitviewPanel, ISplitviewPanel } from './splitview/splitviewPanel';
export * from './paneview/paneviewPanel';
export * from './dockview/types';
export { Box, AnchorPosition, AnchoredBox, DragModifiers } from './types';

export { DockviewPanelRenderer } from './overlay/overlayRenderContainer';

export {
    Position,
    positionToDirection,
    directionToPosition,
    MeasuredValue,
    DroptargetOverlayModel,
    PositionResolver,
    PositionResolverArgs,
    PositionResolverResult,
} from './dnd/droptarget';

export {
    FocusEvent,
    PanelDimensionChangeEvent,
    VisibilityEvent,
    ActiveEvent,
    PanelApi,
} from './api/panelApi';
export {
    SizeEvent,
    GridviewPanelApi,
    GridConstraintChangeEvent,
} from './api/gridviewPanelApi';
export {
    TitleEvent,
    PinnedChangeEvent,
    RendererChangedEvent,
    DockviewPanelApi,
    DockviewPanelMoveParams,
} from './api/dockviewPanelApi';
export {
    PanelSizeEvent,
    PanelConstraintChangeEvent,
    SplitviewPanelApi,
} from './api/splitviewPanelApi';
export { ExpansionEvent, PaneviewPanelApi } from './api/paneviewPanelApi';
export {
    DockviewGroupPanelApi,
    DockviewGroupPanelLocationChangeEvent,
    DockviewGroupPanelCollapsedChangeEvent,
    DockviewGroupPanelPeekChangeEvent,
    DockviewGroupMoveParams,
} from './api/dockviewGroupPanelApi';
export {
    CommonApi,
    SplitviewApi,
    PaneviewApi,
    GridviewApi,
    DockviewApi,
    DockviewGetTabGroupsOptions,
} from './api/component.api';
export {
    createDockview,
    createGridview,
    createPaneview,
    createSplitview,
} from './api/entryPoints';
export {
    registerModules,
    getRegisteredModules,
    clearRegisteredModules,
    markDockviewPackageLoaded,
    isDockviewPackageLoaded,
    defineModule,
    DockviewModule,
    ServiceCollection,
} from './dockview/modules';
export {
    IKeyboardNavigationHost,
    IKeyboardNavigationService,
    IAdvancedDnDHost,
    IAdvancedDnDService,
    IAutoHideEdgeGroupHost,
    IAutoHideEdgeGroupService,
    IContextMenuHost,
    IContextMenuService,
    IDropGuideHost,
    IDropGuideService,
    IKeyboardDockingService,
    ILayoutHistoryHost,
    ILayoutHistoryService,
    LayoutHistoryChangeEvent,
    LayoutHistoryKind,
    IMultiRowTabsHost,
    IMultiRowTabsService,
    ISmartGuidesHost,
    ISmartGuidesService,
    SmartGuidesSnapPosition,
    SmartGuidesSnapEvent,
    SmartGuidesSnapTogetherEvent,
    ITabGroupChipsHost,
    ITabGroupChipsService,
    IPinnedTabsHost,
    IPinnedTabsService,
} from './dockview/moduleContracts';
export { resolveMessages } from './dockview/accessibilityMessages';
export {
    findRelativeZIndexParent,
    prefersReducedMotion,
    resolveOpaqueBackground,
} from './dom';
export {
    createDismissableLayer,
    DismissableLayerOptions,
} from './dismissableLayer';
export { IDragGhostSpec } from './dnd/backend';
export { LiveRegionModule } from './dockview/liveRegionService';
export {
    AdvancedDnDModule,
    AdvancedDnDService,
} from './dockview/advancedDnDService';
export { FloatingGroupModule } from './dockview/floatingGroupService';
export { EdgeGroupModule } from './dockview/edgeGroupService';
export { createCloseButton, createPinButton } from './svg';
