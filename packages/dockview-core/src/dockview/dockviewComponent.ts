import {
    getRelativeLocation,
    SerializedGridObject,
    getGridLocation,
    ISerializedLeafNode,
    orthogonal,
} from '../gridview/gridview';
import {
    directionToPosition,
    Droptarget,
    DroptargetOverlayModel,
    Position,
} from '../dnd/droptarget';
import { tail, sequenceEquals, remove } from '../array';
import { DockviewPanel, IDockviewPanel } from './dockviewPanel';
import { CompositeDisposable, Disposable } from '../lifecycle';
import { Event, Emitter, addDisposableWindowListener } from '../events';
import { Watermark } from './components/watermark/watermark';
import { IWatermarkRenderer, GroupviewPanelState } from './types';
import { sequentialNumberGenerator } from '../math';
import { DefaultDockviewDeserialzier } from './deserializer';
import {
    AddGroupOptions,
    AddPanelOptions,
    DockviewComponentOptions,
    DockviewDndOverlayEvent,
    DockviewOptions,
    DockviewUnhandledDragOverEvent,
    isGroupOptionsWithGroup,
    isGroupOptionsWithPanel,
    isPanelOptionsWithGroup,
    isPanelOptionsWithPanel,
    MovementOptions,
} from './options';
import {
    BaseGrid,
    Direction,
    IBaseGrid,
    toTarget,
} from '../gridview/baseComponentGridview';
import { DockviewApi } from '../api/component.api';
import { Orientation } from '../splitview/splitview';
import {
    GroupOptions,
    GroupPanelViewState,
    DockviewDidDropEvent,
    DockviewWillDropEvent,
    WillShowOverlayLocationEvent,
} from './dockviewGroupPanelModel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { DockviewPanelModel } from './dockviewPanelModel';
import { getPanelData } from '../dnd/dataTransfer';
import { Parameters } from '../panel/types';
import { Overlay } from '../overlay/overlay';
import {
    addTestId,
    Classnames,
    getDockviewTheme,
    toggleClass,
    watchElementResize,
} from '../dom';
import { DockviewFloatingGroupPanel } from './dockviewFloatingGroupPanel';
import {
    GroupDragEvent,
    TabDragEvent,
} from './components/titlebar/tabsContainer';
import { AnchoredBox, AnchorPosition, Box } from '../types';
import {
    DEFAULT_FLOATING_GROUP_OVERFLOW_SIZE,
    DEFAULT_FLOATING_GROUP_POSITION,
} from '../constants';
import {
    DockviewPanelRenderer,
    OverlayRenderContainer,
} from '../overlay/overlayRenderContainer';
import { PopoutWindow } from '../popoutWindow';
import { StrictEventsSequencing } from './strictEventsSequencing';
import { PopupService } from './components/popupService';
import { DropTargetAnchorContainer } from '../dnd/dropTargetAnchorContainer';
import { themeAbyss } from './theme';

const DEFAULT_ROOT_OVERLAY_MODEL: DroptargetOverlayModel = {
    activationSize: { type: 'pixels', value: 10 },
    size: { type: 'pixels', value: 20 },
};

function moveGroupWithoutDestroying(options: {
    from: DockviewGroupPanel;
    to: DockviewGroupPanel;
}) {
    const activePanel = options.from.activePanel;
    const panels = [...options.from.panels].map((panel) => {
        const removedPanel = options.from.model.removePanel(panel);
        options.from.model.renderContainer.detatch(panel);
        return removedPanel;
    });

    panels.forEach((panel) => {
        options.to.model.openPanel(panel, {
            skipSetActive: activePanel !== panel,
            skipSetGroupActive: true,
        });
    });
}

export interface DockviewPopoutGroupOptions {
    /**
     * The position of the popout group
     */
    position?: Box;
    /**
     * The same-origin path at which the popout window will be created
     *
     * Defaults to `/popout.html` if not provided
     */
    popoutUrl?: string;
    onDidOpen?: (event: { id: string; window: Window }) => void;
    onWillClose?: (event: { id: string; window: Window }) => void;
    overridePopoutGroup?: DockviewGroupPanel;
}

export interface PanelReference {
    update: (event: { params: { [key: string]: any } }) => void;
    remove: () => void;
}

export interface SerializedFloatingGroup {
    data: GroupPanelViewState;
    position: AnchoredBox;
}

export interface SerializedPopoutGroup {
    data: GroupPanelViewState;
    url?: string;
    gridReferenceGroup?: string;
    position: Box | null;
}

export interface SerializedDockview {
    grid: {
        root: SerializedGridObject<GroupPanelViewState>;
        height: number;
        width: number;
        orientation: Orientation;
    };
    panels: Record<string, GroupviewPanelState>;
    activeGroup?: string;
    floatingGroups?: SerializedFloatingGroup[];
    popoutGroups?: SerializedPopoutGroup[];
}

export interface MovePanelEvent {
    panel: IDockviewPanel;
    from: DockviewGroupPanel;
}

type MoveGroupOptions = {
    from: { group: DockviewGroupPanel };
    to: { group: DockviewGroupPanel; position: Position };
};

type MoveGroupOrPanelOptions = {
    from: {
        groupId: string;
        panelId?: string;
    };
    to: {
        group: DockviewGroupPanel;
        position: Position;
        index?: number;
    };
};

export interface FloatingGroupOptions {
    x?: number;
    y?: number;
    height?: number;
    width?: number;
    position?: AnchorPosition;
}

export interface FloatingGroupOptionsInternal extends FloatingGroupOptions {
    skipRemoveGroup?: boolean;
    inDragMode?: boolean;
    skipActiveGroup?: boolean;
}

export interface DockviewMaximizedGroupChanged {
    group: DockviewGroupPanel;
    isMaximized: boolean;
}

export interface IDockviewComponent extends IBaseGrid<DockviewGroupPanel> {
    readonly activePanel: IDockviewPanel | undefined;
    readonly totalPanels: number;
    readonly panels: IDockviewPanel[];
    readonly orientation: Orientation;
    /**
     * @deprecated use `theme` instead. This will be removed in a future version
     */
    readonly gap: number;
    readonly onDidDrop: Event<DockviewDidDropEvent>;
    readonly onWillDrop: Event<DockviewWillDropEvent>;
    readonly onWillShowOverlay: Event<WillShowOverlayLocationEvent>;
    readonly onDidRemovePanel: Event<IDockviewPanel>;
    readonly onDidAddPanel: Event<IDockviewPanel>;
    readonly onDidLayoutFromJSON: Event<void>;
    readonly onDidActivePanelChange: Event<IDockviewPanel | undefined>;
    readonly onWillDragPanel: Event<TabDragEvent>;
    readonly onWillDragGroup: Event<GroupDragEvent>;
    readonly onDidRemoveGroup: Event<DockviewGroupPanel>;
    readonly onDidAddGroup: Event<DockviewGroupPanel>;
    readonly onDidActiveGroupChange: Event<DockviewGroupPanel | undefined>;
    readonly onUnhandledDragOverEvent: Event<DockviewDndOverlayEvent>;
    readonly onDidMovePanel: Event<MovePanelEvent>;
    readonly onDidMaximizedGroupChange: Event<DockviewMaximizedGroupChanged>;
    readonly options: DockviewComponentOptions;
    updateOptions(options: DockviewOptions): void;
    moveGroupOrPanel(options: MoveGroupOrPanelOptions): void;
    moveGroup(options: MoveGroupOptions): void;
    doSetGroupActive: (group: DockviewGroupPanel, skipFocus?: boolean) => void;
    removeGroup: (group: DockviewGroupPanel) => void;
    addPanel<T extends object = Parameters>(
        options: AddPanelOptions<T>
    ): IDockviewPanel;
    removePanel(panel: IDockviewPanel): void;
    getGroupPanel: (id: string) => IDockviewPanel | undefined;
    createWatermarkComponent(): IWatermarkRenderer;
    // lifecycle
    addGroup(options?: AddGroupOptions): DockviewGroupPanel;
    closeAllGroups(): void;
    // events
    moveToNext(options?: MovementOptions): void;
    moveToPrevious(options?: MovementOptions): void;
    setActivePanel(panel: IDockviewPanel): void;
    focus(): void;
    toJSON(): SerializedDockview;
    fromJSON(data: SerializedDockview): void;
    //
    addFloatingGroup(
        item: IDockviewPanel | DockviewGroupPanel,
        options?: FloatingGroupOptions
    ): void;
    addPopoutGroup(
        item: IDockviewPanel | DockviewGroupPanel,
        options?: {
            position?: Box;
            popoutUrl?: string;
            onDidOpen?: (event: { id: string; window: Window }) => void;
            onWillClose?: (event: { id: string; window: Window }) => void;
        }
    ): Promise<boolean>;
}

export class DockviewComponent
    extends BaseGrid<DockviewGroupPanel>
    implements IDockviewComponent
{
    private readonly nextGroupId = sequentialNumberGenerator();
    private readonly _deserializer = new DefaultDockviewDeserialzier(this);
    private readonly _api: DockviewApi;
    private _options: Exclude<DockviewComponentOptions, 'orientation'>;
    private _watermark: IWatermarkRenderer | null = null;
    private readonly _themeClassnames: Classnames;

    readonly overlayRenderContainer: OverlayRenderContainer;
    readonly popupService: PopupService;
    readonly rootDropTargetContainer: DropTargetAnchorContainer;

    private readonly _onWillDragPanel = new Emitter<TabDragEvent>();
    readonly onWillDragPanel: Event<TabDragEvent> = this._onWillDragPanel.event;

    private readonly _onWillDragGroup = new Emitter<GroupDragEvent>();
    readonly onWillDragGroup: Event<GroupDragEvent> =
        this._onWillDragGroup.event;

    private readonly _onDidDrop = new Emitter<DockviewDidDropEvent>();
    readonly onDidDrop: Event<DockviewDidDropEvent> = this._onDidDrop.event;

    private readonly _onWillDrop = new Emitter<DockviewWillDropEvent>();
    readonly onWillDrop: Event<DockviewWillDropEvent> = this._onWillDrop.event;

    private readonly _onWillShowOverlay =
        new Emitter<WillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<WillShowOverlayLocationEvent> =
        this._onWillShowOverlay.event;

    private readonly _onUnhandledDragOverEvent =
        new Emitter<DockviewDndOverlayEvent>();
    readonly onUnhandledDragOverEvent: Event<DockviewDndOverlayEvent> =
        this._onUnhandledDragOverEvent.event;

    private readonly _onDidRemovePanel = new Emitter<IDockviewPanel>();
    readonly onDidRemovePanel: Event<IDockviewPanel> =
        this._onDidRemovePanel.event;

    private readonly _onDidAddPanel = new Emitter<IDockviewPanel>();
    readonly onDidAddPanel: Event<IDockviewPanel> = this._onDidAddPanel.event;

    private readonly _onDidLayoutFromJSON = new Emitter<void>();
    readonly onDidLayoutFromJSON: Event<void> = this._onDidLayoutFromJSON.event;

    private readonly _onDidActivePanelChange = new Emitter<
        IDockviewPanel | undefined
    >();
    readonly onDidActivePanelChange: Event<IDockviewPanel | undefined> =
        this._onDidActivePanelChange.event;

    private readonly _onDidMovePanel = new Emitter<MovePanelEvent>();
    readonly onDidMovePanel = this._onDidMovePanel.event;

    private readonly _onDidMaximizedGroupChange =
        new Emitter<DockviewMaximizedGroupChanged>();
    readonly onDidMaximizedGroupChange = this._onDidMaximizedGroupChange.event;

    private readonly _floatingGroups: DockviewFloatingGroupPanel[] = [];
    private readonly _popoutGroups: {
        window: PopoutWindow;
        popoutGroup: DockviewGroupPanel;
        referenceGroup?: string;
        disposable: { dispose: () => DockviewGroupPanel | undefined };
    }[] = [];
    private readonly _rootDropTarget: Droptarget;

    private readonly _onDidRemoveGroup = new Emitter<DockviewGroupPanel>();
    readonly onDidRemoveGroup: Event<DockviewGroupPanel> =
        this._onDidRemoveGroup.event;

    protected readonly _onDidAddGroup = new Emitter<DockviewGroupPanel>();
    readonly onDidAddGroup: Event<DockviewGroupPanel> =
        this._onDidAddGroup.event;

    private readonly _onDidOptionsChange = new Emitter<void>();
    readonly onDidOptionsChange: Event<void> = this._onDidOptionsChange.event;

    private readonly _onDidActiveGroupChange = new Emitter<
        DockviewGroupPanel | undefined
    >();
    readonly onDidActiveGroupChange: Event<DockviewGroupPanel | undefined> =
        this._onDidActiveGroupChange.event;

    get orientation(): Orientation {
        return this.gridview.orientation;
    }

    get totalPanels(): number {
        return this.panels.length;
    }

    get panels(): IDockviewPanel[] {
        return this.groups.flatMap((group) => group.panels);
    }

    get options(): DockviewComponentOptions {
        return this._options;
    }

    get activePanel(): IDockviewPanel | undefined {
        const activeGroup = this.activeGroup;

        if (!activeGroup) {
            return undefined;
        }

        return activeGroup.activePanel;
    }

    get renderer(): DockviewPanelRenderer {
        return this.options.defaultRenderer ?? 'onlyWhenVisible';
    }

    get api(): DockviewApi {
        return this._api;
    }

    get gap(): number {
        console.warn(
            'dockview: dockviewComponent.gap has been deprecated. Use `theme` instead. This will be removed in a future version.'
        );
        return this.gridview.margin;
    }

    get floatingGroups(): DockviewFloatingGroupPanel[] {
        return this._floatingGroups;
    }

    constructor(container: HTMLElement, options: DockviewComponentOptions) {
        super(container, {
            proportionalLayout: true,
            orientation: Orientation.HORIZONTAL,
            styles: options.hideBorders
                ? { separatorBorder: 'transparent' }
                : undefined,
            disableAutoResizing: options.disableAutoResizing,
            locked: options.locked,
            margin: options.theme?.gap ?? 0,
            className: options.className,
        });

        this.popupService = new PopupService(this.element);

        this.updateDropTargetModel(options);

        this._themeClassnames = new Classnames(this.element);

        this.rootDropTargetContainer = new DropTargetAnchorContainer(
            this.element,
            { disabled: true }
        );
        this.overlayRenderContainer = new OverlayRenderContainer(
            this.gridview.element,
            this
        );

        toggleClass(this.gridview.element, 'dv-dockview', true);
        toggleClass(this.element, 'dv-debug', !!options.debug);

        if (options.debug) {
            this.addDisposables(new StrictEventsSequencing(this));
        }

        this.addDisposables(
            this.rootDropTargetContainer,
            this.overlayRenderContainer,
            this._onWillDragPanel,
            this._onWillDragGroup,
            this._onWillShowOverlay,
            this._onDidActivePanelChange,
            this._onDidAddPanel,
            this._onDidRemovePanel,
            this._onDidLayoutFromJSON,
            this._onDidDrop,
            this._onWillDrop,
            this._onDidMovePanel,
            this._onDidAddGroup,
            this._onDidRemoveGroup,
            this._onDidActiveGroupChange,
            this._onUnhandledDragOverEvent,
            this._onDidMaximizedGroupChange,
            this._onDidOptionsChange,
            this.onDidViewVisibilityChangeMicroTaskQueue(() => {
                this.updateWatermark();
            }),
            this.onDidAdd((event) => {
                if (!this._moving) {
                    this._onDidAddGroup.fire(event);
                }
            }),
            this.onDidRemove((event) => {
                if (!this._moving) {
                    this._onDidRemoveGroup.fire(event);
                }
            }),
            this.onDidActiveChange((event) => {
                if (!this._moving) {
                    this._onDidActiveGroupChange.fire(event);
                }
            }),
            this.onDidMaximizedChange((event) => {
                this._onDidMaximizedGroupChange.fire({
                    group: event.panel,
                    isMaximized: event.isMaximized,
                });
            }),
            Event.any(
                this.onDidAdd,
                this.onDidRemove
            )(() => {
                this.updateWatermark();
            }),
            Event.any<unknown>(
                this.onDidAddPanel,
                this.onDidRemovePanel,
                this.onDidAddGroup,
                this.onDidRemove,
                this.onDidMovePanel,
                this.onDidActivePanelChange
            )(() => {
                this._bufferOnDidLayoutChange.fire();
            }),
            Disposable.from(() => {
                // iterate over a copy of the array since .dispose() mutates the original array
                for (const group of [...this._floatingGroups]) {
                    group.dispose();
                }

                // iterate over a copy of the array since .dispose() mutates the original array
                for (const group of [...this._popoutGroups]) {
                    group.disposable.dispose();
                }
            })
        );

        this._options = options;
        this.updateTheme();

        this._rootDropTarget = new Droptarget(this.element, {
            className: 'dv-drop-target-edge',
            canDisplayOverlay: (event, position) => {
                const data = getPanelData();

                if (data) {
                    if (data.viewId !== this.id) {
                        return false;
                    }

                    if (position === 'center') {
                        // center drop target is only allowed if there are no panels in the grid
                        // floating panels are allowed
                        return this.gridview.length === 0;
                    }

                    return true;
                }

                if (position === 'center' && this.gridview.length !== 0) {
                    /**
                     * for external events only show the four-corner drag overlays, disable
                     * the center position so that external drag events can fall through to the group
                     * and panel drop target handlers
                     */
                    return false;
                }

                const firedEvent = new DockviewUnhandledDragOverEvent(
                    event,
                    'edge',
                    position,
                    getPanelData
                );

                this._onUnhandledDragOverEvent.fire(firedEvent);

                return firedEvent.isAccepted;
            },
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
            overlayModel:
                this.options.rootOverlayModel ?? DEFAULT_ROOT_OVERLAY_MODEL,
            getOverrideTarget: () => this.rootDropTargetContainer?.model,
        });

        this.addDisposables(
            this._rootDropTarget,
            this._rootDropTarget.onWillShowOverlay((event) => {
                if (this.gridview.length > 0 && event.position === 'center') {
                    // option only available when no panels in primary grid
                    return;
                }

                this._onWillShowOverlay.fire(
                    new WillShowOverlayLocationEvent(event, {
                        kind: 'edge',
                        panel: undefined,
                        api: this._api,
                        group: undefined,
                        getData: getPanelData,
                    })
                );
            }),
            this._rootDropTarget.onDrop((event) => {
                const willDropEvent = new DockviewWillDropEvent({
                    nativeEvent: event.nativeEvent,
                    position: event.position,
                    panel: undefined,
                    api: this._api,
                    group: undefined,
                    getData: getPanelData,
                    kind: 'edge',
                });

                this._onWillDrop.fire(willDropEvent);

                if (willDropEvent.defaultPrevented) {
                    return;
                }

                const data = getPanelData();

                if (data) {
                    this.moveGroupOrPanel({
                        from: {
                            groupId: data.groupId,
                            panelId: data.panelId ?? undefined,
                        },
                        to: {
                            group: this.orthogonalize(event.position),
                            position: 'center',
                        },
                    });
                } else {
                    this._onDidDrop.fire(
                        new DockviewDidDropEvent({
                            nativeEvent: event.nativeEvent,
                            position: event.position,
                            panel: undefined,
                            api: this._api,
                            group: undefined,
                            getData: getPanelData,
                        })
                    );
                }
            }),
            this._rootDropTarget
        );

        this._api = new DockviewApi(this);

        this.updateWatermark();
    }

    override setVisible(panel: DockviewGroupPanel, visible: boolean): void {
        switch (panel.api.location.type) {
            case 'grid':
                super.setVisible(panel, visible);
                break;
            case 'floating': {
                const item = this.floatingGroups.find(
                    (floatingGroup) => floatingGroup.group === panel
                );

                if (item) {
                    item.overlay.setVisible(visible);
                    panel.api._onDidVisibilityChange.fire({
                        isVisible: visible,
                    });
                }
                break;
            }
            case 'popout':
                console.warn(
                    'dockview: You cannot hide a group that is in a popout window'
                );
                break;
        }
    }

    addPopoutGroup(
        itemToPopout: DockviewPanel | DockviewGroupPanel,
        options?: DockviewPopoutGroupOptions
    ): Promise<boolean> {
        if (
            itemToPopout instanceof DockviewPanel &&
            itemToPopout.group.size === 1
        ) {
            return this.addPopoutGroup(itemToPopout.group, options);
        }

        const theme = getDockviewTheme(this.gridview.element);
        const element = this.element;

        function getBox(): Box {
            if (options?.position) {
                return options.position;
            }

            if (itemToPopout instanceof DockviewGroupPanel) {
                return itemToPopout.element.getBoundingClientRect();
            }

            if (itemToPopout.group) {
                return itemToPopout.group.element.getBoundingClientRect();
            }
            return element.getBoundingClientRect();
        }

        const box: Box = getBox();

        const groupId =
            options?.overridePopoutGroup?.id ?? this.getNextGroupId();

        const _window = new PopoutWindow(
            `${this.id}-${groupId}`, // unique id
            theme ?? '',
            {
                url:
                    options?.popoutUrl ??
                    this.options?.popoutUrl ??
                    '/popout.html',
                left: window.screenX + box.left,
                top: window.screenY + box.top,
                width: box.width,
                height: box.height,
                onDidOpen: options?.onDidOpen,
                onWillClose: options?.onWillClose,
            }
        );

        const popoutWindowDisposable = new CompositeDisposable(
            _window,
            _window.onDidClose(() => {
                popoutWindowDisposable.dispose();
            })
        );

        return _window
            .open()
            .then((popoutContainer) => {
                if (_window.isDisposed) {
                    return false;
                }

                if (popoutContainer === null) {
                    popoutWindowDisposable.dispose();
                    return false;
                }

                const gready = document.createElement('div');
                gready.className = 'dv-overlay-render-container';

                const overlayRenderContainer = new OverlayRenderContainer(
                    gready,
                    this
                );

                const referenceGroup =
                    itemToPopout instanceof DockviewPanel
                        ? itemToPopout.group
                        : itemToPopout;

                const referenceLocation = itemToPopout.api.location.type;

                /**
                 * The group that is being added doesn't already exist within the DOM, the most likely occurance
                 * of this case is when being called from the `fromJSON(...)` method
                 */
                const isGroupAddedToDom =
                    referenceGroup.element.parentElement !== null;

                let group: DockviewGroupPanel;

                if (!isGroupAddedToDom) {
                    group = referenceGroup;
                } else if (options?.overridePopoutGroup) {
                    group = options.overridePopoutGroup;
                } else {
                    group = this.createGroup({ id: groupId });
                    this._onDidAddGroup.fire(group);
                }

                group.model.renderContainer = overlayRenderContainer;
                group.layout(
                    _window.window!.innerWidth,
                    _window.window!.innerHeight
                );

                let floatingBox: AnchoredBox | undefined;

                if (!options?.overridePopoutGroup && isGroupAddedToDom) {
                    if (itemToPopout instanceof DockviewPanel) {
                        this.movingLock(() => {
                            const panel =
                                referenceGroup.model.removePanel(itemToPopout);
                            group.model.openPanel(panel);
                        });
                    } else {
                        this.movingLock(() =>
                            moveGroupWithoutDestroying({
                                from: referenceGroup,
                                to: group,
                            })
                        );

                        switch (referenceLocation) {
                            case 'grid':
                                referenceGroup.api.setVisible(false);
                                break;
                            case 'floating':
                            case 'popout':
                                floatingBox = this._floatingGroups
                                    .find(
                                        (value) =>
                                            value.group.api.id ===
                                            itemToPopout.api.id
                                    )
                                    ?.overlay.toJSON();

                                this.removeGroup(referenceGroup);

                                break;
                        }
                    }
                }

                popoutContainer.classList.add('dv-dockview');
                popoutContainer.style.overflow = 'hidden';
                popoutContainer.appendChild(gready);

                popoutContainer.appendChild(group.element);

                const anchor = document.createElement('div');
                const dropTargetContainer = new DropTargetAnchorContainer(
                    anchor,
                    { disabled: this.rootDropTargetContainer.disabled }
                );
                popoutContainer.appendChild(anchor);

                group.model.dropTargetContainer = dropTargetContainer;

                group.model.location = {
                    type: 'popout',
                    getWindow: () => _window.window!,
                    popoutUrl: options?.popoutUrl,
                };

                if (
                    isGroupAddedToDom &&
                    itemToPopout.api.location.type === 'grid'
                ) {
                    itemToPopout.api.setVisible(false);
                }

                this.doSetGroupAndPanelActive(group);

                popoutWindowDisposable.addDisposables(
                    group.api.onDidActiveChange((event) => {
                        if (event.isActive) {
                            _window.window?.focus();
                        }
                    }),
                    group.api.onWillFocus(() => {
                        _window.window?.focus();
                    })
                );

                let returnedGroup: DockviewGroupPanel | undefined;

                const isValidReferenceGroup =
                    isGroupAddedToDom &&
                    referenceGroup &&
                    this.getPanel(referenceGroup.id);

                const value = {
                    window: _window,
                    popoutGroup: group,
                    referenceGroup: isValidReferenceGroup
                        ? referenceGroup.id
                        : undefined,
                    disposable: {
                        dispose: () => {
                            popoutWindowDisposable.dispose();
                            return returnedGroup;
                        },
                    },
                };

                popoutWindowDisposable.addDisposables(
                    /**
                     * ResizeObserver seems slow here, I do not know why but we don't need it
                     * since we can reply on the window resize event as we will occupy the full
                     * window dimensions
                     */
                    addDisposableWindowListener(
                        _window.window!,
                        'resize',
                        () => {
                            group.layout(
                                _window.window!.innerWidth,
                                _window.window!.innerHeight
                            );
                        }
                    ),
                    overlayRenderContainer,
                    Disposable.from(() => {
                        if (this.isDisposed) {
                            return; // cleanup may run after instance is disposed
                        }

                        if (
                            isGroupAddedToDom &&
                            this.getPanel(referenceGroup.id)
                        ) {
                            this.movingLock(() =>
                                moveGroupWithoutDestroying({
                                    from: group,
                                    to: referenceGroup,
                                })
                            );

                            if (!referenceGroup.api.isVisible) {
                                referenceGroup.api.setVisible(true);
                            }

                            if (this.getPanel(group.id)) {
                                this.doRemoveGroup(group, {
                                    skipPopoutAssociated: true,
                                });
                            }
                        } else if (this.getPanel(group.id)) {
                            group.model.renderContainer =
                                this.overlayRenderContainer;
                            group.model.dropTargetContainer =
                                this.rootDropTargetContainer;
                            returnedGroup = group;

                            const alreadyRemoved = !this._popoutGroups.find(
                                (p) => p.popoutGroup === group
                            );

                            if (alreadyRemoved) {
                                /**
                                 * If this popout group was explicitly removed then we shouldn't run the additional
                                 * steps. To tell if the running of this disposable is the result of this popout group
                                 * being explicitly removed we can check if this popout group is still referenced in
                                 * the `this._popoutGroups` list.
                                 */
                                return;
                            }

                            if (floatingBox) {
                                this.addFloatingGroup(group, {
                                    height: floatingBox.height,
                                    width: floatingBox.width,
                                    position: floatingBox,
                                });
                            } else {
                                this.doRemoveGroup(group, {
                                    skipDispose: true,
                                    skipActive: true,
                                    skipPopoutReturn: true,
                                });

                                group.model.location = { type: 'grid' };

                                this.movingLock(() => {
                                    // suppress group add events since the group already exists
                                    this.doAddGroup(group, [0]);
                                });
                            }
                            this.doSetGroupAndPanelActive(group);
                        }
                    })
                );

                this._popoutGroups.push(value);
                this.updateWatermark();

                return true;
            })
            .catch((err) => {
                console.error('dockview: failed to create popout window', err);
                return false;
            });
    }

    addFloatingGroup(
        item: DockviewPanel | DockviewGroupPanel,
        options?: FloatingGroupOptionsInternal
    ): void {
        let group: DockviewGroupPanel;

        if (item instanceof DockviewPanel) {
            group = this.createGroup();
            this._onDidAddGroup.fire(group);

            this.movingLock(() =>
                this.removePanel(item, {
                    removeEmptyGroup: true,
                    skipDispose: true,
                    skipSetActiveGroup: true,
                })
            );

            this.movingLock(() =>
                group.model.openPanel(item, { skipSetGroupActive: true })
            );
        } else {
            group = item;

            const popoutReferenceGroupId = this._popoutGroups.find(
                (_) => _.popoutGroup === group
            )?.referenceGroup;
            const popoutReferenceGroup = popoutReferenceGroupId
                ? this.getPanel(popoutReferenceGroupId)
                : undefined;

            const skip =
                typeof options?.skipRemoveGroup === 'boolean' &&
                options.skipRemoveGroup;

            if (!skip) {
                if (popoutReferenceGroup) {
                    this.movingLock(() =>
                        moveGroupWithoutDestroying({
                            from: item,
                            to: popoutReferenceGroup,
                        })
                    );
                    this.doRemoveGroup(item, {
                        skipPopoutReturn: true,
                        skipPopoutAssociated: true,
                    });
                    this.doRemoveGroup(popoutReferenceGroup, {
                        skipDispose: true,
                    });
                    group = popoutReferenceGroup;
                } else {
                    this.doRemoveGroup(item, {
                        skipDispose: true,
                        skipPopoutReturn: true,
                        skipPopoutAssociated: false,
                    });
                }
            }
        }

        function getAnchoredBox(): AnchoredBox {
            if (options?.position) {
                const result: any = {};

                if ('left' in options.position) {
                    result.left = Math.max(options.position.left, 0);
                } else if ('right' in options.position) {
                    result.right = Math.max(options.position.right, 0);
                } else {
                    result.left = DEFAULT_FLOATING_GROUP_POSITION.left;
                }
                if ('top' in options.position) {
                    result.top = Math.max(options.position.top, 0);
                } else if ('bottom' in options.position) {
                    result.bottom = Math.max(options.position.bottom, 0);
                } else {
                    result.top = DEFAULT_FLOATING_GROUP_POSITION.top;
                }
                if (typeof options.width === 'number') {
                    result.width = Math.max(options.width, 0);
                } else {
                    result.width = DEFAULT_FLOATING_GROUP_POSITION.width;
                }
                if (typeof options.height === 'number') {
                    result.height = Math.max(options.height, 0);
                } else {
                    result.height = DEFAULT_FLOATING_GROUP_POSITION.height;
                }
                return result as AnchoredBox;
            }

            return {
                left:
                    typeof options?.x === 'number'
                        ? Math.max(options.x, 0)
                        : DEFAULT_FLOATING_GROUP_POSITION.left,
                top:
                    typeof options?.y === 'number'
                        ? Math.max(options.y, 0)
                        : DEFAULT_FLOATING_GROUP_POSITION.top,
                width:
                    typeof options?.width === 'number'
                        ? Math.max(options.width, 0)
                        : DEFAULT_FLOATING_GROUP_POSITION.width,
                height:
                    typeof options?.height === 'number'
                        ? Math.max(options.height, 0)
                        : DEFAULT_FLOATING_GROUP_POSITION.height,
            };
        }

        const anchoredBox = getAnchoredBox();

        const overlay = new Overlay({
            container: this.gridview.element,
            content: group.element,
            ...anchoredBox,
            minimumInViewportWidth:
                this.options.floatingGroupBounds === 'boundedWithinViewport'
                    ? undefined
                    : this.options.floatingGroupBounds
                          ?.minimumWidthWithinViewport ??
                      DEFAULT_FLOATING_GROUP_OVERFLOW_SIZE,
            minimumInViewportHeight:
                this.options.floatingGroupBounds === 'boundedWithinViewport'
                    ? undefined
                    : this.options.floatingGroupBounds
                          ?.minimumHeightWithinViewport ??
                      DEFAULT_FLOATING_GROUP_OVERFLOW_SIZE,
        });

        const el = group.element.querySelector('.dv-void-container');

        if (!el) {
            throw new Error('failed to find drag handle');
        }

        overlay.setupDrag(<HTMLElement>el, {
            inDragMode:
                typeof options?.inDragMode === 'boolean'
                    ? options.inDragMode
                    : false,
        });

        const floatingGroupPanel = new DockviewFloatingGroupPanel(
            group,
            overlay
        );

        const disposable = new CompositeDisposable(
            group.api.onDidActiveChange((event) => {
                if (event.isActive) {
                    overlay.bringToFront();
                }
            }),
            watchElementResize(group.element, (entry) => {
                const { width, height } = entry.contentRect;
                group.layout(width, height); // let the group know it's size is changing so it can fire events to the panel
            })
        );

        floatingGroupPanel.addDisposables(
            overlay.onDidChange(() => {
                // this is either a resize or a move
                // to inform the panels .layout(...) the group with it's current size
                // don't care about resize since the above watcher handles that
                group.layout(group.width, group.height);
            }),
            overlay.onDidChangeEnd(() => {
                this._bufferOnDidLayoutChange.fire();
            }),
            group.onDidChange((event) => {
                overlay.setBounds({
                    height: event?.height,
                    width: event?.width,
                });
            }),
            {
                dispose: () => {
                    disposable.dispose();

                    remove(this._floatingGroups, floatingGroupPanel);
                    group.model.location = { type: 'grid' };
                    this.updateWatermark();
                },
            }
        );

        this._floatingGroups.push(floatingGroupPanel);

        group.model.location = { type: 'floating' };

        if (!options?.skipActiveGroup) {
            this.doSetGroupAndPanelActive(group);
        }

        this.updateWatermark();
    }

    private orthogonalize(position: Position): DockviewGroupPanel {
        switch (position) {
            case 'top':
            case 'bottom':
                if (this.gridview.orientation === Orientation.HORIZONTAL) {
                    // we need to add to a vertical splitview but the current root is a horizontal splitview.
                    // insert a vertical splitview at the root level and add the existing view as a child
                    this.gridview.insertOrthogonalSplitviewAtRoot();
                }
                break;
            case 'left':
            case 'right':
                if (this.gridview.orientation === Orientation.VERTICAL) {
                    // we need to add to a horizontal splitview but the current root is a vertical splitview.
                    // insert a horiziontal splitview at the root level and add the existing view as a child
                    this.gridview.insertOrthogonalSplitviewAtRoot();
                }
                break;
            default:
                break;
        }

        switch (position) {
            case 'top':
            case 'left':
            case 'center':
                return this.createGroupAtLocation([0]); // insert into first position
            case 'bottom':
            case 'right':
                return this.createGroupAtLocation([this.gridview.length]); // insert into last position
            default:
                throw new Error(`unsupported position ${position}`);
        }
    }

    override updateOptions(options: Partial<DockviewComponentOptions>): void {
        super.updateOptions(options);

        if ('gap' in options) {
            console.warn(
                'dockview: dockviewComponent.setGap has been deprecated. Use `theme` instead. This will be removed in a future version.'
            );
            this.gridview.margin = options.gap ?? 0;
        }

        if ('floatingGroupBounds' in options) {
            for (const group of this._floatingGroups) {
                switch (options.floatingGroupBounds) {
                    case 'boundedWithinViewport':
                        group.overlay.minimumInViewportHeight = undefined;
                        group.overlay.minimumInViewportWidth = undefined;
                        break;
                    case undefined:
                        group.overlay.minimumInViewportHeight =
                            DEFAULT_FLOATING_GROUP_OVERFLOW_SIZE;
                        group.overlay.minimumInViewportWidth =
                            DEFAULT_FLOATING_GROUP_OVERFLOW_SIZE;
                        break;
                    default:
                        group.overlay.minimumInViewportHeight =
                            options.floatingGroupBounds?.minimumHeightWithinViewport;
                        group.overlay.minimumInViewportWidth =
                            options.floatingGroupBounds?.minimumWidthWithinViewport;
                }

                group.overlay.setBounds();
            }
        }

        this.updateDropTargetModel(options);

        this._options = { ...this.options, ...options };

        if ('theme' in options) {
            this.updateTheme();
        }

        this.layout(this.gridview.width, this.gridview.height, true);
    }

    override layout(
        width: number,
        height: number,
        forceResize?: boolean | undefined
    ): void {
        super.layout(width, height, forceResize);

        if (this._floatingGroups) {
            for (const floating of this._floatingGroups) {
                // ensure floting groups stay within visible boundaries
                floating.overlay.setBounds();
            }
        }
    }

    focus(): void {
        this.activeGroup?.focus();
    }

    getGroupPanel(id: string): IDockviewPanel | undefined {
        return this.panels.find((panel) => panel.id === id);
    }

    setActivePanel(panel: IDockviewPanel): void {
        panel.group.model.openPanel(panel);
        this.doSetGroupAndPanelActive(panel.group);
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
                options.group.activePanel !==
                options.group.panels[options.group.panels.length - 1]
            ) {
                options.group.model.moveToNext({ suppressRoll: true });
                return;
            }
        }

        const location = getGridLocation(options.group.element);
        const next = <DockviewGroupPanel>this.gridview.next(location)?.view;
        this.doSetGroupAndPanelActive(next);
    }

    moveToPrevious(options: MovementOptions = {}): void {
        if (!options.group) {
            if (!this.activeGroup) {
                return;
            }
            options.group = this.activeGroup;
        }

        if (options.includePanel && options.group) {
            if (options.group.activePanel !== options.group.panels[0]) {
                options.group.model.moveToPrevious({ suppressRoll: true });
                return;
            }
        }

        const location = getGridLocation(options.group.element);
        const next = this.gridview.previous(location)?.view;
        if (next) {
            this.doSetGroupAndPanelActive(next as DockviewGroupPanel);
        }
    }

    /**
     * Serialize the current state of the layout
     *
     * @returns A JSON respresentation of the layout
     */
    toJSON(): SerializedDockview {
        const data = this.gridview.serialize();

        const panels = this.panels.reduce((collection, panel) => {
            collection[panel.id] = panel.toJSON();
            return collection;
        }, {} as { [key: string]: GroupviewPanelState });

        const floats: SerializedFloatingGroup[] = this._floatingGroups.map(
            (group) => {
                return {
                    data: group.group.toJSON() as GroupPanelViewState,
                    position: group.overlay.toJSON(),
                };
            }
        );

        const popoutGroups: SerializedPopoutGroup[] = this._popoutGroups.map(
            (group) => {
                return {
                    data: group.popoutGroup.toJSON() as GroupPanelViewState,
                    gridReferenceGroup: group.referenceGroup,
                    position: group.window.dimensions(),
                    url:
                        group.popoutGroup.api.location.type === 'popout'
                            ? group.popoutGroup.api.location.popoutUrl
                            : undefined,
                };
            }
        );

        const result: SerializedDockview = {
            grid: data,
            panels,
            activeGroup: this.activeGroup?.id,
        };

        if (floats.length > 0) {
            result.floatingGroups = floats;
        }

        if (popoutGroups.length > 0) {
            result.popoutGroups = popoutGroups;
        }

        return result;
    }

    fromJSON(data: SerializedDockview): void {
        this.clear();

        if (typeof data !== 'object' || data === null) {
            throw new Error('serialized layout must be a non-null object');
        }

        const { grid, panels, activeGroup } = data;

        if (grid.root.type !== 'branch' || !Array.isArray(grid.root.data)) {
            throw new Error('root must be of type branch');
        }

        try {
            // take note of the existing dimensions
            const width = this.width;
            const height = this.height;

            const createGroupFromSerializedState = (
                data: GroupPanelViewState
            ) => {
                const { id, locked, hideHeader, views, activeView } = data;

                if (typeof id !== 'string') {
                    throw new Error('group id must be of type string');
                }

                const group = this.createGroup({
                    id,
                    locked: !!locked,
                    hideHeader: !!hideHeader,
                });
                this._onDidAddGroup.fire(group);

                const createdPanels: IDockviewPanel[] = [];

                for (const child of views) {
                    /**
                     * Run the deserializer step seperately since this may fail to due corrupted external state.
                     * In running this section first we avoid firing lots of 'add' events in the event of a failure
                     * due to a corruption of input data.
                     */
                    const panel = this._deserializer.fromJSON(
                        panels[child],
                        group
                    );
                    createdPanels.push(panel);
                }

                for (let i = 0; i < views.length; i++) {
                    const panel = createdPanels[i];

                    const isActive =
                        typeof activeView === 'string' &&
                        activeView === panel.id;

                    group.model.openPanel(panel, {
                        skipSetActive: !isActive,
                        skipSetGroupActive: true,
                    });
                }

                if (!group.activePanel && group.panels.length > 0) {
                    group.model.openPanel(
                        group.panels[group.panels.length - 1],
                        {
                            skipSetGroupActive: true,
                        }
                    );
                }

                return group;
            };

            this.gridview.deserialize(grid, {
                fromJSON: (node: ISerializedLeafNode<GroupPanelViewState>) => {
                    return createGroupFromSerializedState(node.data);
                },
            });

            this.layout(width, height, true);

            const serializedFloatingGroups = data.floatingGroups ?? [];

            for (const serializedFloatingGroup of serializedFloatingGroups) {
                const { data, position } = serializedFloatingGroup;

                const group = createGroupFromSerializedState(data);

                this.addFloatingGroup(group, {
                    position: position,
                    width: position.width,
                    height: position.height,
                    skipRemoveGroup: true,
                    inDragMode: false,
                });
            }

            const serializedPopoutGroups = data.popoutGroups ?? [];

            for (const serializedPopoutGroup of serializedPopoutGroups) {
                const { data, position, gridReferenceGroup, url } =
                    serializedPopoutGroup;

                const group = createGroupFromSerializedState(data);

                this.addPopoutGroup(
                    (gridReferenceGroup
                        ? this.getPanel(gridReferenceGroup)
                        : undefined) ?? group,
                    {
                        position: position ?? undefined,
                        overridePopoutGroup: gridReferenceGroup
                            ? group
                            : undefined,
                        popoutUrl: url,
                    }
                );
            }

            for (const floatingGroup of this._floatingGroups) {
                floatingGroup.overlay.setBounds();
            }

            if (typeof activeGroup === 'string') {
                const panel = this.getPanel(activeGroup);
                if (panel) {
                    this.doSetGroupAndPanelActive(panel);
                }
            }
        } catch (err) {
            console.error(
                'dockview: failed to deserialize layout. Reverting changes',
                err
            );

            /**
             * Takes all the successfully created groups and remove all of their panels.
             */
            for (const group of this.groups) {
                for (const panel of group.panels) {
                    this.removePanel(panel, {
                        removeEmptyGroup: false,
                        skipDispose: false,
                    });
                }
            }

            /**
             * To remove a group we cannot call this.removeGroup(...) since this makes assumptions about
             * the underlying HTMLElement existing in the Gridview.
             */
            for (const group of this.groups) {
                group.dispose();
                this._groups.delete(group.id);
                this._onDidRemoveGroup.fire(group);
            }

            // iterate over a reassigned array since original array will be modified
            for (const floatingGroup of [...this._floatingGroups]) {
                floatingGroup.dispose();
            }

            // fires clean-up events and clears the underlying HTML gridview.
            this.clear();

            /**
             * even though we have cleaned-up we still want to inform the caller of their error
             * and we'll do this through re-throwing the original error since afterall you would
             * expect trying to load a corrupted layout to result in an error and not silently fail...
             */
            throw err;
        }

        this.updateWatermark();

        this._onDidLayoutFromJSON.fire();
    }

    clear(): void {
        const groups = Array.from(this._groups.values()).map((_) => _.value);

        const hasActiveGroup = !!this.activeGroup;

        for (const group of groups) {
            // remove the group will automatically remove the panels
            this.removeGroup(group, { skipActive: true });
        }

        if (hasActiveGroup) {
            this.doSetGroupAndPanelActive(undefined);
        }

        this.gridview.clear();
    }

    closeAllGroups(): void {
        for (const entry of this._groups.entries()) {
            const [_, group] = entry;

            group.value.model.closeAllPanels();
        }
    }

    addPanel<T extends object = Parameters>(
        options: AddPanelOptions<T>
    ): DockviewPanel {
        if (this.panels.find((_) => _.id === options.id)) {
            throw new Error(`panel with id ${options.id} already exists`);
        }

        let referenceGroup: DockviewGroupPanel | undefined;

        if (options.position && options.floating) {
            throw new Error(
                'you can only provide one of: position, floating as arguments to .addPanel(...)'
            );
        }

        const initial = {
            width: options.initialWidth,
            height: options.initialHeight,
        };

        let index: number | undefined;

        if (options.position) {
            if (isPanelOptionsWithPanel(options.position)) {
                const referencePanel =
                    typeof options.position.referencePanel === 'string'
                        ? this.getGroupPanel(options.position.referencePanel)
                        : options.position.referencePanel;
                index = options.position.index;

                if (!referencePanel) {
                    throw new Error(
                        `referencePanel '${options.position.referencePanel}' does not exist`
                    );
                }

                referenceGroup = this.findGroup(referencePanel);
            } else if (isPanelOptionsWithGroup(options.position)) {
                referenceGroup =
                    typeof options.position.referenceGroup === 'string'
                        ? this._groups.get(options.position.referenceGroup)
                              ?.value
                        : options.position.referenceGroup;
                index = options.position.index;

                if (!referenceGroup) {
                    throw new Error(
                        `referenceGroup '${options.position.referenceGroup}' does not exist`
                    );
                }
            } else {
                const group = this.orthogonalize(
                    directionToPosition(<Direction>options.position.direction)
                );

                const panel = this.createPanel(options, group);
                group.model.openPanel(panel, {
                    skipSetActive: options.inactive,
                    skipSetGroupActive: options.inactive,
                    index,
                });

                if (!options.inactive) {
                    this.doSetGroupAndPanelActive(group);
                }

                group.api.setSize({
                    height: initial?.height,
                    width: initial?.width,
                });

                return panel;
            }
        } else {
            referenceGroup = this.activeGroup;
        }

        let panel: DockviewPanel;

        if (referenceGroup) {
            const target = toTarget(
                <Direction>options.position?.direction || 'within'
            );

            if (options.floating) {
                const group = this.createGroup();
                this._onDidAddGroup.fire(group);

                const floatingGroupOptions =
                    typeof options.floating === 'object' &&
                    options.floating !== null
                        ? options.floating
                        : {};

                this.addFloatingGroup(group, {
                    ...floatingGroupOptions,
                    inDragMode: false,
                    skipRemoveGroup: true,
                    skipActiveGroup: true,
                });

                panel = this.createPanel(options, group);

                group.model.openPanel(panel, {
                    skipSetActive: options.inactive,
                    skipSetGroupActive: options.inactive,
                    index,
                });
            } else if (
                referenceGroup.api.location.type === 'floating' ||
                target === 'center'
            ) {
                panel = this.createPanel(options, referenceGroup);
                referenceGroup.model.openPanel(panel, {
                    skipSetActive: options.inactive,
                    skipSetGroupActive: options.inactive,
                    index,
                });

                referenceGroup.api.setSize({
                    width: initial?.width,
                    height: initial?.height,
                });

                if (!options.inactive) {
                    this.doSetGroupAndPanelActive(referenceGroup);
                }
            } else {
                const location = getGridLocation(referenceGroup.element);
                const relativeLocation = getRelativeLocation(
                    this.gridview.orientation,
                    location,
                    target
                );
                const group = this.createGroupAtLocation(
                    relativeLocation,
                    this.orientationAtLocation(relativeLocation) ===
                        Orientation.VERTICAL
                        ? initial?.height
                        : initial?.width
                );
                panel = this.createPanel(options, group);
                group.model.openPanel(panel, {
                    skipSetActive: options.inactive,
                    skipSetGroupActive: options.inactive,
                    index,
                });

                if (!options.inactive) {
                    this.doSetGroupAndPanelActive(group);
                }
            }
        } else if (options.floating) {
            const group = this.createGroup();
            this._onDidAddGroup.fire(group);

            const coordinates =
                typeof options.floating === 'object' &&
                options.floating !== null
                    ? options.floating
                    : {};

            this.addFloatingGroup(group, {
                ...coordinates,
                inDragMode: false,
                skipRemoveGroup: true,
                skipActiveGroup: true,
            });

            panel = this.createPanel(options, group);
            group.model.openPanel(panel, {
                skipSetActive: options.inactive,
                skipSetGroupActive: options.inactive,
                index,
            });
        } else {
            const group = this.createGroupAtLocation(
                [0],
                this.gridview.orientation === Orientation.VERTICAL
                    ? initial?.height
                    : initial?.width
            );
            panel = this.createPanel(options, group);
            group.model.openPanel(panel, {
                skipSetActive: options.inactive,
                skipSetGroupActive: options.inactive,
                index,
            });

            if (!options.inactive) {
                this.doSetGroupAndPanelActive(group);
            }
        }

        return panel;
    }

    removePanel(
        panel: IDockviewPanel,
        options: {
            removeEmptyGroup: boolean;
            skipDispose?: boolean;
            skipSetActiveGroup?: boolean;
        } = {
            removeEmptyGroup: true,
        }
    ): void {
        const group = panel.group;

        if (!group) {
            throw new Error(
                `cannot remove panel ${panel.id}. it's missing a group.`
            );
        }

        group.model.removePanel(panel, {
            skipSetActiveGroup: options.skipSetActiveGroup,
        });

        if (!options.skipDispose) {
            panel.group.model.renderContainer.detatch(panel);
            panel.dispose();
        }

        if (group.size === 0 && options.removeEmptyGroup) {
            this.removeGroup(group, { skipActive: options.skipSetActiveGroup });
        }
    }

    createWatermarkComponent(): IWatermarkRenderer {
        if (this.options.createWatermarkComponent) {
            return this.options.createWatermarkComponent();
        }
        return new Watermark();
    }

    private updateWatermark(): void {
        if (
            this.groups.filter(
                (x) => x.api.location.type === 'grid' && x.api.isVisible
            ).length === 0
        ) {
            if (!this._watermark) {
                this._watermark = this.createWatermarkComponent();

                this._watermark.init({
                    containerApi: new DockviewApi(this),
                });

                const watermarkContainer = document.createElement('div');
                watermarkContainer.className = 'dv-watermark-container';
                addTestId(watermarkContainer, 'watermark-component');
                watermarkContainer.appendChild(this._watermark.element);

                this.gridview.element.appendChild(watermarkContainer);
            }
        } else if (this._watermark) {
            this._watermark.element.parentElement!.remove();
            this._watermark.dispose?.();
            this._watermark = null;
        }
    }

    addGroup(options?: AddGroupOptions): DockviewGroupPanel {
        if (options) {
            let referenceGroup: DockviewGroupPanel | undefined;

            if (isGroupOptionsWithPanel(options)) {
                const referencePanel =
                    typeof options.referencePanel === 'string'
                        ? this.panels.find(
                              (panel) => panel.id === options.referencePanel
                          )
                        : options.referencePanel;

                if (!referencePanel) {
                    throw new Error(
                        `reference panel ${options.referencePanel} does not exist`
                    );
                }

                referenceGroup = this.findGroup(referencePanel);

                if (!referenceGroup) {
                    throw new Error(
                        `reference group for reference panel ${options.referencePanel} does not exist`
                    );
                }
            } else if (isGroupOptionsWithGroup(options)) {
                referenceGroup =
                    typeof options.referenceGroup === 'string'
                        ? this._groups.get(options.referenceGroup)?.value
                        : options.referenceGroup;

                if (!referenceGroup) {
                    throw new Error(
                        `reference group ${options.referenceGroup} does not exist`
                    );
                }
            } else {
                const group = this.orthogonalize(
                    directionToPosition(<Direction>options.direction)
                );
                if (!options.skipSetActive) {
                    this.doSetGroupAndPanelActive(group);
                }
                return group;
            }

            const target = toTarget(<Direction>options.direction || 'within');

            const location = getGridLocation(referenceGroup.element);
            const relativeLocation = getRelativeLocation(
                this.gridview.orientation,
                location,
                target
            );

            const group = this.createGroup(options);
            const size =
                this.getLocationOrientation(relativeLocation) ===
                Orientation.VERTICAL
                    ? options.initialHeight
                    : options.initialWidth;
            this.doAddGroup(group, relativeLocation, size);
            if (!options.skipSetActive) {
                this.doSetGroupAndPanelActive(group);
            }
            return group;
        } else {
            const group = this.createGroup(options);

            this.doAddGroup(group);
            this.doSetGroupAndPanelActive(group);
            return group;
        }
    }

    private getLocationOrientation(location: number[]) {
        return location.length % 2 == 0 &&
            this.gridview.orientation === Orientation.HORIZONTAL
            ? Orientation.HORIZONTAL
            : Orientation.VERTICAL;
    }

    removeGroup(
        group: DockviewGroupPanel,
        options?:
            | {
                  skipActive?: boolean;
                  skipDispose?: boolean;
                  skipPopoutAssociated?: boolean;
                  skipPopoutReturn?: boolean;
              }
            | undefined
    ): void {
        this.doRemoveGroup(group, options);
    }

    protected override doRemoveGroup(
        group: DockviewGroupPanel,
        options?:
            | {
                  skipActive?: boolean;
                  skipDispose?: boolean;
                  skipPopoutAssociated?: boolean;
                  skipPopoutReturn?: boolean;
              }
            | undefined
    ): DockviewGroupPanel {
        const panels = [...group.panels]; // reassign since group panels will mutate

        if (!options?.skipDispose) {
            for (const panel of panels) {
                this.removePanel(panel, {
                    removeEmptyGroup: false,
                    skipDispose: options?.skipDispose ?? false,
                });
            }
        }

        const activePanel = this.activePanel;

        if (group.api.location.type === 'floating') {
            const floatingGroup = this._floatingGroups.find(
                (_) => _.group === group
            );

            if (floatingGroup) {
                if (!options?.skipDispose) {
                    floatingGroup.group.dispose();
                    this._groups.delete(group.id);
                    this._onDidRemoveGroup.fire(group);
                }

                remove(this._floatingGroups, floatingGroup);
                floatingGroup.dispose();

                if (!options?.skipActive && this._activeGroup === group) {
                    const groups = Array.from(this._groups.values());

                    this.doSetGroupAndPanelActive(
                        groups.length > 0 ? groups[0].value : undefined
                    );
                }

                return floatingGroup.group;
            }

            throw new Error('failed to find floating group');
        }

        if (group.api.location.type === 'popout') {
            const selectedGroup = this._popoutGroups.find(
                (_) => _.popoutGroup === group
            );

            if (selectedGroup) {
                if (!options?.skipDispose) {
                    if (!options?.skipPopoutAssociated) {
                        const refGroup = selectedGroup.referenceGroup
                            ? this.getPanel(selectedGroup.referenceGroup)
                            : undefined;
                        if (refGroup && refGroup.panels.length === 0) {
                            this.removeGroup(refGroup);
                        }
                    }

                    selectedGroup.popoutGroup.dispose();

                    this._groups.delete(group.id);
                    this._onDidRemoveGroup.fire(group);
                }

                remove(this._popoutGroups, selectedGroup);

                const removedGroup = selectedGroup.disposable.dispose();

                if (!options?.skipPopoutReturn && removedGroup) {
                    this.doAddGroup(removedGroup, [0]);
                    this.doSetGroupAndPanelActive(removedGroup);
                }

                if (!options?.skipActive && this._activeGroup === group) {
                    const groups = Array.from(this._groups.values());

                    this.doSetGroupAndPanelActive(
                        groups.length > 0 ? groups[0].value : undefined
                    );
                }

                this.updateWatermark();
                return selectedGroup.popoutGroup;
            }

            throw new Error('failed to find popout group');
        }

        const re = super.doRemoveGroup(group, options);

        if (!options?.skipActive) {
            if (this.activePanel !== activePanel) {
                this._onDidActivePanelChange.fire(this.activePanel);
            }
        }

        return re;
    }

    private _moving = false;

    movingLock<T>(func: () => T): T {
        const isMoving = this._moving;

        try {
            this._moving = true;
            return func();
        } finally {
            this._moving = isMoving;
        }
    }

    moveGroupOrPanel(options: MoveGroupOrPanelOptions): void {
        const destinationGroup = options.to.group;
        const sourceGroupId = options.from.groupId;
        const sourceItemId = options.from.panelId;
        const destinationTarget = options.to.position;
        const destinationIndex = options.to.index;

        const sourceGroup = sourceGroupId
            ? this._groups.get(sourceGroupId)?.value
            : undefined;

        if (!sourceGroup) {
            throw new Error(`Failed to find group id ${sourceGroupId}`);
        }

        if (sourceItemId === undefined) {
            /**
             * Moving an entire group into another group
             */

            this.moveGroup({
                from: { group: sourceGroup },
                to: {
                    group: destinationGroup,
                    position: destinationTarget,
                },
            });
            return;
        }

        if (!destinationTarget || destinationTarget === 'center') {
            /**
             * Dropping a panel within another group
             */

            const removedPanel: IDockviewPanel | undefined = this.movingLock(
                () =>
                    sourceGroup.model.removePanel(sourceItemId, {
                        skipSetActive: false,
                        skipSetActiveGroup: true,
                    })
            );

            if (!removedPanel) {
                throw new Error(`No panel with id ${sourceItemId}`);
            }

            if (sourceGroup.model.size === 0) {
                // remove the group and do not set a new group as active
                this.doRemoveGroup(sourceGroup, { skipActive: true });
            }

            this.movingLock(() =>
                destinationGroup.model.openPanel(removedPanel, {
                    index: destinationIndex,
                    skipSetGroupActive: true,
                })
            );
            this.doSetGroupAndPanelActive(destinationGroup);

            this._onDidMovePanel.fire({
                panel: removedPanel,
                from: sourceGroup,
            });
        } else {
            /**
             * Dropping a panel to the extremities of a group which will place that panel
             * into an adjacent group
             */

            const referenceLocation = getGridLocation(destinationGroup.element);
            const targetLocation = getRelativeLocation(
                this.gridview.orientation,
                referenceLocation,
                destinationTarget
            );

            if (sourceGroup.size < 2) {
                /**
                 * If we are moving from a group which only has one panel left we will consider
                 * moving the group itself rather than moving the panel into a newly created group
                 */

                const [targetParentLocation, to] = tail(targetLocation);

                if (sourceGroup.api.location.type === 'grid') {
                    const sourceLocation = getGridLocation(sourceGroup.element);
                    const [sourceParentLocation, from] = tail(sourceLocation);

                    if (
                        sequenceEquals(
                            sourceParentLocation,
                            targetParentLocation
                        )
                    ) {
                        // special case when 'swapping' two views within same grid location
                        // if a group has one tab - we are essentially moving the 'group'
                        // which is equivalent to swapping two views in this case
                        this.gridview.moveView(sourceParentLocation, from, to);

                        this._onDidMovePanel.fire({
                            panel: this.getGroupPanel(sourceItemId)!,
                            from: sourceGroup,
                        });

                        return;
                    }
                }

                if (sourceGroup.api.location.type === 'popout') {
                    /**
                     * the source group is a popout group with a single panel
                     *
                     * 1. remove the panel from the group without triggering any events
                     * 2. remove the popout group
                     * 3. create a new group at the requested location and add that panel
                     */

                    const popoutGroup = this._popoutGroups.find(
                        (group) => group.popoutGroup === sourceGroup
                    )!;

                    const removedPanel: IDockviewPanel | undefined =
                        this.movingLock(() =>
                            popoutGroup.popoutGroup.model.removePanel(
                                popoutGroup.popoutGroup.panels[0],
                                {
                                    skipSetActive: true,
                                    skipSetActiveGroup: true,
                                }
                            )
                        );

                    this.doRemoveGroup(sourceGroup, { skipActive: true });

                    const newGroup = this.createGroupAtLocation(targetLocation);
                    this.movingLock(() =>
                        newGroup.model.openPanel(removedPanel)
                    );
                    this.doSetGroupAndPanelActive(newGroup);

                    this._onDidMovePanel.fire({
                        panel: this.getGroupPanel(sourceItemId)!,
                        from: sourceGroup,
                    });
                    return;
                }

                // source group will become empty so delete the group
                const targetGroup = this.movingLock(() =>
                    this.doRemoveGroup(sourceGroup, {
                        skipActive: true,
                        skipDispose: true,
                    })
                );

                // after deleting the group we need to re-evaulate the ref location
                const updatedReferenceLocation = getGridLocation(
                    destinationGroup.element
                );

                const location = getRelativeLocation(
                    this.gridview.orientation,
                    updatedReferenceLocation,
                    destinationTarget
                );
                this.movingLock(() => this.doAddGroup(targetGroup, location));
                this.doSetGroupAndPanelActive(targetGroup);

                this._onDidMovePanel.fire({
                    panel: this.getGroupPanel(sourceItemId)!,
                    from: sourceGroup,
                });
            } else {
                /**
                 * The group we are removing from has many panels, we need to remove the panels we are moving,
                 * create a new group, add the panels to that new group and add the new group in an appropiate position
                 */
                const removedPanel: IDockviewPanel | undefined =
                    this.movingLock(() =>
                        sourceGroup.model.removePanel(sourceItemId, {
                            skipSetActive: false,
                            skipSetActiveGroup: true,
                        })
                    );

                if (!removedPanel) {
                    throw new Error(`No panel with id ${sourceItemId}`);
                }

                const dropLocation = getRelativeLocation(
                    this.gridview.orientation,
                    referenceLocation,
                    destinationTarget
                );

                const group = this.createGroupAtLocation(dropLocation);
                this.movingLock(() =>
                    group.model.openPanel(removedPanel, {
                        skipSetGroupActive: true,
                    })
                );
                this.doSetGroupAndPanelActive(group);

                this._onDidMovePanel.fire({
                    panel: removedPanel,
                    from: sourceGroup,
                });
            }
        }
    }

    moveGroup(options: MoveGroupOptions): void {
        const from = options.from.group;
        const to = options.to.group;
        const target = options.to.position;

        if (target === 'center') {
            const activePanel = from.activePanel;

            const panels = this.movingLock(() =>
                [...from.panels].map((p) =>
                    from.model.removePanel(p.id, {
                        skipSetActive: true,
                    })
                )
            );

            if (from?.model.size === 0) {
                this.doRemoveGroup(from, { skipActive: true });
            }

            this.movingLock(() => {
                for (const panel of panels) {
                    to.model.openPanel(panel, {
                        skipSetActive: panel !== activePanel,
                        skipSetGroupActive: true,
                    });
                }
            });

            this.doSetGroupAndPanelActive(to);
        } else {
            switch (from.api.location.type) {
                case 'grid':
                    this.gridview.removeView(getGridLocation(from.element));
                    break;
                case 'floating': {
                    const selectedFloatingGroup = this._floatingGroups.find(
                        (x) => x.group === from
                    );
                    if (!selectedFloatingGroup) {
                        throw new Error('failed to find floating group');
                    }
                    selectedFloatingGroup.dispose();
                    break;
                }
                case 'popout': {
                    const selectedPopoutGroup = this._popoutGroups.find(
                        (x) => x.popoutGroup === from
                    );
                    if (!selectedPopoutGroup) {
                        throw new Error('failed to find popout group');
                    }
                    selectedPopoutGroup.disposable.dispose();
                }
            }

            const referenceLocation = getGridLocation(to.element);
            const dropLocation = getRelativeLocation(
                this.gridview.orientation,
                referenceLocation,
                target
            );

            let size: number;

            switch (this.gridview.orientation) {
                case Orientation.VERTICAL:
                    size =
                        referenceLocation.length % 2 == 0
                            ? from.api.width
                            : from.api.height;
                    break;
                case Orientation.HORIZONTAL:
                    size =
                        referenceLocation.length % 2 == 0
                            ? from.api.height
                            : from.api.width;
                    break;
            }

            this.gridview.addView(from, size, dropLocation);
        }

        from.panels.forEach((panel) => {
            this._onDidMovePanel.fire({ panel, from });
        });
    }

    override doSetGroupActive(group: DockviewGroupPanel | undefined): void {
        super.doSetGroupActive(group);

        const activePanel = this.activePanel;

        if (
            !this._moving &&
            activePanel !== this._onDidActivePanelChange.value
        ) {
            this._onDidActivePanelChange.fire(activePanel);
        }
    }

    doSetGroupAndPanelActive(group: DockviewGroupPanel | undefined): void {
        super.doSetGroupActive(group);

        const activePanel = this.activePanel;

        if (
            group &&
            this.hasMaximizedGroup() &&
            !this.isMaximizedGroup(group)
        ) {
            this.exitMaximizedGroup();
        }

        if (
            !this._moving &&
            activePanel !== this._onDidActivePanelChange.value
        ) {
            this._onDidActivePanelChange.fire(activePanel);
        }
    }

    private getNextGroupId(): string {
        let id = this.nextGroupId.next();
        while (this._groups.has(id)) {
            id = this.nextGroupId.next();
        }

        return id;
    }

    createGroup(options?: GroupOptions): DockviewGroupPanel {
        if (!options) {
            options = {};
        }

        let id = options?.id;

        if (id && this._groups.has(options.id!)) {
            console.warn(
                `dockview: Duplicate group id ${options?.id}. reassigning group id to avoid errors`
            );
            id = undefined;
        }

        if (!id) {
            id = this.nextGroupId.next();
            while (this._groups.has(id)) {
                id = this.nextGroupId.next();
            }
        }

        const view = new DockviewGroupPanel(this, id, options);
        view.init({ params: {}, accessor: this });

        if (!this._groups.has(view.id)) {
            const disposable = new CompositeDisposable(
                view.model.onTabDragStart((event) => {
                    this._onWillDragPanel.fire(event);
                }),
                view.model.onGroupDragStart((event) => {
                    this._onWillDragGroup.fire(event);
                }),
                view.model.onMove((event) => {
                    const { groupId, itemId, target, index } = event;
                    this.moveGroupOrPanel({
                        from: { groupId: groupId, panelId: itemId },
                        to: {
                            group: view,
                            position: target,
                            index,
                        },
                    });
                }),
                view.model.onDidDrop((event) => {
                    this._onDidDrop.fire(event);
                }),
                view.model.onWillDrop((event) => {
                    this._onWillDrop.fire(event);
                }),
                view.model.onWillShowOverlay((event) => {
                    if (this.options.disableDnd) {
                        event.preventDefault();
                        return;
                    }

                    this._onWillShowOverlay.fire(event);
                }),
                view.model.onUnhandledDragOverEvent((event) => {
                    this._onUnhandledDragOverEvent.fire(event);
                }),
                view.model.onDidAddPanel((event) => {
                    if (this._moving) {
                        return;
                    }
                    this._onDidAddPanel.fire(event.panel);
                }),
                view.model.onDidRemovePanel((event) => {
                    if (this._moving) {
                        return;
                    }
                    this._onDidRemovePanel.fire(event.panel);
                }),
                view.model.onDidActivePanelChange((event) => {
                    if (this._moving) {
                        return;
                    }

                    if (event.panel !== this.activePanel) {
                        return;
                    }

                    if (this._onDidActivePanelChange.value !== event.panel) {
                        this._onDidActivePanelChange.fire(event.panel);
                    }
                }),
                Event.any(
                    view.model.onDidPanelTitleChange,
                    view.model.onDidPanelParametersChange
                )(() => {
                    this._bufferOnDidLayoutChange.fire();
                })
            );

            this._groups.set(view.id, { value: view, disposable });
        }

        // TODO: must be called after the above listeners have been setup, not an ideal pattern
        view.initialize();

        return view;
    }

    private createPanel(
        options: AddPanelOptions,
        group: DockviewGroupPanel
    ): DockviewPanel {
        const contentComponent = options.component;
        const tabComponent =
            options.tabComponent ?? this.options.defaultTabComponent;

        const view = new DockviewPanelModel(
            this,
            options.id,
            contentComponent,
            tabComponent
        );

        const panel = new DockviewPanel(
            options.id,
            contentComponent,
            tabComponent,
            this,
            this._api,
            group,
            view,
            {
                renderer: options.renderer,
                minimumWidth: options.minimumWidth,
                minimumHeight: options.minimumHeight,
                maximumWidth: options.maximumWidth,
                maximumHeight: options.maximumHeight,
            }
        );

        panel.init({
            title: options.title ?? options.id,
            params: options?.params ?? {},
        });

        return panel;
    }

    private createGroupAtLocation(
        location: number[],
        size?: number
    ): DockviewGroupPanel {
        const group = this.createGroup();
        this.doAddGroup(group, location, size);
        return group;
    }

    private findGroup(panel: IDockviewPanel): DockviewGroupPanel | undefined {
        return Array.from(this._groups.values()).find((group) =>
            group.value.model.containsPanel(panel)
        )?.value;
    }

    private orientationAtLocation(location: number[]) {
        const rootOrientation = this.gridview.orientation;
        return location.length % 2 == 1
            ? rootOrientation
            : orthogonal(rootOrientation);
    }

    private updateDropTargetModel(options: Partial<DockviewComponentOptions>) {
        if ('dndEdges' in options) {
            this._rootDropTarget.disabled =
                typeof options.dndEdges === 'boolean' &&
                options.dndEdges === false;

            if (
                typeof options.dndEdges === 'object' &&
                options.dndEdges !== null
            ) {
                this._rootDropTarget.setOverlayModel(options.dndEdges);
            } else {
                this._rootDropTarget.setOverlayModel(
                    DEFAULT_ROOT_OVERLAY_MODEL
                );
            }
        }

        if ('rootOverlayModel' in options) {
            this.updateDropTargetModel({ dndEdges: options.dndEdges });
        }
    }

    private updateTheme(): void {
        const theme = this._options.theme ?? themeAbyss;
        this._themeClassnames.setClassNames(theme.className);

        this.gridview.margin = theme.gap ?? 0;

        switch (theme.dndOverlayMounting) {
            case 'absolute':
                this.rootDropTargetContainer.disabled = false;
                break;
            case 'relative':
            default:
                this.rootDropTargetContainer.disabled = true;
                break;
        }
    }
}
