import { getPanelData } from '../../../dnd/dataTransfer';
import {
    isChildEntirelyVisibleWithinParent,
    OverflowObserver,
} from '../../../dom';
import { addDisposableListener, Emitter, Event } from '../../../events';
import {
    CompositeDisposable,
    Disposable,
    IValueDisposable,
    MutableDisposable,
} from '../../../lifecycle';
import { Scrollbar } from '../../../scrollbar';
import { DockviewComponent } from '../../dockviewComponent';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { WillShowOverlayLocationEvent } from '../../dockviewGroupPanelModel';
import { DockviewPanel, IDockviewPanel } from '../../dockviewPanel';
import { Tab } from '../tab/tab';
import { TabDragEvent, TabDropIndexEvent } from './tabsContainer';

export class Tabs extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly _tabsList: HTMLElement;
    private readonly _observerDisposable = new MutableDisposable();

    private _tabs: IValueDisposable<Tab>[] = [];
    private selectedIndex = -1;
    private _showTabsOverflowControl = false;

    private readonly _onTabDragStart = new Emitter<TabDragEvent>();
    readonly onTabDragStart: Event<TabDragEvent> = this._onTabDragStart.event;

    private readonly _onDrop = new Emitter<TabDropIndexEvent>();
    readonly onDrop: Event<TabDropIndexEvent> = this._onDrop.event;

    private readonly _onWillShowOverlay =
        new Emitter<WillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<WillShowOverlayLocationEvent> =
        this._onWillShowOverlay.event;

    private readonly _onOverflowTabsChange = new Emitter<{
        tabs: string[];
        reset: boolean;
    }>();
    readonly onOverflowTabsChange = this._onOverflowTabsChange.event;

    get showTabsOverflowControl(): boolean {
        return this._showTabsOverflowControl;
    }

    set showTabsOverflowControl(value: boolean) {
        if (this._showTabsOverflowControl == value) {
            return;
        }

        this._showTabsOverflowControl = value;

        if (value) {
            const observer = new OverflowObserver(this._tabsList);

            this._observerDisposable.value = new CompositeDisposable(
                observer,
                observer.onDidChange((event) => {
                    const hasOverflow = event.hasScrollX || event.hasScrollY;
                    this.toggleDropdown({ reset: !hasOverflow });
                }),
                addDisposableListener(this._tabsList, 'scroll', () => {
                    this.toggleDropdown({ reset: false });
                })
            );
        }
    }

    get element(): HTMLElement {
        return this._element;
    }

    get panels(): string[] {
        return this._tabs.map((_) => _.value.panel.id);
    }

    get size(): number {
        return this._tabs.length;
    }

    get tabs(): Tab[] {
        return this._tabs.map((_) => _.value);
    }

    constructor(
        private readonly group: DockviewGroupPanel,
        private readonly accessor: DockviewComponent,
        options: {
            showTabsOverflowControl: boolean;
        }
    ) {
        super();

        this._tabsList = document.createElement('div');
        this._tabsList.className = 'dv-tabs-container dv-horizontal';
        this._tabsList.ariaOrientation = 'horizontal';

        this.showTabsOverflowControl = options.showTabsOverflowControl;

        if (accessor.options.scrollbars === 'native') {
            this._element = this._tabsList;
        } else {
            const scrollbar = new Scrollbar(this._tabsList);
            this._element = scrollbar.element;
            this.addDisposables(scrollbar);
        }

        this.element.role = 'tablist';
        this.element.ariaLabel =
            'Use the Left Arrow to select the previous tab, Right Arrow for the next tab, Home for the first tab, and End for the last tab. Press Enter to select the focused tab.';

        this.addDisposables(
            this._onOverflowTabsChange,
            this._observerDisposable,
            this._onWillShowOverlay,
            this._onDrop,
            this._onTabDragStart,
            this.accessor.onDidActivePanelChange((e) => {
                if (e?.api.group === this.group) {
                    this.selectedIndex = this.indexOf(e.id);
                } else {
                    this.selectedIndex = -1;
                }
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
            addDisposableListener(this.element, 'keydown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }

                let tab: IValueDisposable<Tab> | undefined = undefined;

                switch (event.key) {
                    case 'ArrowLeft': {
                        if (this.selectedIndex > 0) {
                            tab = this._tabs[this.selectedIndex - 1];
                        }
                        break;
                    }
                    case 'ArrowRight': {
                        if (this.selectedIndex + 1 < this.size) {
                            tab = this._tabs[this.selectedIndex + 1];
                        }
                        break;
                    }
                    case 'Home':
                        tab = this._tabs[0];
                        break;
                    case 'End':
                        tab = this._tabs[this.size - 1];
                        break;
                }

                if (tab == null) {
                    return;
                }

                tab.value.element.focus();
                this.group.model.openPanel(tab.value.panel);
            }),
            Disposable.from(() => {
                for (const { value, disposable } of this._tabs) {
                    disposable.dispose();
                    value.dispose();
                }

                this._tabs = [];
            })
        );
    }

    indexOf(id: string): number {
        return this._tabs.findIndex((tab) => tab.value.panel.id === id);
    }

    isActive(tab: Tab): boolean {
        return (
            this.selectedIndex > -1 &&
            this._tabs[this.selectedIndex].value === tab
        );
    }

    setActivePanel(panel: IDockviewPanel): void {
        let runningWidth = 0;

        for (const tab of this._tabs) {
            const isActivePanel = panel.id === tab.value.panel.id;
            tab.value.setActive(isActivePanel);
            tab.value.panel.runEvents();

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

    openPanel(panel: IDockviewPanel, index: number = this._tabs.length): void {
        if (this._tabs.find((tab) => tab.value.panel.id === panel.id)) {
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
                    index: this._tabs.findIndex((x) => x.value === tab),
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
        const tabToRemove = this._tabs.splice(index, 1)[0];

        const { value, disposable } = tabToRemove;

        disposable.dispose();
        value.dispose();
        value.element.remove();
    }

    private addTab(
        tab: IValueDisposable<Tab>,
        index: number = this._tabs.length
    ): void {
        if (index < 0 || index > this._tabs.length) {
            throw new Error('invalid location');
        }

        this._tabsList.insertBefore(
            tab.value.element,
            this._tabsList.children[index]
        );

        this._tabs = [
            ...this._tabs.slice(0, index),
            tab,
            ...this._tabs.slice(index),
        ];

        if (this.selectedIndex < 0) {
            this.selectedIndex = index;
        }
    }

    private toggleDropdown(options: { reset: boolean }): void {
        const tabs = options.reset
            ? []
            : this._tabs
                  .filter(
                      (tab) =>
                          !isChildEntirelyVisibleWithinParent(
                              tab.value.element,
                              this._tabsList
                          )
                  )
                  .map((x) => x.value.panel.id);

        this._onOverflowTabsChange.fire({ tabs, reset: options.reset });
    }
}
