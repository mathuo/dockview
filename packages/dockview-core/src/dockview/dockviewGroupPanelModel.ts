import { DockviewApi } from '../api/component.api';
import { getPanelData, PanelTransfer } from '../dnd/dataTransfer';
import { Droptarget, Position } from '../dnd/droptarget';
import { DockviewComponent } from './dockviewComponent';
import { isAncestor, toggleClass } from '../dom';
import { addDisposableListener, Emitter, Event } from '../events';
import { IViewSize } from '../gridview/gridview';
import { CompositeDisposable } from '../lifecycle';
import { IPanel, PanelInitParameters, PanelUpdateEvent } from '../panel/types';
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
import { DockviewDropTargets, IWatermarkRenderer } from './types';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import { IHeaderActionsRenderer } from './options';

export interface DndService {
    canDisplayOverlay(
        group: IDockviewGroupPanelModel,
        event: DragEvent,
        target: DockviewDropTargets
    ): boolean;
    onDrop(
        group: IDockviewGroupPanelModel,
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
    itemId?: string;
    target: Position;
    index?: number;
}

interface CoreGroupOptions {
    locked?: DockviewGroupPanelLocked;
    hideHeader?: boolean;
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

export interface GroupviewChangeEvent {
    readonly panel: IDockviewPanel;
}

export interface GroupviewDropEvent {
    readonly nativeEvent: DragEvent;
    readonly position: Position;
    readonly index?: number;
    getData(): PanelTransfer | undefined;
}

export interface IHeader {
    hidden: boolean;
}

export type DockviewGroupPanelLocked = boolean | 'no-drop-target';

export interface IDockviewGroupPanelModel extends IPanel {
    readonly isActive: boolean;
    readonly size: number;
    readonly panels: IDockviewPanel[];
    readonly activePanel: IDockviewPanel | undefined;
    readonly header: IHeader;
    readonly isContentFocused: boolean;
    readonly onDidDrop: Event<GroupviewDropEvent>;
    readonly onDidAddPanel: Event<GroupviewChangeEvent>;
    readonly onDidRemovePanel: Event<GroupviewChangeEvent>;
    readonly onDidActivePanelChange: Event<GroupviewChangeEvent>;
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
        target: DockviewDropTargets
    ): boolean;
}

export class DockviewGroupPanelModel
    extends CompositeDisposable
    implements IDockviewGroupPanelModel
{
    private readonly tabsContainer: ITabsContainer;
    private readonly contentContainer: IContentContainer;
    private readonly dropTarget: Droptarget;
    private _activePanel: IDockviewPanel | undefined;
    private watermark?: IWatermarkRenderer;
    private _isGroupActive = false;
    private _locked: DockviewGroupPanelLocked = false;
    private _isFloating = false;
    private _rightHeaderActions: IHeaderActionsRenderer | undefined;
    private _leftHeaderActions: IHeaderActionsRenderer | undefined;

    private mostRecentlyUsed: IDockviewPanel[] = [];

    private readonly _onDidChange = new Emitter<IViewSize | undefined>();
    readonly onDidChange: Event<IViewSize | undefined> =
        this._onDidChange.event;

    private _width = 0;
    private _height = 0;

    private _panels: IDockviewPanel[] = [];

    private readonly _onMove = new Emitter<GroupMoveEvent>();
    readonly onMove: Event<GroupMoveEvent> = this._onMove.event;

    private readonly _onDidDrop = new Emitter<GroupviewDropEvent>();
    readonly onDidDrop: Event<GroupviewDropEvent> = this._onDidDrop.event;

    private readonly _onTabDragStart = new Emitter<TabDragEvent>();
    readonly onTabDragStart: Event<TabDragEvent> = this._onTabDragStart.event;

    private readonly _onGroupDragStart = new Emitter<GroupDragEvent>();
    readonly onGroupDragStart: Event<GroupDragEvent> =
        this._onGroupDragStart.event;

    private readonly _onDidAddPanel = new Emitter<GroupviewChangeEvent>();
    readonly onDidAddPanel: Event<GroupviewChangeEvent> =
        this._onDidAddPanel.event;

    private readonly _onDidRemovePanel = new Emitter<GroupviewChangeEvent>();
    readonly onDidRemovePanel: Event<GroupviewChangeEvent> =
        this._onDidRemovePanel.event;

    private readonly _onDidActivePanelChange =
        new Emitter<GroupviewChangeEvent>();
    readonly onDidActivePanelChange: Event<GroupviewChangeEvent> =
        this._onDidActivePanelChange.event;

    get element(): HTMLElement {
        throw new Error('not supported');
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
            'locked-groupview',
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

    get isFloating(): boolean {
        return this._isFloating;
    }

    set isFloating(value: boolean) {
        this._isFloating = value;

        this.dropTarget.setTargetZones(
            value ? ['center'] : ['top', 'bottom', 'left', 'right', 'center']
        );

        toggleClass(this.container, 'dv-groupview-floating', value);

        this.groupPanel.api._onDidFloatingStateChange.fire({
            isFloating: this.isFloating,
        });
    }

    constructor(
        private readonly container: HTMLElement,
        private accessor: DockviewComponent,
        public id: string,
        private readonly options: GroupOptions,
        private readonly groupPanel: DockviewGroupPanel
    ) {
        super();

        toggleClass(this.container, 'groupview', true);

        this.tabsContainer = new TabsContainer(this.accessor, this.groupPanel);

        this.contentContainer = new ContentContainer();

        this.dropTarget = new Droptarget(this.contentContainer.element, {
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
            canDisplayOverlay: (event, position) => {
                if (
                    this.locked === 'no-drop-target' ||
                    (this.locked && position === 'center')
                ) {
                    return false;
                }

                const data = getPanelData();

                if (!data && event.shiftKey && !this.isFloating) {
                    return false;
                }

                if (data && data.viewId === this.accessor.id) {
                    if (data.groupId === this.id) {
                        if (position === 'center') {
                            // don't allow to drop on self for center position
                            return false;
                        }
                        if (data.panelId === null) {
                            // don't allow group move to drop anywhere on self
                            return false;
                        }
                    }

                    const groupHasOnePanelAndIsActiveDragElement =
                        this._panels.length === 1 && data.groupId === this.id;

                    return !groupHasOnePanelAndIsActiveDragElement;
                }

                return this.canDisplayOverlay(
                    event,
                    position,
                    DockviewDropTargets.Panel
                );
            },
        });

        container.append(
            this.tabsContainer.element,
            this.contentContainer.element
        );

        this.header.hidden = !!options.hideHeader;
        this.locked = options.locked || false;

        this.addDisposables(
            this._onTabDragStart,
            this._onGroupDragStart,
            this.tabsContainer.onTabDragStart((event) => {
                this._onTabDragStart.fire(event);
            }),
            this.tabsContainer.onGroupDragStart((event) => {
                this._onGroupDragStart.fire(event);
            }),
            this.tabsContainer.onDrop((event) => {
                this.handleDropEvent(event.event, 'center', event.index);
            }),
            this.contentContainer.onDidFocus(() => {
                this.accessor.doSetGroupActive(this.groupPanel, true);
            }),
            this.contentContainer.onDidBlur(() => {
                // noop
            }),
            this.dropTarget.onDrop((event) => {
                this.handleDropEvent(event.nativeEvent, event.position);
            }),
            this._onMove,
            this._onDidChange,
            this._onDidDrop,
            this._onDidAddPanel,
            this._onDidRemovePanel,
            this._onDidActivePanelChange
        );
    }

    initialize(): void {
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

        if (this.accessor.options.createRightHeaderActionsElement) {
            this._rightHeaderActions =
                this.accessor.options.createRightHeaderActionsElement(
                    this.groupPanel
                );
            this.addDisposables(this._rightHeaderActions);
            this._rightHeaderActions.init({
                containerApi: new DockviewApi(this.accessor),
                api: this.groupPanel.api,
            });
            this.tabsContainer.setRightActionsElement(
                this._rightHeaderActions.element
            );
        }

        if (this.accessor.options.createLeftHeaderActionsElement) {
            this._leftHeaderActions =
                this.accessor.options.createLeftHeaderActionsElement(
                    this.groupPanel
                );
            this.addDisposables(this._leftHeaderActions);
            this._leftHeaderActions.init({
                containerApi: new DockviewApi(this.accessor),
                api: this.groupPanel.api,
            });
            this.tabsContainer.setLeftActionsElement(
                this._leftHeaderActions.element
            );
        }
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
        this._activePanel?.focus?.();
    }

    public openPanel(
        panel: IDockviewPanel,
        options: {
            index?: number;
            skipFocus?: boolean;
            skipSetPanelActive?: boolean;
            skipSetGroupActive?: boolean;
        } = {}
    ): void {
        if (
            typeof options.index !== 'number' ||
            options.index > this.panels.length
        ) {
            options.index = this.panels.length;
        }

        const skipSetPanelActive = !!options.skipSetPanelActive;
        const skipSetGroupActive = !!options.skipSetGroupActive;

        // ensure the group is updated before we fire any events
        panel.updateParentGroup(this.groupPanel, true);

        if (this._activePanel === panel) {
            if (!skipSetGroupActive) {
                this.accessor.doSetGroupActive(this.groupPanel);
            }
            return;
        }

        this.doAddPanel(panel, options.index, skipSetPanelActive);

        if (!skipSetPanelActive) {
            this.doSetActivePanel(panel);
        }

        if (!skipSetGroupActive) {
            this.accessor.doSetGroupActive(
                this.groupPanel,
                !!options.skipFocus
            );
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

    public setActive(
        isGroupActive: boolean,
        skipFocus = false,
        force = false
    ): void {
        if (!force && this.isActive === isGroupActive) {
            if (!skipFocus) {
                this._activePanel?.focus?.();
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
                this._activePanel?.focus?.();
            }
        }
    }

    public layout(width: number, height: number): void {
        this._width = width;
        this._height = height;

        this.contentContainer.layout(this._width, this._height);

        if (this._activePanel?.layout) {
            this._activePanel.layout(this._width, this._height);
        }
    }

    private _removePanel(panel: IDockviewPanel): IDockviewPanel {
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

    private doRemovePanel(panel: IDockviewPanel): void {
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

        this._onDidRemovePanel.fire({ panel });
    }

    private doAddPanel(
        panel: IDockviewPanel,
        index: number = this.panels.length,
        skipSetActive = false
    ): void {
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

        this._onDidAddPanel.fire({ panel });
    }

    private doSetActivePanel(panel: IDockviewPanel | undefined): void {
        this._activePanel = panel;

        if (panel) {
            this.tabsContainer.setActivePanel(panel);

            panel.layout(this._width, this._height);

            this.updateMru(panel);

            this._onDidActivePanelChange.fire({ panel });
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
        toggleClass(this.container, 'empty', this.isEmpty);

        this.panels.forEach((panel) =>
            panel.updateParentGroup(this.groupPanel, this.isActive)
        );

        if (this.isEmpty && !this.watermark) {
            const watermark = this.accessor.createWatermarkComponent();
            watermark.init({
                containerApi: new DockviewApi(this.accessor),
                group: this.groupPanel,
            });
            this.watermark = watermark;

            addDisposableListener(this.watermark.element, 'click', () => {
                if (!this.isActive) {
                    this.accessor.doSetGroupActive(this.groupPanel);
                }
            });

            this.tabsContainer.hide();
            this.contentContainer.element.appendChild(this.watermark.element);

            this.watermark.updateParentGroup(this.groupPanel, true);
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
        target: DockviewDropTargets
    ): boolean {
        // custom overlay handler
        if (this.accessor.options.showDndOverlay) {
            return this.accessor.options.showDndOverlay({
                nativeEvent: event,
                target,
                group: this.accessor.getPanel(this.id)!,
                position,
                getData: getPanelData,
            });
        }
        return false;
    }

    private handleDropEvent(
        event: DragEvent,
        position: Position,
        index?: number
    ): void {
        if (this.locked === 'no-drop-target') {
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
            this._onDidDrop.fire({
                nativeEvent: event,
                position,
                index,
                getData: () => getPanelData(),
            });
        }
    }

    public dispose(): void {
        super.dispose();

        this.watermark?.element.remove();
        this.watermark?.dispose?.();

        for (const panel of this.panels) {
            panel.dispose();
        }

        this.dropTarget.dispose();
        this.tabsContainer.dispose();
        this.contentContainer.dispose();
    }
}
