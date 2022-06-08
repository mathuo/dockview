import { DockviewApi } from '../api/component.api';
import { getPanelData, PanelTransfer } from '../dnd/dataTransfer';
import { Droptarget, Position } from '../dnd/droptarget';
import { DockviewComponent } from '../dockview/dockviewComponent';
import { isAncestor, toggleClass } from '../dom';
import { addDisposableListener, Emitter, Event } from '../events';
import { IGridPanelView } from '../gridview/baseComponentGridview';
import { IViewSize } from '../gridview/gridview';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { PanelInitParameters, PanelUpdateEvent } from '../panel/types';
import { IDockviewPanel } from './groupPanel';
import { ContentContainer, IContentContainer } from './panel/content';
import { ITabsContainer, TabsContainer } from './titlebar/tabsContainer';
import { IWatermarkRenderer } from './types';
import { GroupPanel } from './groupviewPanel';
import { DockviewDropTargets } from './dnd';

export enum GroupChangeKind2 {
    ADD_PANEL = 'ADD_PANEL',
    REMOVE_PANEL = 'REMOVE_PANEL',
    PANEL_ACTIVE = 'PANEL_ACTIVE',
}

export interface DndService {
    canDisplayOverlay(
        group: IGroupview,
        event: DragEvent,
        target: DockviewDropTargets
    ): boolean;
    onDrop(
        group: IGroupview,
        event: DragEvent,
        position: Position,
        index?: number
    ): void;
}

export interface IGroupItem {
    id: string;
    header: { element: HTMLElement };
    body: { element: HTMLElement };
}

interface GroupMoveEvent {
    groupId: string;
    itemId: string;
    target: Position;
    index?: number;
}

interface CoreGroupOptions {
    locked?: boolean;
    hideHeader?: boolean;
}

export interface GroupOptions extends CoreGroupOptions {
    readonly panels?: IDockviewPanel[];
    readonly activePanel?: IDockviewPanel;
    readonly id?: string;
    tabHeight?: number;
}

export interface GroupPanelViewState extends CoreGroupOptions {
    views: string[];
    activeView?: string;
    id: string;
}

export interface GroupviewChangeEvent {
    readonly kind: GroupChangeKind2;
    readonly panel?: IDockviewPanel;
}

export interface GroupviewDropEvent {
    nativeEvent: DragEvent;
    position: Position;
    getData(): PanelTransfer | undefined;
    index?: number;
}

export interface IHeader {
    hidden: boolean;
    height: number | undefined;
}

export interface IGroupview extends IDisposable, IGridPanelView {
    readonly isActive: boolean;
    readonly size: number;
    readonly panels: IDockviewPanel[];
    readonly activePanel: IDockviewPanel | undefined;
    readonly header: IHeader;
    readonly isContentFocused: boolean;
    readonly onDidDrop: Event<GroupviewDropEvent>;
    readonly onDidGroupChange: Event<GroupviewChangeEvent>;
    readonly onMove: Event<GroupMoveEvent>;
    locked: boolean;
    // state
    isPanelActive: (panel: IDockviewPanel) => boolean;
    indexOf(panel: IDockviewPanel): number;
    // panel lifecycle
    openPanel(
        panel: IDockviewPanel,
        options?: { index?: number; skipFocus?: boolean }
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
    canDisplayOverlay(event: DragEvent, target: DockviewDropTargets): boolean;
}

export class Groupview extends CompositeDisposable implements IGroupview {
    private readonly tabsContainer: ITabsContainer;
    private readonly contentContainer: IContentContainer;
    private readonly dropTarget: Droptarget;
    private _activePanel?: IDockviewPanel;
    private watermark?: IWatermarkRenderer;
    private _isGroupActive = false;
    private _locked = false;

    private mostRecentlyUsed: IDockviewPanel[] = [];

    private readonly _onDidChange = new Emitter<IViewSize | undefined>();
    readonly onDidChange: Event<IViewSize | undefined> =
        this._onDidChange.event;

    private _width = 0;
    private _height = 0;

    private _panels: IDockviewPanel[] = [];

    private readonly _onMove = new Emitter<GroupMoveEvent>();
    readonly onMove: Event<GroupMoveEvent> = this._onMove.event;

    private readonly _onDidGroupChange = new Emitter<GroupviewChangeEvent>();
    readonly onDidGroupChange: Event<GroupviewChangeEvent> =
        this._onDidGroupChange.event;

    private readonly _onDidDrop = new Emitter<GroupviewDropEvent>();
    readonly onDidDrop: Event<GroupviewDropEvent> = this._onDidDrop.event;

    get element(): HTMLElement {
        throw new Error('not supported');
    }

    get activePanel(): IDockviewPanel | undefined {
        return this._activePanel;
    }

    get locked(): boolean {
        return this._locked;
    }

    set locked(value: boolean) {
        this._locked = value;
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

    get minimumHeight(): number {
        return 100;
    }

    get maximumHeight(): number {
        return Number.MAX_SAFE_INTEGER;
    }

    get minimumWidth(): number {
        return 100;
    }

    get maximumWidth(): number {
        return Number.MAX_SAFE_INTEGER;
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

    constructor(
        private readonly container: HTMLElement,
        private accessor: DockviewComponent,
        public id: string,
        private readonly options: GroupOptions,
        private readonly parent: GroupPanel
    ) {
        super();

        this.container.classList.add('groupview');

        this.addDisposables(
            this._onMove,
            this._onDidGroupChange,
            this._onDidChange,
            this._onDidDrop
        );

        this.tabsContainer = new TabsContainer(this.accessor, this.parent, {
            tabHeight: options.tabHeight,
        });
        this.contentContainer = new ContentContainer();

        this.dropTarget = new Droptarget(this.contentContainer.element, {
            validOverlays: 'all',
            canDisplayOverlay: (event, quadrant) => {
                if (this.locked && !quadrant) {
                    return false;
                }

                const data = getPanelData();

                if (data && data.viewId === this.accessor.id) {
                    const groupHasOnePanelAndIsActiveDragElement =
                        this._panels.length === 1 && data.groupId === this.id;

                    return !groupHasOnePanelAndIsActiveDragElement;
                }

                return this.canDisplayOverlay(event, DockviewDropTargets.Panel);
            },
        });

        container.append(
            this.tabsContainer.element,
            this.contentContainer.element
        );

        this.header.hidden = !!options.hideHeader;
        this.locked = !!options.locked;

        this.addDisposables(
            this._onMove,
            this._onDidGroupChange,
            this.tabsContainer.onDrop((event) => {
                this.handleDropEvent(event.event, Position.Center, event.index);
            }),
            this.contentContainer.onDidFocus(() => {
                this.accessor.doSetGroupActive(this.parent, true);
            }),
            this.contentContainer.onDidBlur(() => {
                // noop
            }),
            this.dropTarget.onDrop((event) => {
                this.handleDropEvent(event.nativeEvent, event.position);
            })
        );
    }

    initialize() {
        if (this.options?.panels) {
            this.options.panels.forEach((panel) => {
                this.doAddPanel(panel);
            });
        }

        if (this.options?.activePanel) {
            this.openPanel(this.options.activePanel);
        }

        // must be run after the constructor otherwise this.parent may not be
        // correctly initialized
        this.setActive(this.isActive, true, true);
        this.updateContainer();
    }

    public indexOf(panel: IDockviewPanel) {
        return this.tabsContainer.indexOf(panel.id);
    }

    public toJSON(): GroupPanelViewState {
        const result: GroupPanelViewState = {
            views: this.tabsContainer.panels,
            activeView: this._activePanel?.id,
            id: this.id,
        };

        if (this.locked) {
            result.locked = true;
        }

        if (this.header.hidden) {
            result.hideHeader = true;
        }

        return result;
    }

    public moveToNext(options?: {
        panel?: IDockviewPanel;
        suppressRoll?: boolean;
    }) {
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
    }) {
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

    public containsPanel(panel: IDockviewPanel) {
        return this.panels.includes(panel);
    }

    init(_params: PanelInitParameters) {
        //noop
    }

    update(_params: PanelUpdateEvent) {
        //noop
    }

    focus() {
        this._activePanel?.focus();
    }

    public openPanel(
        panel: IDockviewPanel,
        options: {
            index?: number;
            skipFocus?: boolean;
            skipSetPanelActive?: boolean;
            skipSetGroupActive?: boolean;
        } = {}
    ) {
        if (
            typeof options.index !== 'number' ||
            options.index > this.panels.length
        ) {
            options.index = this.panels.length;
        }

        const skipSetPanelActive = !!options.skipSetPanelActive;
        const skipSetGroupActive = !!options.skipSetGroupActive;

        // ensure the group is updated before we fire any events
        panel.updateParentGroup(this.parent, true);

        if (this._activePanel === panel) {
            if (!skipSetGroupActive) {
                this.accessor.doSetGroupActive(this.parent);
            }
            return;
        }

        this.doAddPanel(panel, options.index, skipSetPanelActive);

        if (!skipSetPanelActive) {
            this.doSetActivePanel(panel);
        }

        if (!skipSetGroupActive) {
            this.accessor.doSetGroupActive(this.parent, !!options.skipFocus);
        }

        this.updateContainer();
    }

    public removePanel(groupItemOrId: IDockviewPanel | string): IDockviewPanel {
        const id =
            typeof groupItemOrId === 'string'
                ? groupItemOrId
                : groupItemOrId.id;

        const panelToRemove = this._panels.find((panel) => panel.id === id);

        if (!panelToRemove) {
            throw new Error('invalid operation');
        }

        return this._removePanel(panelToRemove);
    }

    public closeAllPanels() {
        if (this.panels.length > 0) {
            // take a copy since we will be edting the array as we iterate through
            const arrPanelCpy = [...this.panels];
            for (const panel of arrPanelCpy) {
                this.doClose(panel);
            }
        } else {
            this.accessor.removeGroup(this.parent);
        }
    }

    public closePanel(panel: IDockviewPanel): void {
        this.doClose(panel);
    }

    private doClose(panel: IDockviewPanel) {
        this.accessor.removePanel(panel);
    }

    public isPanelActive(panel: IDockviewPanel) {
        return this._activePanel === panel;
    }

    updateActions() {
        if (this.isActive && this._activePanel?.view?.actions) {
            this.tabsContainer.setActionElement(
                this._activePanel.view.actions.element
            );
        } else {
            this.tabsContainer.setActionElement(undefined);
        }
    }

    public setActive(isGroupActive: boolean, skipFocus = false, force = false) {
        if (!force && this.isActive === isGroupActive) {
            if (!skipFocus) {
                this._activePanel?.focus();
            }
            return;
        }

        this._isGroupActive = isGroupActive;

        toggleClass(this.container, 'active-group', isGroupActive);
        toggleClass(this.container, 'inactive-group', !isGroupActive);

        this.tabsContainer.setActive(this.isActive);

        if (!this._activePanel && this.panels.length > 0) {
            this.doSetActivePanel(this.panels[0]);
        }

        this.updateContainer();

        if (isGroupActive) {
            if (!skipFocus) {
                this._activePanel?.focus();
            }
        }
    }

    public layout(width: number, height: number) {
        this._width = width;
        this._height = height;

        this.contentContainer.layout(this._width, this._height);

        if (this._activePanel?.layout) {
            this._activePanel.layout(this._width, this._height);
        }
    }

    private _removePanel(panel: IDockviewPanel) {
        const isActivePanel = this._activePanel === panel;

        this.doRemovePanel(panel);

        if (isActivePanel && this.panels.length > 0) {
            const nextPanel = this.mostRecentlyUsed[0];
            this.openPanel(nextPanel);
        }

        if (this._activePanel && this.panels.length === 0) {
            this.doSetActivePanel(undefined);
        }

        this.updateContainer();
        return panel;
    }

    private doRemovePanel(panel: IDockviewPanel) {
        const index = this.panels.indexOf(panel);

        if (this._activePanel === panel) {
            this.contentContainer.closePanel();
        }

        this.tabsContainer.delete(panel.id);
        this._panels.splice(index, 1);

        if (this.mostRecentlyUsed.includes(panel)) {
            this.mostRecentlyUsed.splice(
                this.mostRecentlyUsed.indexOf(panel),
                1
            );
        }

        this._onDidGroupChange.fire({
            kind: GroupChangeKind2.REMOVE_PANEL,
            panel,
        });
    }

    private doAddPanel(
        panel: IDockviewPanel,
        index: number = this.panels.length,
        skipSetActive = false
    ) {
        const existingPanel = this._panels.indexOf(panel);
        const hasExistingPanel = existingPanel > -1;

        this.tabsContainer.openPanel(panel, index);

        if (!skipSetActive) {
            this.contentContainer.openPanel(panel);
        }

        this.tabsContainer.show();
        this.contentContainer.show();

        if (hasExistingPanel) {
            // TODO - need to ensure ordering hasn't changed and if it has need to re-order this.panels
            return;
        }

        this.updateMru(panel);
        this.panels.splice(index, 0, panel);

        this._onDidGroupChange.fire({
            kind: GroupChangeKind2.ADD_PANEL,
            panel,
        });
    }

    private doSetActivePanel(panel: IDockviewPanel | undefined) {
        this._activePanel = panel;

        if (panel) {
            this.tabsContainer.setActivePanel(panel);

            panel.layout(this._width, this._height);

            this.updateMru(panel);

            this._onDidGroupChange.fire({
                kind: GroupChangeKind2.PANEL_ACTIVE,
                panel,
            });
        }
    }

    private updateMru(panel: IDockviewPanel) {
        if (this.mostRecentlyUsed.includes(panel)) {
            this.mostRecentlyUsed.splice(
                this.mostRecentlyUsed.indexOf(panel),
                1
            );
        }
        this.mostRecentlyUsed = [panel, ...this.mostRecentlyUsed];
    }

    private updateContainer() {
        this.updateActions();
        toggleClass(this.container, 'empty', this.isEmpty);

        this.panels.forEach((panel) =>
            panel.updateParentGroup(this.parent, this.isActive)
        );

        if (this.isEmpty && !this.watermark) {
            const watermark = this.accessor.createWatermarkComponent();
            watermark.init({
                containerApi: new DockviewApi(this.accessor),
                params: {},
                title: '',
                api: null as any,
            });
            this.watermark = watermark;

            addDisposableListener(this.watermark.element, 'click', () => {
                if (!this.isActive) {
                    this.accessor.doSetGroupActive(this.parent);
                }
            });

            this.contentContainer.hide();
            this.tabsContainer.hide();
            this.container.appendChild(this.watermark.element);

            this.watermark.updateParentGroup(this.parent, true);
        }
        if (!this.isEmpty && this.watermark) {
            this.watermark.element.remove();
            this.watermark.dispose();
            this.watermark = undefined;
            this.contentContainer.show();
            this.tabsContainer.show();
        }
    }

    canDisplayOverlay(event: DragEvent, target: DockviewDropTargets): boolean {
        // custom overlay handler
        if (this.accessor.options.showDndOverlay) {
            return this.accessor.options.showDndOverlay({
                nativeEvent: event,
                target,
                group: this.accessor.getPanel(this.id)!,
                getData: getPanelData,
            });
        }
        return false;
    }

    private handleDropEvent(
        event: DragEvent,
        position: Position,
        index?: number
    ) {
        const data = getPanelData();

        if (data) {
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
            this._onDidDrop.fire({
                nativeEvent: event,
                position,
                index,
                getData: () => getPanelData(),
            });
        }
    }

    public dispose() {
        super.dispose();

        this.watermark?.dispose();

        for (const panel of this.panels) {
            panel.dispose();
        }

        this.dropTarget.dispose();
        this.tabsContainer.dispose();
        this.contentContainer.dispose();
    }
}
