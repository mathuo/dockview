import { getPanelData } from '../../../dnd/dataTransfer';
import { OverflowObserver } from '../../../dom';
import { addDisposableListener, Emitter, Event } from '../../../events';
import {
    CompositeDisposable,
    Disposable,
    IValueDisposable,
} from '../../../lifecycle';
import { DockviewComponent } from '../../dockviewComponent';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { WillShowOverlayLocationEvent } from '../../dockviewGroupPanelModel';
import { DockviewPanel, IDockviewPanel } from '../../dockviewPanel';
import { Tab } from '../tab/tab';
import { TabDragEvent, TabDropIndexEvent } from './tabsContainer';

export class Tabs extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly _tabsList: HTMLElement;

    private tabs: IValueDisposable<Tab>[] = [];
    private selectedIndex = -1;
    private _hasOverflow = false;
    private _dropdownAnchor: HTMLElement | null = null;

    private readonly _onTabDragStart = new Emitter<TabDragEvent>();
    readonly onTabDragStart: Event<TabDragEvent> = this._onTabDragStart.event;

    private readonly _onDrop = new Emitter<TabDropIndexEvent>();
    readonly onDrop: Event<TabDropIndexEvent> = this._onDrop.event;

    private readonly _onWillShowOverlay =
        new Emitter<WillShowOverlayLocationEvent>();
    readonly onWillShowOverlay: Event<WillShowOverlayLocationEvent> =
        this._onWillShowOverlay.event;

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
        this._element.className = 'dv-tabs-panel';
        this._element.style.display = 'flex';
        this._element.style.overflow = 'auto';
        this._tabsList = document.createElement('div');
        this._tabsList.className = 'dv-tabs-container';
        this._element.appendChild(this._tabsList);

        const observer = new OverflowObserver(this._tabsList);

        this.addDisposables(
            observer,
            observer.onDidChange((event) => {
                const hasOverflow = event.hasScrollX || event.hasScrollY;
                if (this._hasOverflow !== hasOverflow) {
                    this.toggleDropdown(hasOverflow);
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
        this.tabs.forEach((tab) => {
            const isActivePanel = panel.id === tab.value.panel.id;
            tab.value.setActive(isActivePanel);
        });
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

                    this.accessor.addFloatingGroup(panel as DockviewPanel, {
                        x: left - rootLeft,
                        y: top - rootTop,
                        inDragMode: true,
                    });
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

    private toggleDropdown(show: boolean): void {
        this._hasOverflow = show;

        if (this._dropdownAnchor) {
            this._dropdownAnchor.remove();
            this._dropdownAnchor = null;
        }

        if (!show) {
            return;
        }

        this._dropdownAnchor = document.createElement('div');
        this._dropdownAnchor.className = 'dv-tabs-overflow-handle';

        this.element.appendChild(this._dropdownAnchor);

        addDisposableListener(this._dropdownAnchor, 'click', (event) => {
            const el = document.createElement('div');
            el.style.overflow = 'auto';
            el.className =
                'dv-tabs-and-actions-container dv-tabs-container dv-tabs-overflow-container';

            this.tabs.map((tab) => {
                const child = tab.value.element.cloneNode(true);

                const wrapper = document.createElement('div');

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
        });
    }
}
