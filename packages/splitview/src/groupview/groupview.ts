import { IDisposable, CompositeDisposable, Disposable } from '../lifecycle';
import { ITabContainer, TabContainer } from './titlebar/tabContainer';
import { IContentContainer, ContentContainer } from './panel/content/content';
import { Position, Droptarget, DroptargetEvent } from './droptarget/droptarget';
import { Event, Emitter, addDisposableListener } from '../events';
import { IComponentGridview, IGroupAccessor, Layout } from '../layout';
import { toggleClass } from '../dom';
import { ClosePanelResult, WatermarkPart } from './panel/parts';
import { IGroupPanel } from './panel/types';
import { timeoutPromise } from '../async';
import {
    extractData,
    isTabDragEvent,
    isCustomDragEvent,
    isPanelTransferEvent,
} from './droptarget/dataTransfer';
import { IBaseGridView } from '../layout/baseGrid';

export const enum GroupChangeKind {
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
    panels: IGroupPanel[];
    activePanel?: IGroupPanel;
}

export interface GroupChangeEvent {
    kind: GroupChangeKind;
    panel?: IGroupPanel;
}

export interface IGroupview extends IDisposable, IBaseGridView {
    size: number;
    panels: IGroupPanel[];
    tabHeight: number;
    // state
    isPanelActive: (panel: IGroupPanel) => boolean;
    activePanel: IGroupPanel;
    indexOf(panel: IGroupPanel): number;
    // panel lifecycle
    openPanel(panel: IGroupPanel, index?: number): void;
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
}

export interface GroupDropEvent {
    event: DragEvent;
    target: Position;
    index?: number;
}

export class Groupview extends CompositeDisposable implements IGroupview {
    private _element: HTMLElement;

    private tabContainer: ITabContainer;
    private contentContainer: IContentContainer;
    private _active: boolean;
    private _activePanel: IGroupPanel;
    private dropTarget: Droptarget;
    private watermark: WatermarkPart;

    private _width: number;
    private _height: number;

    private _panels: IGroupPanel[] = [];

    private readonly _onMove = new Emitter<GroupMoveEvent>();
    readonly onMove: Event<GroupMoveEvent> = this._onMove.event;

    private readonly _onDrop = new Emitter<GroupDropEvent>();
    readonly onDrop: Event<GroupDropEvent> = this._onDrop.event;

    private readonly _onDidGroupChange = new Emitter<GroupChangeEvent>();
    readonly onDidGroupChange: Event<{ kind: GroupChangeKind }> = this
        ._onDidGroupChange.event;

    get activePanel() {
        return this._activePanel;
    }

    get tabHeight() {
        return this.tabContainer.height;
    }

    set tabHeight(height: number) {
        this.tabContainer.height = height;
        this.layout(this._width, this._height);
    }

    get isActive() {
        return this._active;
    }

    get panels() {
        return this._panels;
    }

    get element() {
        return this._element;
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

    public indexOf(panel: IGroupPanel) {
        return this.tabContainer.indexOf(panel.id);
    }

    public toJSON(): object {
        return {
            views: this.panels.map((panel) => panel.id),
            activeView: this._activePanel?.id,
        };
    }

    public startActiveDrag(panel: IGroupPanel): IDisposable {
        const index = this.tabContainer.indexOf(panel.id);
        if (index > -1) {
            const tab = this.tabContainer.at(index);
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

        const index = this.panels.indexOf(options.panel);

        let normalizedIndex: number = undefined;

        if (index < this.panels.length - 1) {
            normalizedIndex = index + 1;
        } else if (!options.suppressRoll) {
            normalizedIndex = 0;
        }

        if (normalizedIndex === undefined) {
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

        const index = this.panels.indexOf(options.panel);

        let normalizedIndex: number = undefined;

        if (index > 0) {
            normalizedIndex = index - 1;
        } else if (!options.suppressRoll) {
            normalizedIndex = this.panels.length - 1;
        }

        if (normalizedIndex === undefined) {
            return;
        }

        this.openPanel(this.panels[normalizedIndex]);
    }

    public containsPanel(panel: IGroupPanel) {
        return this.panels.includes(panel);
    }

    constructor(
        private accessor: IGroupAccessor,
        public id: string,
        private options?: GroupOptions
    ) {
        super();

        this.addDisposables(this._onMove, this._onDidGroupChange, this._onDrop);

        this._element = document.createElement('div');
        this._element.className = 'groupview';
        this._element.tabIndex = -1;

        this.tabContainer = new TabContainer(this.accessor, this);
        this.contentContainer = new ContentContainer();
        this.dropTarget = new Droptarget(this.contentContainer.element, {
            isDirectional: true,
            id: this.accessor.id,
            isDisabled: () => {
                // disable the drop target if we only have one tab, and that is also the tab we are moving
                return (
                    this._panels.length === 1 &&
                    this.tabContainer.hasActiveDragEvent
                );
            },
            enableExternalDragEvents: this.accessor.options
                .enableExternalDragEvents,
        });

        this._element.append(
            this.tabContainer.element,
            this.contentContainer.element
        );

        this.addDisposables(
            this._onMove,
            this._onDidGroupChange,
            this.tabContainer.onDropEvent((event) =>
                this.handleDropEvent(event.event, event.index)
            ),
            this.contentContainer.onDidFocus(() => {
                this.accessor.doSetGroupActive(this);
            }),
            this.dropTarget.onDidChange((event) => {
                // if we've center dropped on ourself then ignore
                if (
                    event.position === Position.Center &&
                    this.tabContainer.hasActiveDragEvent
                ) {
                    return;
                }

                this.handleDropEvent(event);
            })
        );

        if (options?.panels) {
            options.panels.forEach((panel) => {
                this.openPanel(panel);
            });
        }
        if (options?.activePanel) {
            this.openPanel(options?.activePanel);
        }

        this.updateContainer();
    }

    public openPanel(panel: IGroupPanel, index: number = this.panels.length) {
        if (this._activePanel === panel) {
            this.accessor.doSetGroupActive(this);
            return;
        }

        this.doAddPanel(panel, index);

        this.tabContainer.openPanel(panel, index);
        this.contentContainer.openPanel(panel.content.element);

        this.doSetActivePanel(panel);
        this.accessor.doSetGroupActive(this);

        this.updateContainer();
    }

    public removePanel(groupItemOrId: IGroupPanel | string): IGroupPanel {
        const id =
            typeof groupItemOrId === 'string'
                ? groupItemOrId
                : groupItemOrId.id;

        const panel = this._panels.find((panel) => panel.id === id);

        if (!panel) {
            throw new Error('invalid operation');
        }

        return this._removePanel(panel);
    }

    public async closeAllPanels() {
        const index = this.panels.indexOf(this._activePanel);

        if (index > -1) {
            if (this.panels.indexOf(this._activePanel) < 0) {
                console.warn('active panel not tracked');
            }

            const canClose =
                !this._activePanel.close ||
                (await this._activePanel.close()) === ClosePanelResult.CLOSE;
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
                await timeoutPromise(0);
                const canClose =
                    (await panel.close()) === ClosePanelResult.CLOSE;
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
            this.accessor.removeGroup(this);
        }

        return true;
    }

    public closePanel = async (panel: IGroupPanel) => {
        if (
            panel.close &&
            (await panel.close()) === ClosePanelResult.DONT_CLOSE
        ) {
            return false;
        }

        this.doClose(panel);
        return true;
    };

    private doClose(panel: IGroupPanel) {
        this._removePanel(panel);
        (this.accessor as Layout).unregisterPanel(panel);

        panel.dispose();

        if (this.panels.length === 0) {
            this.accessor.removeGroup(this);
        }
    }

    public isPanelActive(panel: IGroupPanel) {
        return this._activePanel === panel;
    }

    public setActive(isActive: boolean) {
        if (this._active === isActive) {
            return;
        }

        this._active = isActive;

        toggleClass(this.element, 'active-group', isActive);
        toggleClass(this.element, 'inactive-group', !isActive);

        this.tabContainer.setActive(this._active);

        if (!this._activePanel && this.panels.length > 0) {
            this.doSetActivePanel(this.panels[0]);
        }

        this.panels.forEach((panel) => panel.setVisible(this._active, this));

        if (this.watermark?.setVisible) {
            this.watermark.setVisible(this._active, this);
        }

        if (isActive) {
            this._onDidGroupChange.fire({ kind: GroupChangeKind.GROUP_ACTIVE });
        }
    }

    public layout(width: number, height: number) {
        this._width = width;
        this._height = height;

        if (this._activePanel?.layout) {
            this._activePanel.layout(this._width, this._height);
        }
    }

    private _removePanel(panel: IGroupPanel) {
        const index = this._panels.indexOf(panel);

        const isActivePanel = this._activePanel === panel;

        this.doRemovePanel(panel);

        if (isActivePanel && this.panels.length > 0) {
            const nextPanel = this.panels[Math.max(0, index - 1)];
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

        this.tabContainer.delete(panel.id);
        this._panels.splice(index, 1);

        this._onDidGroupChange.fire({
            kind: GroupChangeKind.REMOVE_PANEL,
            panel,
        });
    }

    private doAddPanel(panel: IGroupPanel, index: number) {
        const existingPanel = this._panels.indexOf(panel);
        const hasExistingPabel = existingPanel > -1;

        if (hasExistingPabel) {
            // TODO - need to ensure ordering hasn't changed and if it has need to re-order this.panels
            return;
        }

        this.panels.splice(index, 0, panel);

        this._onDidGroupChange.fire({ kind: GroupChangeKind.ADD_PANEL });
    }

    private doSetActivePanel(panel: IGroupPanel) {
        this._activePanel = panel;
        this.tabContainer.setActivePanel(panel);
        panel.layout(this._width, this._height);
        this._onDidGroupChange.fire({ kind: GroupChangeKind.PANEL_ACTIVE });
    }

    private updateContainer() {
        toggleClass(this.element, 'empty', this.isEmpty);

        if (this.accessor.options.watermarkComponent && !this.watermark) {
            const WatermarkComponent = this.accessor.options.watermarkComponent;
            this.watermark = new WatermarkComponent();
            this.watermark.init({ accessor: this.accessor });
        }

        this.panels.forEach((panel) => panel.setVisible(this._active, this));

        if (this.isEmpty && !this.watermark?.element.parentNode) {
            addDisposableListener(this.watermark.element, 'click', () => {
                if (!this._active) {
                    this.accessor.doSetGroupActive(this);
                }
            });

            this.contentContainer.openPanel(this.watermark.element);

            this.watermark.setVisible(true, this);
        }
        if (!this.isEmpty && this.watermark.element.parentNode) {
            this.watermark.dispose();
            this.watermark = undefined;
            this.contentContainer.closePanel();
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
                const oldIndex = this.tabContainer.indexOf(itemId);
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
            let panel = this.accessor.getPanel(dataObject.id);

            if (!panel) {
                panel = this.accessor.addPanel(dataObject);
            }

            this._onMove.fire({
                target,
                groupId: panel.group?.id,
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
        this.tabContainer.dispose();
        this.contentContainer.dispose();
    }
}
