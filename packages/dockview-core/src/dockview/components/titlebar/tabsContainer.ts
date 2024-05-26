import {
    IDisposable,
    CompositeDisposable,
    IValueDisposable,
} from '../../../lifecycle';
import { addDisposableListener, Emitter, Event } from '../../../events';
import { Tab } from '../tab/tab';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { VoidContainer } from './voidContainer';
import { OverflowObserver, toggleClass } from '../../../dom';
import { DockviewPanel, IDockviewPanel } from '../../dockviewPanel';
import { DockviewComponent } from '../../dockviewComponent';
import { WillShowOverlayLocationEvent } from '../../dockviewGroupPanelModel';
import { getPanelData } from '../../../dnd/dataTransfer';
import { TabsPanel } from './tabsPanel';

export interface TabDropIndexEvent {
    readonly event: DragEvent;
    readonly index: number;
}

export interface TabDragEvent {
    readonly nativeEvent: DragEvent;
    readonly panel: IDockviewPanel;
}

export interface GroupDragEvent {
    readonly nativeEvent: DragEvent;
    readonly group: DockviewGroupPanel;
}

export interface ITabsContainer extends IDisposable {
    readonly element: HTMLElement;
    readonly panels: string[];
    readonly size: number;
    readonly onDrop: Event<TabDropIndexEvent>;
    readonly onTabDragStart: Event<TabDragEvent>;
    readonly onGroupDragStart: Event<GroupDragEvent>;
    readonly onWillShowOverlay: Event<WillShowOverlayLocationEvent>;
    hidden: boolean;
    delete(id: string): void;
    indexOf(id: string): number;
    setActive(isGroupActive: boolean): void;
    setActivePanel(panel: IDockviewPanel): void;
    isActive(tab: Tab): boolean;
    closePanel(panel: IDockviewPanel): void;
    openPanel(panel: IDockviewPanel, index?: number): void;
    setRightActionsElement(element: HTMLElement | undefined): void;
    setLeftActionsElement(element: HTMLElement | undefined): void;
    setPrefixActionsElement(element: HTMLElement | undefined): void;
    show(): void;
    hide(): void;
}

export class TabsContainer
    extends CompositeDisposable
    implements ITabsContainer
{
    private readonly _element: HTMLElement;
    private readonly tabContainer: TabsPanel;
    private readonly rightActionsContainer: HTMLElement;
    private readonly leftActionsContainer: HTMLElement;
    private readonly preActionsContainer: HTMLElement;
    private readonly voidContainer: VoidContainer;

    private rightActions: HTMLElement | undefined;
    private leftActions: HTMLElement | undefined;
    private preActions: HTMLElement | undefined;

    private _hidden = false;

    private readonly _onDrop = new Emitter<TabDropIndexEvent>();
    readonly onDrop: Event<TabDropIndexEvent> = this._onDrop.event;

    private readonly _onTabDragStart = new Emitter<TabDragEvent>();
    readonly onTabDragStart: Event<TabDragEvent> = this._onTabDragStart.event;

    private readonly _onGroupDragStart = new Emitter<GroupDragEvent>();
    readonly onGroupDragStart: Event<GroupDragEvent> =
        this._onGroupDragStart.event;

    private readonly _onWillShowOverlay =
        new Emitter<WillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<WillShowOverlayLocationEvent> =
        this._onWillShowOverlay.event;

    get panels(): string[] {
        return this.tabContainer.tabs.map((_) => _.panel.id);
    }

    get size(): number {
        return this.tabContainer.tabs.length;
    }

    get hidden(): boolean {
        return this._hidden;
    }

    set hidden(value: boolean) {
        this._hidden = value;
        this.element.style.display = value ? 'none' : '';
    }

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly accessor: DockviewComponent,
        private readonly group: DockviewGroupPanel
    ) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'tabs-and-actions-container';

        toggleClass(
            this._element,
            'dv-full-width-single-tab',
            this.accessor.options.singleTabMode === 'fullwidth'
        );

        this.rightActionsContainer = document.createElement('div');
        this.rightActionsContainer.className = 'right-actions-container';

        this.leftActionsContainer = document.createElement('div');
        this.leftActionsContainer.className = 'left-actions-container';

        this.preActionsContainer = document.createElement('div');
        this.preActionsContainer.className = 'pre-actions-container';

        this.tabContainer = new TabsPanel(this.accessor);

        this.voidContainer = new VoidContainer(this.accessor, this.group);

        this._element.appendChild(this.preActionsContainer);
        this._element.appendChild(this.tabContainer.element);
        this._element.appendChild(this.leftActionsContainer);
        this._element.appendChild(this.voidContainer.element);
        this._element.appendChild(this.rightActionsContainer);

        this.addDisposables(
            this.tabContainer,
            this.accessor.onDidAddPanel((e) => {
                if (e.api.group === this.group) {
                    toggleClass(
                        this._element,
                        'dv-single-tab',
                        this.size === 1
                    );
                }
            }),
            this.accessor.onDidRemovePanel((e) => {
                if (e.api.group === this.group) {
                    toggleClass(
                        this._element,
                        'dv-single-tab',
                        this.size === 1
                    );
                }
            }),
            this._onWillShowOverlay,
            this._onDrop,
            this._onTabDragStart,
            this._onGroupDragStart,
            this.voidContainer,
            this.voidContainer.onDragStart((event) => {
                this._onGroupDragStart.fire({
                    nativeEvent: event,
                    group: this.group,
                });
            }),
            this.voidContainer.onDrop((event) => {
                this._onDrop.fire({
                    event: event.nativeEvent,
                    index: this.tabContainer.tabs.length,
                });
            }),
            this.voidContainer.onWillShowOverlay((event) => {
                this._onWillShowOverlay.fire(
                    new WillShowOverlayLocationEvent(event, {
                        kind: 'header_space',
                        panel: this.group.activePanel,
                        api: this.accessor.api,
                        group: this.group,
                        getData: getPanelData,
                    })
                );
            }),
            addDisposableListener(
                this.voidContainer.element,
                'mousedown',
                (event) => {
                    const isFloatingGroupsEnabled =
                        !this.accessor.options.disableFloatingGroups;

                    if (
                        isFloatingGroupsEnabled &&
                        event.shiftKey &&
                        this.group.api.location.type !== 'floating'
                    ) {
                        event.preventDefault();

                        const { top, left } =
                            this.element.getBoundingClientRect();
                        const { top: rootTop, left: rootLeft } =
                            this.accessor.element.getBoundingClientRect();

                        this.accessor.addFloatingGroup(
                            this.group,
                            {
                                x: left - rootLeft + 20,
                                y: top - rootTop + 20,
                            },
                            { inDragMode: true }
                        );
                    }
                }
            ),
            addDisposableListener(
                this.tabContainer.element,
                'mousedown',
                (event) => {
                    if (event.defaultPrevented) {
                        return;
                    }

                    const isLeftClick = event.button === 0;

                    if (isLeftClick) {
                        this.accessor.doSetGroupActive(this.group);
                    }
                }
            )
        );
    }

    public isActive(tab: Tab): boolean {
        return this.tabContainer.isActive(tab);
    }

    public indexOf(id: string): number {
        return this.tabContainer.tabs.findIndex((tab) => tab.panel.id === id);
    }

    show(): void {
        if (!this.hidden) {
            this.element.style.display = '';
        }
    }

    hide(): void {
        this._element.style.display = 'none';
    }

    setRightActionsElement(element: HTMLElement | undefined): void {
        if (this.rightActions === element) {
            return;
        }
        if (this.rightActions) {
            this.rightActions.remove();
            this.rightActions = undefined;
        }
        if (element) {
            this.rightActionsContainer.appendChild(element);
            this.rightActions = element;
        }
    }

    setLeftActionsElement(element: HTMLElement | undefined): void {
        if (this.leftActions === element) {
            return;
        }
        if (this.leftActions) {
            this.leftActions.remove();
            this.leftActions = undefined;
        }
        if (element) {
            this.leftActionsContainer.appendChild(element);
            this.leftActions = element;
        }
    }

    setPrefixActionsElement(element: HTMLElement | undefined): void {
        if (this.preActions === element) {
            return;
        }
        if (this.preActions) {
            this.preActions.remove();
            this.preActions = undefined;
        }
        if (element) {
            this.preActionsContainer.appendChild(element);
            this.preActions = element;
        }
    }

    public setActive(_isGroupActive: boolean) {
        // noop
    }

    public delete(id: string): void {
        this.tabContainer.removeTab(id);
    }

    public setActivePanel(panel: IDockviewPanel): void {
        this.tabContainer.tabs.forEach((tab) => {
            const isActivePanel = panel.id === tab.panel.id;
            tab.setActive(isActivePanel);
        });
    }

    public openPanel(
        panel: IDockviewPanel,
        index: number = this.tabContainer.tabs.length
    ): void {
        if (this.tabContainer.tabs.find((tab) => tab.panel.id === panel.id)) {
            return;
        }
        const tab = new Tab(panel, this.accessor, this.group);
        if (!panel.view?.tab) {
            throw new Error('invalid header component');
        }
        tab.setContent(panel.view.tab);

        const eventsDisposable = new CompositeDisposable(
            tab.onDragStart((event) => {
                this._onTabDragStart.fire({ nativeEvent: event, panel });
            }),
            tab.onChanged((event) => {
                const isFloatingGroupsEnabled =
                    !this.accessor.options.disableFloatingGroups;

                const isFloatingWithOnePanel =
                    this.group.api.location.type === 'floating' &&
                    this.size === 1;

                if (
                    isFloatingGroupsEnabled &&
                    !isFloatingWithOnePanel &&
                    event.shiftKey
                ) {
                    event.preventDefault();

                    const panel = this.accessor.getGroupPanel(tab.panel.id);

                    const { top, left } = tab.element.getBoundingClientRect();
                    const { top: rootTop, left: rootLeft } =
                        this.accessor.element.getBoundingClientRect();

                    this.accessor.addFloatingGroup(
                        panel as DockviewPanel,
                        {
                            x: left - rootLeft,
                            y: top - rootTop,
                        },
                        { inDragMode: true }
                    );
                    return;
                }

                const isLeftClick = event.button === 0;

                if (!isLeftClick || event.defaultPrevented) {
                    return;
                }

                if (this.group.activePanel !== panel) {
                    this.group.model.openPanel(panel);
                }
            }),
            tab.onDrop((event) => {
                this._onDrop.fire({
                    event: event.nativeEvent,
                    index: this.tabContainer.tabs.findIndex((x) => x === tab),
                });
            }),
            tab.onWillShowOverlay((event) => {
                this._onWillShowOverlay.fire(
                    new WillShowOverlayLocationEvent(event, {
                        kind: 'tab',
                        panel: this.group.activePanel,
                        api: this.accessor.api,
                        group: this.group,
                        getData: getPanelData,
                    })
                );
            })
        );

        tab.addDisposables(eventsDisposable);

        this.tabContainer.addTab(tab, index);
    }

    public closePanel(panel: IDockviewPanel): void {
        this.delete(panel.id);
    }
}
