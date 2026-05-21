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
import {
    addClasses,
    findRelativeZIndexParent,
    removeClasses,
    toggleClass,
} from '../../../dom';
import { IDockviewPanel } from '../../dockviewPanel';
import { DockviewComponent } from '../../dockviewComponent';
import { DockviewWillShowOverlayLocationEvent } from '../../events';
import { getPanelData } from '../../../dnd/dataTransfer';
import { Tabs } from './tabs';
import {
    createDropdownElementHandle,
    DropdownElement,
} from './tabOverflowControl';
import { DockviewHeaderDirection } from '../../options';
import { applyTabGroupAccent } from '../../tabGroupAccent';

export interface TabDropIndexEvent {
    readonly event: DragEvent | PointerEvent;
    readonly index: number;
    readonly targetTabGroupId?: string | null;
}

export interface TabDragEvent {
    /** Narrow with `instanceof DragEvent` before reading `dataTransfer`. */
    readonly nativeEvent: DragEvent | PointerEvent;
    readonly panel: IDockviewPanel;
}

export interface GroupDragEvent {
    /** Narrow with `instanceof DragEvent` before reading `dataTransfer`. */
    readonly nativeEvent: DragEvent | PointerEvent;
    readonly group: DockviewGroupPanel;
}

export interface ITabsContainer extends IDisposable {
    readonly element: HTMLElement;
    readonly panels: string[];
    readonly size: number;
    readonly onDrop: Event<TabDropIndexEvent>;
    readonly onTabDragStart: Event<TabDragEvent>;
    readonly onGroupDragStart: Event<GroupDragEvent>;
    readonly onWillShowOverlay: Event<DockviewWillShowOverlayLocationEvent>;
    hidden: boolean;
    direction: DockviewHeaderDirection;
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
    updateTabGroups(): void;
    refreshTabGroupAccent(): void;
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
    private _direction: DockviewHeaderDirection = 'horizontal';

    private dropdownPart: DropdownElement | null = null;
    private _overflowTabs: string[] = [];
    private _overflowTabGroups: string[] = [];
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
        new Emitter<DockviewWillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<DockviewWillShowOverlayLocationEvent> =
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

    get direction(): DockviewHeaderDirection {
        return this._direction;
    }

    set direction(value: DockviewHeaderDirection) {
        this._direction = value;
        if (value === 'vertical') {
            addClasses(this._element, 'dv-groupview-header-vertical');
            addClasses(
                this.rightActionsContainer,
                'dv-right-actions-container-vertical'
            );
            this.tabs.direction = value;
        } else {
            removeClasses(this._element, 'dv-groupview-header-vertical');
            removeClasses(
                this.rightActionsContainer,
                'dv-right-actions-container-vertical'
            );
            this.tabs.direction = value;
        }
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
        this.tabs.voidContainer = this.voidContainer.element;

        this._element.appendChild(this.preActionsContainer);
        this._element.appendChild(this.tabs.element);
        this._element.appendChild(this.leftActionsContainer);
        this._element.appendChild(this.voidContainer.element);
        this._element.appendChild(this.rightActionsContainer);

        this.tabs.setExtendedDropZone(this._element);

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
                // If an active group drag is in progress, let Tabs handle it
                if (this.tabs.handleVoidDrop()) {
                    return;
                }
                this._onDrop.fire({
                    event: event.nativeEvent,
                    index: this.tabs.size,
                });
            }),
            this.voidContainer.onWillShowOverlay((event) => {
                this._onWillShowOverlay.fire(
                    new DockviewWillShowOverlayLocationEvent(event, {
                        kind: 'header_space',
                        panel: this.group.activePanel,
                        api: this.accessor.api,
                        group: this.group,
                        getData: getPanelData,
                    })
                );
            }),
            addDisposableListener(
                this.leftActionsContainer,
                'dragleave',
                (event) => {
                    const related = event.relatedTarget as HTMLElement | null;
                    if (
                        !this.leftActionsContainer.contains(related) &&
                        !this._element.contains(related)
                    ) {
                        // Left the header entirely
                        this.tabs.clearExternalAnimState();
                    }
                }
            ),
            addDisposableListener(
                this.voidContainer.element,
                'dragleave',
                (event) => {
                    const related = event.relatedTarget as HTMLElement | null;
                    if (!this.voidContainer.element.contains(related)) {
                        if (this._element.contains(related)) {
                            // Moved to another part of the header — keep state
                            this.tabs.setExternalInsertionIndex(null);
                        } else {
                            // Left the header entirely
                            this.tabs.clearExternalAnimState();
                        }
                    }
                }
            ),
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
                        this.group.api.location.type !== 'floating' &&
                        this.group.api.location.type !== 'edge'
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

    private toggleDropdown(options: {
        tabs: string[];
        tabGroups: string[];
        reset: boolean;
    }): void {
        const tabs = options.reset ? [] : options.tabs;
        const tabGroups = options.reset ? [] : options.tabGroups;
        this._overflowTabs = tabs;
        this._overflowTabGroups = tabGroups;

        const totalCount = this._overflowTabs.length;

        if (totalCount > 0 && this.dropdownPart) {
            this.dropdownPart.update({ tabs: totalCount });
            return;
        }

        if (totalCount === 0) {
            this._dropdownDisposable.dispose();
            return;
        }

        const root = document.createElement('div');
        root.className = 'dv-tabs-overflow-dropdown-root';

        const part = createDropdownElementHandle();
        part.update({ tabs: totalCount });

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

                // Build lookup: panelId → tabGroup for overflow groups
                const overflowGroupSet = new Set(this._overflowTabGroups);
                const allTabGroups = this.group.model.getTabGroups();
                const panelToGroup = new Map<
                    string,
                    (typeof allTabGroups)[0]
                >();
                for (const tg of allTabGroups) {
                    if (overflowGroupSet.has(tg.id)) {
                        for (const pid of tg.panelIds) {
                            panelToGroup.set(pid, tg);
                        }
                    }
                }

                // Track which groups have already been rendered
                const renderedGroups = new Set<string>();

                for (const tab of this.tabs.tabs.filter((tab) =>
                    this._overflowTabs.includes(tab.panel.id)
                )) {
                    const tg = panelToGroup.get(tab.panel.id);

                    // If this tab belongs to an overflow group, render the
                    // group header before its first member tab.
                    if (tg && !renderedGroups.has(tg.id)) {
                        renderedGroups.add(tg.id);

                        const groupHeader = document.createElement('div');
                        groupHeader.className = 'dv-tabs-overflow-group-header';

                        const colorDot = document.createElement('span');
                        colorDot.className = 'dv-tabs-overflow-group-color';
                        applyTabGroupAccent(
                            colorDot,
                            tg.color,
                            this.accessor.tabGroupColorPalette
                        );
                        groupHeader.appendChild(colorDot);

                        const labelSpan = document.createElement('span');
                        labelSpan.className = 'dv-tabs-overflow-group-label';
                        labelSpan.textContent = tg.label || tg.id;
                        groupHeader.appendChild(labelSpan);

                        if (tg.collapsed) {
                            const badge = document.createElement('span');
                            badge.className =
                                'dv-tabs-overflow-group-collapsed-badge';
                            badge.textContent = `${tg.panelIds.length}`;
                            groupHeader.appendChild(badge);
                        }

                        groupHeader.addEventListener('click', () => {
                            this.accessor
                                .getPopupServiceForGroup(this.group)
                                .close();
                            if (tg.collapsed) {
                                tg.expand();
                            }
                            // Activate the first panel in the group
                            const firstPanelId = tg.panelIds[0];
                            if (firstPanelId) {
                                const panel = this.group.panels.find(
                                    (p) => p.id === firstPanelId
                                );
                                panel?.api.setActive();
                            }
                        });

                        el.appendChild(groupHeader);
                    }

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
                    if (tg) {
                        toggleClass(wrapper, 'dv-tab--grouped', true);
                    }

                    wrapper.addEventListener('click', (event) => {
                        this.accessor
                            .getPopupServiceForGroup(this.group)
                            .close();

                        if (event.defaultPrevented) {
                            return;
                        }

                        if (tg?.collapsed) {
                            tg.expand();
                        }
                        tab.element.scrollIntoView();
                        tab.panel.api.setActive();
                    });
                    wrapper.appendChild(child);

                    el.appendChild(wrapper);
                }

                const relativeParent = findRelativeZIndexParent(root);

                this.accessor
                    .getPopupServiceForGroup(this.group)
                    .openPopover(el, {
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

    updateTabGroups(): void {
        this.tabs.updateTabGroups();
    }

    refreshTabGroupAccent(): void {
        this.tabs.refreshTabGroupAccent();
    }
}
