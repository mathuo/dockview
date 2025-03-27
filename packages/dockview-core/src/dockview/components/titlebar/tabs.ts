import {
    DroptargetOptions,
    WillShowOverlayEvent,
} from '../../../dnd/droptarget';
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
import { WillShowOverlayLocationEvent } from '../../dockviewGroupPanelModel';
import { ITabRenderer } from '../../types';
import { Tab, TabDragHandler } from '../tab/tab';
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

    private readonly _onSelected = new Emitter<void>();
    readonly onSelected: Event<void> = this._onSelected.event;

    private readonly _onTabPointDown = new Emitter<{
        tab: Tab;
        event: MouseEvent;
    }>();
    readonly onTabPointDown: Event<{ tab: Tab; event: MouseEvent }> =
        this._onTabPointDown.event;

    private readonly _onTabWillShowOverlay = new Emitter<{
        tab: Tab;
        event: WillShowOverlayEvent;
    }>();
    readonly onTabWillShowOverlay: Event<{
        tab: Tab;
        event: WillShowOverlayEvent;
    }> = this._onTabWillShowOverlay.event;

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
        return this._tabs.map((_) => _.value.id);
    }

    get size(): number {
        return this._tabs.length;
    }

    get tabs(): Tab[] {
        return this._tabs.map((_) => _.value);
    }

    constructor(
        private readonly id: string,
        private readonly groupId: string,
        private readonly dropTargetOptions: DroptargetOptions,
        options: {
            scrollbars?: 'native' | 'custom';
            showTabsOverflowControl: boolean;
        }
    ) {
        super();

        this._tabsList = document.createElement('div');
        this._tabsList.className = 'dv-tabs-container dv-horizontal';

        this.showTabsOverflowControl = options.showTabsOverflowControl;

        if (options.scrollbars === 'native') {
            this._element = this._tabsList;
        } else {
            const scrollbar = new Scrollbar(this._tabsList);
            this._element = scrollbar.element;
            this.addDisposables(scrollbar);
        }

        this.addDisposables(
            this._onOverflowTabsChange,
            this._observerDisposable,
            this._onWillShowOverlay,
            this._onDrop,
            this._onTabDragStart,
            this._onSelected,
            this._onTabPointDown,
            this._onTabWillShowOverlay,
            addDisposableListener(this.element, 'pointerdown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }

                const isLeftClick = event.button === 0;

                if (isLeftClick) {
                    this._onSelected.fire();
                }
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
        return this._tabs.findIndex((tab) => tab.value.id === id);
    }

    isActive(tab: Tab): boolean {
        return (
            this.selectedIndex > -1 &&
            this._tabs[this.selectedIndex].value === tab
        );
    }

    setActivePanel(id: string): void {
        let runningWidth = 0;

        for (const tab of this._tabs) {
            const isActivePanel = id === tab.value.id;
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

    openPanel(
        id: string,
        view: ITabRenderer,
        index: number = this._tabs.length
    ): void {
        if (this._tabs.find((tab) => tab.value.id === id)) {
            return;
        }
        const tab = new Tab(
            id,
            new TabDragHandler(this._element, this.id, this.groupId, id),
            this.dropTargetOptions
        );
        tab.setContent(view);

        const disposable = new CompositeDisposable(
            tab.onDragStart((event) => {
                this._onTabDragStart.fire({ nativeEvent: event, id });
            }),
            tab.onPointerDown((event) => {
                this._onTabPointDown.fire({ tab, event });
            }),
            tab.onDrop((event) => {
                this._onDrop.fire({
                    event: event.nativeEvent,
                    index: this._tabs.findIndex((x) => x.value === tab),
                });
            }),
            tab.onWillShowOverlay((event) => {
                this._onTabWillShowOverlay.fire({ tab, event });
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
                  .map((x) => x.value.id);

        this._onOverflowTabsChange.fire({ tabs, reset: options.reset });
    }
}
