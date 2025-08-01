import {
    IDisposable,
    CompositeDisposable,
    Disposable,
    MutableDisposable,
} from '../../../lifecycle';
import { addDisposableListener, Emitter, Event } from '../../../events';
import { Tab } from '../tab/tab';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { VoidContainer } from './voidContainer';
import { findRelativeZIndexParent, toggleClass } from '../../../dom';
import { IDockviewPanel } from '../../dockviewPanel';
import { DockviewComponent } from '../../dockviewComponent';
import { WillShowOverlayLocationEvent } from '../../events';
import { getPanelData } from '../../../dnd/dataTransfer';
import { Tabs } from './tabs';
import {
    createDropdownElementHandle,
    DropdownElement,
} from './tabOverflowControl';

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
    updateDragAndDropState(): void;
}

export class TabsContainer
    extends CompositeDisposable
    implements ITabsContainer
{
    private readonly _element: HTMLElement;
    private readonly tabs: Tabs;
    private readonly rightActionsContainer: HTMLElement;
    private readonly leftActionsContainer: HTMLElement;
    private readonly preActionsContainer: HTMLElement;
    private readonly voidContainer: VoidContainer;

    private rightActions: HTMLElement | undefined;
    private leftActions: HTMLElement | undefined;
    private preActions: HTMLElement | undefined;

    private _hidden = false;

    private dropdownPart: DropdownElement | null = null;
    private _overflowTabs: string[] = [];
    private readonly _dropdownDisposable = new MutableDisposable();

    private readonly _onDrop = new Emitter<TabDropIndexEvent>();
    readonly onDrop: Event<TabDropIndexEvent> = this._onDrop.event;

    get onTabDragStart(): Event<TabDragEvent> {
        return this.tabs.onTabDragStart;
    }

    private readonly _onGroupDragStart = new Emitter<GroupDragEvent>();
    readonly onGroupDragStart: Event<GroupDragEvent> =
        this._onGroupDragStart.event;

    private readonly _onWillShowOverlay =
        new Emitter<WillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<WillShowOverlayLocationEvent> =
        this._onWillShowOverlay.event;

    get panels(): string[] {
        return this.tabs.panels;
    }

    get size(): number {
        return this.tabs.size;
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
        this._element.className = 'dv-tabs-and-actions-container';

        toggleClass(
            this._element,
            'dv-full-width-single-tab',
            this.accessor.options.singleTabMode === 'fullwidth'
        );

        this.rightActionsContainer = document.createElement('div');
        this.rightActionsContainer.className = 'dv-right-actions-container';

        this.leftActionsContainer = document.createElement('div');
        this.leftActionsContainer.className = 'dv-left-actions-container';

        this.preActionsContainer = document.createElement('div');
        this.preActionsContainer.className = 'dv-pre-actions-container';

        this.tabs = new Tabs(group, accessor, {
            showTabsOverflowControl: !accessor.options.disableTabsOverflowList,
        });

        this.voidContainer = new VoidContainer(this.accessor, this.group);

        this._element.appendChild(this.preActionsContainer);
        this._element.appendChild(this.tabs.element);
        this._element.appendChild(this.leftActionsContainer);
        this._element.appendChild(this.voidContainer.element);
        this._element.appendChild(this.rightActionsContainer);

        this.addDisposables(
            this.tabs.onDrop((e) => this._onDrop.fire(e)),
            this.tabs.onWillShowOverlay((e) => this._onWillShowOverlay.fire(e)),
            accessor.onDidOptionsChange(() => {
                this.tabs.showTabsOverflowControl =
                    !accessor.options.disableTabsOverflowList;
            }),
            this.tabs.onOverflowTabsChange((event) => {
                this.toggleDropdown(event);
            }),
            this.tabs,
            this._onWillShowOverlay,
            this._onDrop,
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
                    index: this.tabs.size,
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
                'pointerdown',
                (event) => {
                    if (event.defaultPrevented) {
                        return;
                    }

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

                        this.accessor.addFloatingGroup(this.group, {
                            x: left - rootLeft + 20,
                            y: top - rootTop + 20,
                            inDragMode: true,
                        });
                    }
                }
            )
        );
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

    isActive(tab: Tab): boolean {
        return this.tabs.isActive(tab);
    }

    indexOf(id: string): number {
        return this.tabs.indexOf(id);
    }

    setActive(_isGroupActive: boolean) {
        // noop
    }

    delete(id: string): void {
        this.tabs.delete(id);
        this.updateClassnames();
    }

    setActivePanel(panel: IDockviewPanel): void {
        this.tabs.setActivePanel(panel);
    }

    openPanel(panel: IDockviewPanel, index: number = this.tabs.size): void {
        this.tabs.openPanel(panel, index);
        this.updateClassnames();
    }

    closePanel(panel: IDockviewPanel): void {
        this.delete(panel.id);
    }

    private updateClassnames(): void {
        toggleClass(this._element, 'dv-single-tab', this.size === 1);
    }

    private toggleDropdown(options: { tabs: string[]; reset: boolean }): void {
        const tabs = options.reset ? [] : options.tabs;
        this._overflowTabs = tabs;

        if (this._overflowTabs.length > 0 && this.dropdownPart) {
            this.dropdownPart.update({ tabs: tabs.length });
            return;
        }

        if (this._overflowTabs.length === 0) {
            this._dropdownDisposable.dispose();
            return;
        }

        const root = document.createElement('div');
        root.className = 'dv-tabs-overflow-dropdown-root';

        const part = createDropdownElementHandle();
        part.update({ tabs: tabs.length });

        this.dropdownPart = part;

        root.appendChild(part.element);
        this.rightActionsContainer.prepend(root);

        this._dropdownDisposable.value = new CompositeDisposable(
            Disposable.from(() => {
                root.remove();
                this.dropdownPart?.dispose?.();
                this.dropdownPart = null;
            }),
            addDisposableListener(
                root,
                'pointerdown',
                (event) => {
                    event.preventDefault();
                },
                { capture: true }
            ),
            addDisposableListener(root, 'click', (event) => {
                const el = document.createElement('div');
                el.style.overflow = 'auto';
                el.className = 'dv-tabs-overflow-container';

                for (const tab of this.tabs.tabs.filter((tab) =>
                    this._overflowTabs.includes(tab.panel.id)
                )) {
                    const panelObject = this.group.panels.find(
                        (panel) => panel === tab.panel
                    )!;

                    const tabComponent =
                        panelObject.view.createTabRenderer('headerOverflow');

                    const child = tabComponent.element;

                    const wrapper = document.createElement('div');
                    toggleClass(wrapper, 'dv-tab', true);
                    toggleClass(
                        wrapper,
                        'dv-active-tab',
                        panelObject.api.isActive
                    );
                    toggleClass(
                        wrapper,
                        'dv-inactive-tab',
                        !panelObject.api.isActive
                    );

                    wrapper.addEventListener('click', (event) => {
                        this.accessor.popupService.close();

                        if (event.defaultPrevented) {
                            return;
                        }

                        tab.element.scrollIntoView();
                        tab.panel.api.setActive();
                    });
                    wrapper.appendChild(child);

                    el.appendChild(wrapper);
                }

                const relativeParent = findRelativeZIndexParent(root);

                this.accessor.popupService.openPopover(el, {
                    x: event.clientX,
                    y: event.clientY,
                    zIndex: relativeParent?.style.zIndex
                        ? `calc(${relativeParent.style.zIndex} * 2)`
                        : undefined,
                });
            })
        );
    }

    updateDragAndDropState(): void {
        this.tabs.updateDragAndDropState();
        this.voidContainer.updateDragAndDropState();
    }
}
