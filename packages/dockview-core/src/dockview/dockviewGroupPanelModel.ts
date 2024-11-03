import { DockviewApi } from '../api/component.api';
import { getPanelData, PanelTransfer } from '../dnd/dataTransfer';
import { Position, WillShowOverlayEvent } from '../dnd/droptarget';
import { DockviewComponent } from './dockviewComponent';
import { isAncestor, toggleClass } from '../dom';
import {
    addDisposableListener,
    DockviewEvent,
    Emitter,
    Event,
    IDockviewEvent,
} from '../events';
import { IViewSize } from '../gridview/gridview';
import { CompositeDisposable, IDisposable } from '../lifecycle';
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
} from './options';
import { OverlayRenderContainer } from '../overlay/overlayRenderContainer';
import { TitleEvent } from '../api/dockviewPanelApi';
import { Contraints } from '../gridview/gridviewPanel';

interface GroupMoveEvent {
    groupId: string;
    itemId?: string;
    target: Position;
    index?: number;
}

interface CoreGroupOptions {
    locked?: DockviewGroupPanelLocked;
    hideHeader?: boolean;
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
}

export type DockviewGroupPanelLocked = boolean | 'no-drop-target';

export type DockviewGroupDropLocation =
    | 'tab'
    | 'header_space'
    | 'content'
    | 'edge';

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
    | { type: 'popout'; getWindow: () => Window };

export class WillShowOverlayLocationEvent implements IDockviewEvent {
    get kind(): DockviewGroupDropLocation {
        return this.options.kind;
    }

    get nativeEvent(): DragEvent {
        return this.event.nativeEvent;
    }

    get position(): Position {
        return this.event.position;
    }

    get defaultPrevented(): boolean {
        return this.event.defaultPrevented;
    }

    get panel(): IDockviewPanel | undefined {
        return this.options.panel;
    }

    get api(): DockviewApi {
        return this.options.api;
    }

    get group(): DockviewGroupPanel | undefined {
        return this.options.group;
    }

    preventDefault(): void {
        this.event.preventDefault();
    }

    getData(): PanelTransfer | undefined {
        return this.options.getData();
    }

    constructor(
        private readonly event: WillShowOverlayEvent,
        private readonly options: {
            kind: DockviewGroupDropLocation;
            panel: IDockviewPanel | undefined;
            api: DockviewApi;
            group: DockviewGroupPanel | undefined;
            getData: () => PanelTransfer | undefined;
        }
    ) {}
}

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

    private _location: DockviewGroupLocation = { type: 'grid' };

    private mostRecentlyUsed: IDockviewPanel[] = [];
    private _overwriteRenderContainer: OverlayRenderContainer | null = null;

    private readonly _onDidChange = new Emitter<IViewSize | undefined>();
    readonly onDidChange: Event<IViewSize | undefined> =
        this._onDidChange.event;

    private _width = 0;
    private _height = 0;

    private readonly _panels: IDockviewPanel[] = [];
    private readonly _panelDisposables = new Map<string, IDisposable>();

    private readonly _onMove = new Emitter<GroupMoveEvent>();
    readonly onMove: Event<GroupMoveEvent> = this._onMove.event;

    private readonly _onDidDrop = new Emitter<DockviewDidDropEvent>();
    readonly onDidDrop: Event<DockviewDidDropEvent> = this._onDidDrop.event;

    private readonly _onWillDrop = new Emitter<DockviewWillDropEvent>();
    readonly onWillDrop: Event<DockviewWillDropEvent> = this._onWillDrop.event;

    private readonly _onWillShowOverlay =
        new Emitter<WillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<WillShowOverlayLocationEvent> =
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

    private readonly _api: DockviewApi;

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

    get location(): DockviewGroupLocation {
        return this._location;
    }

    set location(value: DockviewGroupLocation) {
        this._location = value;

        toggleClass(this.container, 'dv-groupview-floating', false);
        toggleClass(this.container, 'dv-groupview-popout', false);

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

        this.addDisposables(
            this._onTabDragStart,
            this._onGroupDragStart,
            this._onWillShowOverlay,
            this.tabsContainer.onTabDragStart((event) => {
                this._onTabDragStart.fire(event);
            }),
            this.tabsContainer.onGroupDragStart((event) => {
                this._onGroupDragStart.fire(event);
            }),
            this.tabsContainer.onDrop((event) => {
                this.handleDropEvent(
                    'header',
                    event.event,
                    'center',
                    event.index
                );
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
                    new WillShowOverlayLocationEvent(event, {
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
            this._onUnhandledDragOverEvent
        );
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

        if (this.accessor.options.createRightHeaderActionComponent) {
            this._rightHeaderActions =
                this.accessor.options.createRightHeaderActionComponent(
                    this.groupPanel
                );
            this.addDisposables(this._rightHeaderActions);
            this._rightHeaderActions.init({
                containerApi: this._api,
                api: this.groupPanel.api,
                group: this.groupPanel,
            });
            this.tabsContainer.setRightActionsElement(
                this._rightHeaderActions.element
            );
        }

        if (this.accessor.options.createLeftHeaderActionComponent) {
            this._leftHeaderActions =
                this.accessor.options.createLeftHeaderActionComponent(
                    this.groupPanel
                );
            this.addDisposables(this._leftHeaderActions);
            this._leftHeaderActions.init({
                containerApi: this._api,
                api: this.groupPanel.api,
                group: this.groupPanel,
            });
            this.tabsContainer.setLeftActionsElement(
                this._leftHeaderActions.element
            );
        }

        if (this.accessor.options.createPrefixHeaderActionComponent) {
            this._prefixHeaderActions =
                this.accessor.options.createPrefixHeaderActionComponent(
                    this.groupPanel
                );
            this.addDisposables(this._prefixHeaderActions);
            this._prefixHeaderActions.init({
                containerApi: this._api,
                api: this.groupPanel.api,
                group: this.groupPanel,
            });
            this.tabsContainer.setPrefixActionsElement(
                this._prefixHeaderActions.element
            );
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
        this.accessor.removePanel(panel);
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

            panel.layout(this._width, this._height);

            this.updateMru(panel);

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
        toggleClass(this.container, 'dv-empty', this.isEmpty);

        this.panels.forEach((panel) => panel.runEvents());

        if (this.isEmpty && !this.watermark) {
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

            this.tabsContainer.hide();
            this.contentContainer.element.appendChild(this.watermark.element);
        }
        if (!this.isEmpty && this.watermark) {
            this.watermark.element.remove();
            this.watermark.dispose?.();
            this.watermark = undefined;
            this.tabsContainer.show();
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

    public dispose(): void {
        super.dispose();

        this.watermark?.element.remove();
        this.watermark?.dispose?.();
        this.watermark = undefined;

        for (const panel of this.panels) {
            panel.dispose();
        }

        this.tabsContainer.dispose();
        this.contentContainer.dispose();
    }
}
