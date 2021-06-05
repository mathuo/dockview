import { DockviewApi } from '../api/component.api';
import { timeoutAsPromise } from '../async';
import {
    extractData,
    isCustomDragEvent,
    isPanelTransferEvent,
    isTabDragEvent,
} from '../dnd/dataTransfer';
import { Droptarget, DroptargetEvent, Position } from '../dnd/droptarget';
import {
    DockviewComponent,
    IDockviewComponent,
} from '../dockview/dockviewComponent';
import { isAncestor, toggleClass } from '../dom';
import { addDisposableListener, Emitter, Event } from '../events';
import { IGridPanelView } from '../gridview/baseComponentGridview';
import { IViewSize } from '../gridview/gridview';
import { CompositeDisposable, Disposable, IDisposable } from '../lifecycle';
import { PanelInitParameters, PanelUpdateEvent } from '../panel/types';
import { IGroupPanel } from './groupPanel';
import { ContentContainer, IContentContainer } from './panel/content';
import { ITabsContainer, TabsContainer } from './titlebar/tabsContainer';
import { IWatermarkRenderer } from './types';
import { GroupviewPanel } from './groupviewPanel';

export enum GroupChangeKind {
    GROUP_ACTIVE = 'GROUP_ACTIVE',
    ADD_GROUP = 'ADD_GROUP',
    REMOVE_GROUP = 'REMOVE_GROUP',
    //
    ADD_PANEL = 'ADD_PANEL',
    REMOVE_PANEL = 'REMOVE_PANEL',
    PANEL_OPEN = 'PANEL_OPEN',
    PANEL_CLOSE = 'PANEL_CLOSE',
    PANEL_ACTIVE = 'PANEL_ACTIVE',
    //
    NEW_LAYOUT = 'NEW_LAYOUT',
    LAYOUT = 'LAYOUT',
    //
    PANEL_CREATED = 'PANEL_CREATED',
    PANEL_DESTROYED = 'PANEL_DESTROYED',
    PANEL_DIRTY = 'PANEL_DIRTY',
    PANEL_CLEAN = 'PANEL_CLEAN',
    //
    LAYOUT_CONFIG_UPDATED = 'LAYOUT_CONFIG_UPDATED',
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

export interface GroupOptions {
    readonly panels?: IGroupPanel[];
    readonly activePanel?: IGroupPanel;
    readonly id?: string;
    tabHeight?: number;
}

export interface GroupChangeEvent {
    readonly kind: GroupChangeKind;
    readonly panel?: IGroupPanel;
}

export interface GroupPanelViewState {
    views: string[];
    activeView?: string;
    id: string;
}

export interface IGroupview extends IDisposable, IGridPanelView {
    readonly isActive: boolean;
    readonly size: number;
    readonly panels: IGroupPanel[];
    tabHeight: number | undefined;
    // state
    isPanelActive: (panel: IGroupPanel) => boolean;
    activePanel: IGroupPanel | undefined;
    indexOf(panel: IGroupPanel): number;
    // panel lifecycle
    openPanel(
        panel: IGroupPanel,
        options?: { index?: number; skipFocus?: boolean }
    ): void;
    closePanel(panel: IGroupPanel): Promise<boolean>;
    closeAllPanels(): Promise<boolean>;
    containsPanel(panel: IGroupPanel): boolean;
    removePanel: (panelOrId: IGroupPanel | string) => IGroupPanel;
    // events
    onDidGroupChange: Event<{ kind: GroupChangeKind }>;
    onMove: Event<GroupMoveEvent>;
    //
    startActiveDrag(panel: IGroupPanel): IDisposable;
    //
    moveToNext(options?: { panel?: IGroupPanel; suppressRoll?: boolean }): void;
    moveToPrevious(options?: {
        panel?: IGroupPanel;
        suppressRoll?: boolean;
    }): void;
    isAncestor(element: Element): boolean;
    updateActions(): void;
}

export interface GroupDropEvent {
    event: DragEvent;
    target: Position;
    index?: number;
}

export class Groupview extends CompositeDisposable implements IGroupview {
    private readonly tabsContainer: ITabsContainer;
    private readonly contentContainer: IContentContainer;
    private readonly dropTarget: Droptarget;
    private _activePanel?: IGroupPanel;
    private watermark?: IWatermarkRenderer;
    private _isGroupActive = false;

    private mostRecentlyUsed: IGroupPanel[] = [];

    private readonly _onDidChange = new Emitter<IViewSize | undefined>();
    readonly onDidChange: Event<IViewSize | undefined> = this._onDidChange
        .event;

    private _width = 0;
    private _height = 0;

    private _panels: IGroupPanel[] = [];

    private readonly _onMove = new Emitter<GroupMoveEvent>();
    readonly onMove: Event<GroupMoveEvent> = this._onMove.event;

    private readonly _onDrop = new Emitter<GroupDropEvent>();
    readonly onDrop: Event<GroupDropEvent> = this._onDrop.event;

    private readonly _onDidGroupChange = new Emitter<GroupChangeEvent>();
    readonly onDidGroupChange: Event<{ kind: GroupChangeKind }> = this
        ._onDidGroupChange.event;

    get element(): HTMLElement {
        throw new Error('not supported');
    }

    get activePanel(): IGroupPanel | undefined {
        return this._activePanel;
    }

    get tabHeight(): number | undefined {
        return this.tabsContainer.height;
    }

    set tabHeight(height: number | undefined) {
        this.tabsContainer.height = height;
        this.layout(this._width, this._height);
    }

    get isActive() {
        return this._isGroupActive;
    }

    get panels() {
        return this._panels;
    }

    get size() {
        return this._panels.length;
    }

    get isEmpty() {
        return this._panels.length === 0;
    }

    get minimumHeight() {
        return 100;
    }

    get maximumHeight() {
        return Number.MAX_SAFE_INTEGER;
    }

    get minimumWidth() {
        return 100;
    }

    get maximumWidth() {
        return Number.MAX_SAFE_INTEGER;
    }

    isAncestor(element: Element): boolean {
        return (
            element === this.contentContainer.element ||
            isAncestor(element, this.contentContainer.element)
        );
    }

    public indexOf(panel: IGroupPanel) {
        return this.tabsContainer.indexOf(panel.id);
    }

    public toJSON(): GroupPanelViewState {
        return {
            views: this.tabsContainer.panels,
            activeView: this._activePanel?.id,
            id: this.id,
        };
    }

    public startActiveDrag(panel: IGroupPanel): IDisposable {
        const index = this.tabsContainer.indexOf(panel.id);
        if (index > -1) {
            const tab = this.tabsContainer.at(index);
            tab.startDragEvent();
            return {
                dispose: () => {
                    tab.stopDragEvent();
                },
            };
        }
        return Disposable.NONE;
    }

    public moveToNext(options?: {
        panel?: IGroupPanel;
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
        panel?: IGroupPanel;
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

    public containsPanel(panel: IGroupPanel) {
        return this.panels.includes(panel);
    }

    constructor(
        private readonly container: HTMLElement,
        private accessor: IDockviewComponent,
        public id: string,
        private readonly options: GroupOptions,
        private readonly parent: GroupviewPanel
    ) {
        super();

        this.container.classList.add('groupview');

        this.addDisposables(this._onMove, this._onDidGroupChange, this._onDrop);

        this.tabsContainer = new TabsContainer(this.accessor, this.parent, {
            tabHeight: options.tabHeight,
        });
        this.contentContainer = new ContentContainer();
        this.dropTarget = new Droptarget(this.contentContainer.element, {
            isDirectional: true,
            id: this.accessor.id,
            isDisabled: () => {
                // disable the drop target if we only have one tab, and that is also the tab we are moving
                return (
                    this._panels.length === 1 &&
                    this.tabsContainer.hasActiveDragEvent
                );
            },
            enableExternalDragEvents: this.accessor.options
                .enableExternalDragEvents,
        });

        container.append(
            this.tabsContainer.element,
            this.contentContainer.element
        );

        this.addDisposables(
            this._onMove,
            this._onDidGroupChange,
            this.tabsContainer.onDropEvent((event) =>
                this.handleDropEvent(event.event, event.index)
            ),
            this.contentContainer.onDidFocus(() => {
                this.accessor.doSetGroupActive(this.parent, true);
            }),
            this.contentContainer.onDidBlur(() => {
                // this._activePanel?.api._ondid
            }),
            this.dropTarget.onDidChange((event) => {
                // if we've center dropped on ourself then ignore
                if (
                    event.position === Position.Center &&
                    this.tabsContainer.hasActiveDragEvent
                ) {
                    return;
                }

                this.handleDropEvent(event);
            })
        );
    }

    bootstrap() {
        if (this.options?.panels) {
            this.options.panels.forEach((panel) => {
                this.doAddPanel(panel);
            });
        }

        if (this.options?.activePanel) {
            this.openPanel(this.options.activePanel);
        }

        this.setActive(this.isActive, true, true);

        this.updateContainer();
    }

    init(params: PanelInitParameters) {
        //noop
    }

    update(params: PanelUpdateEvent) {
        //noop
    }

    focus() {
        this._activePanel?.focus();
    }

    public openPanel(
        panel: IGroupPanel,
        options: { index?: number; skipFocus?: boolean } = {}
    ) {
        if (typeof options.index !== 'number') {
            options.index = this.panels.length;
        }
        if (this._activePanel === panel) {
            this.accessor.doSetGroupActive(this.parent);
            return;
        }

        this.doAddPanel(panel, options.index);

        this.doSetActivePanel(panel);
        this.accessor.doSetGroupActive(this.parent, !!options.skipFocus);

        this.updateContainer();
    }

    public removePanel(groupItemOrId: IGroupPanel | string): IGroupPanel {
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

    public async closeAllPanels() {
        const index = this._activePanel
            ? this.panels.indexOf(this._activePanel)
            : -1;

        if (this._activePanel && index > -1) {
            if (this.panels.indexOf(this._activePanel) < 0) {
                console.warn('active panel not tracked');
            }

            const canClose =
                !this._activePanel?.close || (await this._activePanel.close());
            if (!canClose) {
                return false;
            }
        }

        for (let i = 0; i < this.panels.length; i++) {
            if (i === index) {
                continue;
            }
            const panel = this.panels[i];
            this.openPanel(panel);

            if (panel.close) {
                await timeoutAsPromise(0);
                const canClose = await panel.close();
                if (!canClose) {
                    return false;
                }
            }
        }

        if (this.panels.length > 0) {
            // take a copy since we will be edting the array as we iterate through
            const arrPanelCpy = [...this.panels];
            await Promise.all(arrPanelCpy.map((p) => this.doClose(p)));
        } else {
            this.accessor.removeGroup(this.parent);
        }

        return true;
    }

    public closePanel = async (panel: IGroupPanel) => {
        if (panel.close && !(await panel.close())) {
            return false;
        }

        this.doClose(panel);
        return true;
    };

    private doClose(panel: IGroupPanel) {
        this._removePanel(panel);
        (this.accessor as DockviewComponent).unregisterPanel(panel);

        if (this.panels.length === 0) {
            this.accessor.removeGroup(this.parent);
        }
    }

    public isPanelActive(panel: IGroupPanel) {
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

        // this.updateActions();

        if (!this._activePanel && this.panels.length > 0) {
            this.doSetActivePanel(this.panels[0]);
        }

        this.updateContainer();

        // this.panels.forEach((panel) =>
        //     panel.updateParentGroup(this, this.isActive)
        // );

        // if (this.watermark?.updateParentGroup) {
        //     this.watermark.updateParentGroup(this, this.isActive);
        // }

        if (isGroupActive) {
            if (!skipFocus) {
                this._activePanel?.focus();
            }
            this._onDidGroupChange.fire({ kind: GroupChangeKind.GROUP_ACTIVE });
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

    private _removePanel(panel: IGroupPanel) {
        const isActivePanel = this._activePanel === panel;

        this.doRemovePanel(panel);

        if (isActivePanel && this.panels.length > 0) {
            const nextPanel = this.mostRecentlyUsed[0];
            this.openPanel(nextPanel);
        }

        if (this._activePanel && this.panels.length === 0) {
            this._activePanel = undefined;
        }

        this.updateContainer();
        return panel;
    }

    private doRemovePanel(panel: IGroupPanel) {
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
            kind: GroupChangeKind.REMOVE_PANEL,
            panel,
        });
    }

    private doAddPanel(panel: IGroupPanel, index: number = this.panels.length) {
        const existingPanel = this._panels.indexOf(panel);
        const hasExistingPanel = existingPanel > -1;

        this.tabsContainer.openPanel(panel, index);

        this.contentContainer.openPanel(panel);

        this.tabsContainer.show();
        this.contentContainer.show();

        if (hasExistingPanel) {
            // TODO - need to ensure ordering hasn't changed and if it has need to re-order this.panels
            return;
        }

        this.updateMru(panel);
        this.panels.splice(index, 0, panel);

        this._onDidGroupChange.fire({ kind: GroupChangeKind.ADD_PANEL });
    }

    private doSetActivePanel(panel: IGroupPanel) {
        this._activePanel = panel;
        this.tabsContainer.setActivePanel(panel);

        // this.contentContainer.openPanel(panel.content);

        panel.layout(this._width, this._height);

        this.updateMru(panel);

        this._onDidGroupChange.fire({ kind: GroupChangeKind.PANEL_ACTIVE });
    }

    private updateMru(panel: IGroupPanel) {
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

            // this.contentContainer.openPanel(this.watermark);
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

    private handleDropEvent(event: DroptargetEvent, index?: number) {
        if (isPanelTransferEvent(event.event)) {
            this.handlePanelDropEvent(event.event, event.position, index);
            return;
        }

        this._onDrop.fire({
            event: event.event,
            target: event.position,
            index,
        });

        console.debug('[customDropEvent]');
    }

    private handlePanelDropEvent(
        event: DragEvent,
        target: Position,
        index?: number
    ) {
        const dataObject = extractData(event);

        if (isTabDragEvent(dataObject)) {
            const { groupId, itemId } = dataObject;
            const isSameGroup = this.id === groupId;
            if (isSameGroup && !target) {
                const oldIndex = this.tabsContainer.indexOf(itemId);
                if (oldIndex === index) {
                    console.debug(
                        '[tabs] drop indicates no change in position'
                    );
                    return;
                }
            }

            this._onMove.fire({
                target,
                groupId: dataObject.groupId,
                itemId: dataObject.itemId,
                index,
            });
        }

        if (isCustomDragEvent(dataObject)) {
            let panel = this.accessor.getGroupPanel(dataObject.id);

            if (!panel) {
                panel = this.accessor.addPanel(dataObject);
            }

            if (!panel.group) {
                throw new Error(`panel ${panel.id} has no associated group`);
            }

            this._onMove.fire({
                target,
                groupId: panel.group.id,
                itemId: panel.id,
                index,
            });
        }
    }

    public dispose() {
        for (const panel of this.panels) {
            panel.dispose();
        }

        super.dispose();

        this.dropTarget.dispose();
        this.tabsContainer.dispose();
        this.contentContainer.dispose();
    }
}
