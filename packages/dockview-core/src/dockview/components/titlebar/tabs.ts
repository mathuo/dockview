import { getPanelData } from '../../../dnd/dataTransfer';
import {
    isChildEntirelyVisibleWithinParent,
    OverflowObserver,
    toggleClass,
} from '../../../dom';
import { addDisposableListener, Emitter, Event } from '../../../events';
import {
    CompositeDisposable,
    Disposable,
    IValueDisposable,
    MutableDisposable,
} from '../../../lifecycle';
import { createChevronRightButton } from '../../../svg';
import { DockviewComponent } from '../../dockviewComponent';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { WillShowOverlayLocationEvent } from '../../dockviewGroupPanelModel';
import { DockviewPanel, IDockviewPanel } from '../../dockviewPanel';
import { Tab } from '../tab/tab';
import { TabDragEvent, TabDropIndexEvent } from './tabsContainer';

type DropdownElement = {
    element: HTMLElement;
    update: (params: { tabs: number }) => void;
    dispose?: () => void;
};

function createDropdownElementHandle(): DropdownElement {
    const el = document.createElement('div');
    el.className = 'dv-tabs-overflow-dropdown-default';

    const text = document.createElement('span');
    text.textContent = ``;
    const icon = createChevronRightButton();
    el.appendChild(icon);
    el.appendChild(text);

    return {
        element: el,
        update: (params: { tabs: number }) => {
            text.textContent = `${params.tabs}`;
        },
    };
}

export class Tabs extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly _tabsList: HTMLElement;

    private tabs: IValueDisposable<Tab>[] = [];
    private selectedIndex = -1;

    private readonly _dropdownDisposable = new MutableDisposable();

    private readonly _onTabDragStart = new Emitter<TabDragEvent>();
    readonly onTabDragStart: Event<TabDragEvent> = this._onTabDragStart.event;

    private readonly _onDrop = new Emitter<TabDropIndexEvent>();
    readonly onDrop: Event<TabDropIndexEvent> = this._onDrop.event;

    private readonly _onWillShowOverlay =
        new Emitter<WillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<WillShowOverlayLocationEvent> =
        this._onWillShowOverlay.event;

    private dropdownPart: DropdownElement | null = null;
    private _overflowTabs: string[] = [];

    get element(): HTMLElement {
        return this._element;
    }

    get panels(): string[] {
        return this.tabs.map((_) => _.value.panel.id);
    }

    get size(): number {
        return this.tabs.length;
    }

    constructor(
        private readonly group: DockviewGroupPanel,
        private readonly accessor: DockviewComponent
    ) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'dv-tabs-panel dv-horizontal';
        this._element.style.display = 'flex';
        this._element.style.overflow = 'auto';
        this._tabsList = document.createElement('div');
        this._tabsList.className = 'dv-tabs-container';
        this._element.appendChild(this._tabsList);

        const observer = new OverflowObserver(this._tabsList);

        this.addDisposables(
            this._dropdownDisposable,
            this._onWillShowOverlay,
            this._onDrop,
            this._onTabDragStart,
            observer,
            observer.onDidChange((event) => {
                const hasOverflow = event.hasScrollX || event.hasScrollY;
                this.toggleDropdown({ reset: !hasOverflow });
            }),
            addDisposableListener(this._tabsList, 'scroll', () => {
                this.toggleDropdown({ reset: false });
            }),
            addDisposableListener(this.element, 'pointerdown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }

                const isLeftClick = event.button === 0;

                if (isLeftClick) {
                    this.accessor.doSetGroupActive(this.group);
                }
            }),
            Disposable.from(() => {
                for (const { value, disposable } of this.tabs) {
                    disposable.dispose();
                    value.dispose();
                }

                this.tabs = [];
            })
        );
    }

    indexOf(id: string): number {
        return this.tabs.findIndex((tab) => tab.value.panel.id === id);
    }

    isActive(tab: Tab): boolean {
        return (
            this.selectedIndex > -1 &&
            this.tabs[this.selectedIndex].value === tab
        );
    }

    setActivePanel(panel: IDockviewPanel): void {
        let runningWidth = 0;

        for (const tab of this.tabs) {
            const isActivePanel = panel.id === tab.value.panel.id;
            tab.value.setActive(isActivePanel);

            if (isActivePanel) {
                const element = tab.value.element;
                const parentElement = element.parentElement!;

                if (
                    runningWidth < parentElement.scrollLeft ||
                    runningWidth + element.clientWidth >
                        parentElement.scrollLeft + parentElement.clientWidth
                ) {
                    parentElement.scrollLeft = runningWidth;
                }
            }

            runningWidth += tab.value.element.clientWidth;
        }
    }

    openPanel(panel: IDockviewPanel, index: number = this.tabs.length): void {
        if (this.tabs.find((tab) => tab.value.panel.id === panel.id)) {
            return;
        }
        const tab = new Tab(panel, this.accessor, this.group);
        tab.setContent(panel.view.tab);

        const disposable = new CompositeDisposable(
            tab.onDragStart((event) => {
                this._onTabDragStart.fire({ nativeEvent: event, panel });
            }),
            tab.onPointerDown((event) => {
                if (event.defaultPrevented) {
                    return;
                }

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

                    this.accessor.addFloatingGroup(panel as DockviewPanel, {
                        x: left - rootLeft,
                        y: top - rootTop,
                        inDragMode: true,
                    });
                    return;
                }

                switch (event.button) {
                    case 0: // left click or touch
                        if (this.group.activePanel !== panel) {
                            this.group.model.openPanel(panel);
                        }
                        break;
                }
            }),
            tab.onDrop((event) => {
                this._onDrop.fire({
                    event: event.nativeEvent,
                    index: this.tabs.findIndex((x) => x.value === tab),
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

        const value: IValueDisposable<Tab> = { value: tab, disposable };

        this.addTab(value, index);
    }

    delete(id: string): void {
        const index = this.indexOf(id);
        const tabToRemove = this.tabs.splice(index, 1)[0];

        const { value, disposable } = tabToRemove;

        disposable.dispose();
        value.dispose();
        value.element.remove();
    }

    private addTab(
        tab: IValueDisposable<Tab>,
        index: number = this.tabs.length
    ): void {
        if (index < 0 || index > this.tabs.length) {
            throw new Error('invalid location');
        }

        this._tabsList.insertBefore(
            tab.value.element,
            this._tabsList.children[index]
        );

        this.tabs = [
            ...this.tabs.slice(0, index),
            tab,
            ...this.tabs.slice(index),
        ];

        if (this.selectedIndex < 0) {
            this.selectedIndex = index;
        }
    }

    private toggleDropdown(options: { reset: boolean }): void {
        const tabs = options.reset
            ? []
            : this.tabs
                  .filter(
                      (tab) =>
                          !isChildEntirelyVisibleWithinParent(
                              tab.value.element,
                              this._tabsList
                          )
                  )
                  .map((x) => x.value.panel.id);

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
        this.element.appendChild(root);

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

                this.tabs
                    .filter((tab) =>
                        this._overflowTabs.includes(tab.value.panel.id)
                    )
                    .map((tab) => {
                        const panelObject = this.group.panels.find(
                            (panel) => panel === tab.value.panel
                        )!;

                        const tabComponent =
                            panelObject.view.createTabRenderer(
                                'headerOverflow'
                            );

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

                        wrapper.addEventListener('mousedown', () => {
                            this.accessor.popupService.close();
                            tab.value.element.scrollIntoView();
                            tab.value.panel.api.setActive();
                        });
                        wrapper.appendChild(child);

                        el.appendChild(wrapper);
                    });

                this.accessor.popupService.openPopover(el, {
                    x: event.clientX,
                    y: event.clientY,
                });
            })
        );
    }
}
