import {
    IDisposable,
    CompositeDisposable,
    IValueDisposable,
} from '../../lifecycle';
import { addDisposableListener, Emitter, Event } from '../../events';
import { ITab, MouseEventKind, Tab } from '../panel/tab';
import { removeClasses, addClasses, toggleClass } from '../../dom';
import { DroptargetEvent, hasProcessed, Position } from '../../dnd/droptarget';

import { IGroupview } from '../groupview';
import { IComponentDockview } from '../../dockview';
import { last } from '../../array';
import { DataTransferSingleton } from '../../dnd/dataTransfer';
import { IGroupPanel } from '../panel/parts';
import { focusedElement } from '../../focusedElement';

export interface TabDropEvent {
    event: DroptargetEvent;
    index?: number;
}

export interface ITabContainer extends IDisposable {
    element: HTMLElement;
    visible: boolean;
    height: number;
    hasActiveDragEvent: boolean;
    delete: (id: string) => void;
    indexOf: (tabOrId: ITab | string) => number;
    at: (index: number) => ITab;
    onDropEvent: Event<TabDropEvent>;
    setActive: (isGroupActive: boolean) => void;
    setActivePanel: (panel: IGroupPanel) => void;
    isActive: (tab: ITab) => boolean;
    closePanel: (panel: IGroupPanel) => void;
    openPanel: (panel: IGroupPanel, index?: number) => void;
    setActionElement(element: HTMLElement): void;
}

export class TabContainer extends CompositeDisposable implements ITabContainer {
    private tabContainer: HTMLElement;
    private _element: HTMLElement;
    private actionContainer: HTMLElement;

    private tabs: IValueDisposable<ITab>[] = [];
    private selectedIndex: number = -1;
    private active = false;
    private activePanel: IGroupPanel | undefined;

    private _visible: boolean = true;
    private _height: number;

    private readonly _onDropped = new Emitter<TabDropEvent>();
    readonly onDropEvent: Event<TabDropEvent> = this._onDropped.event;

    get visible() {
        return this._visible;
    }

    set visible(value: boolean) {
        this._visible = value;

        toggleClass(this.element, 'hidden', !this._visible);
    }

    get height() {
        return this._height;
    }

    set height(value: number) {
        this._height = value;
        if (typeof value !== 'number') {
            // removeClasses(this.element, 'separator-border');
            this.element.style.removeProperty('--title-height');
        } else {
            // addClasses(this.element, 'separator-border');
            // if (styles?.separatorBorder) {
            this.element.style.setProperty('--title-height', `${value}px`);
            // }
        }
        // this._element.style.height = `${this.height}px`;
    }

    private actions: HTMLElement;

    setActionElement(element: HTMLElement): void {
        if (this.actions) {
            this.actions.remove();
            this.actions = undefined;
        }
        if (element) {
            this.actionContainer.appendChild(element);
            this.actions = element;
        }
    }

    public get element() {
        return this._element;
    }

    public isActive(tab: ITab) {
        return (
            this.selectedIndex > -1 &&
            this.tabs[this.selectedIndex].value === tab
        );
    }

    public get hasActiveDragEvent() {
        return !!this.tabs.find((tab) => tab.value.hasActiveDragEvent);
    }

    public at(index: number) {
        return this.tabs[index]?.value;
    }

    public indexOf(tabOrId: ITab | string): number {
        const id = typeof tabOrId === 'string' ? tabOrId : tabOrId.id;
        return this.tabs.findIndex((tab) => tab.value.id === id);
    }

    constructor(
        private accessor: IComponentDockview,
        private group: IGroupview,
        options: { tabHeight: number }
    ) {
        super();

        this.addDisposables(this._onDropped);

        this._element = document.createElement('div');
        this._element.className = 'title-container';

        this.height = options.tabHeight;

        this.actionContainer = document.createElement('div');
        this.actionContainer.className = 'action-container';

        this.tabContainer = document.createElement('div');
        this.tabContainer.className = 'tab-container';

        this._element.appendChild(this.tabContainer);
        this._element.appendChild(this.actionContainer);

        this.addDisposables(
            addDisposableListener(this.tabContainer, 'mousedown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }
                event.preventDefault();
                this.accessor.doSetGroupActive(this.group);
            }),
            addDisposableListener(this.tabContainer, 'dragenter', (event) => {
                if (!DataTransferSingleton.has(this.accessor.id)) {
                    console.debug('[tabs] invalid drop event');
                    return;
                }
                if (!last(this.tabs).value.hasActiveDragEvent) {
                    addClasses(this.tabContainer, 'drag-over-target');
                }
            }),
            addDisposableListener(this.tabContainer, 'dragover', (event) => {
                event.preventDefault();
            }),
            addDisposableListener(this.tabContainer, 'dragleave', (event) => {
                removeClasses(this.tabContainer, 'drag-over-target');
            }),
            addDisposableListener(this.tabContainer, 'drop', (event) => {
                if (!DataTransferSingleton.has(this.accessor.id)) {
                    console.debug('[tabs] invalid drop event');
                    return;
                }
                if (hasProcessed(event)) {
                    console.debug('[tab] drop event already processed');
                    return;
                }
                removeClasses(this.tabContainer, 'drag-over-target');

                const activetab = this.tabs.find(
                    (tab) => tab.value.hasActiveDragEvent
                );

                const ignore = !!(
                    activetab &&
                    event
                        .composedPath()
                        .find((x) => activetab.value.element === x)
                );

                if (ignore) {
                    console.debug('[tabs] ignore event');
                    return;
                }

                this._onDropped.fire({
                    event: { event, position: Position.Center },
                    index: this.tabs.length - 1,
                });
            })
        );
    }

    public setActive(isGroupActive: boolean) {
        this.active = isGroupActive;
    }

    private addTab(
        tab: IValueDisposable<ITab>,
        index: number = this.tabs.length
    ) {
        if (index < 0 || index > this.tabs.length) {
            throw new Error('invalid location');
        }

        this.tabContainer.insertBefore(
            tab.value.element,
            this.tabContainer.children[index]
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

    public delete(id: string) {
        const index = this.tabs.findIndex((tab) => tab.value.id === id);

        const tab = this.tabs.splice(index, 1)[0];

        const { value, disposable } = tab;

        disposable.dispose();
        value.element.remove();
    }

    public setActivePanel(panel: IGroupPanel) {
        this.tabs.forEach((tab) => {
            const isActivePanel = panel.id === tab.value.id;
            tab.value.setActive(isActivePanel);
        });
    }

    public openPanel(panel: IGroupPanel, index: number = this.tabs.length) {
        if (this.tabs.find((tab) => tab.value.id === panel.id)) {
            return;
        }
        const tab = new Tab(panel.id, this.accessor, this.group);
        tab.setContent(panel.header);

        const disposable = CompositeDisposable.from(
            tab.onChanged((event) => {
                const alreadyFocused =
                    panel.id === this.group.activePanel?.id &&
                    this.group.isAncestor(focusedElement.element);
                switch (event.kind) {
                    case MouseEventKind.CLICK:
                        this.group.setPanel(panel, alreadyFocused);
                        break;
                }
                this.accessor.fireMouseEvent({ ...event, panel, tab: true });
            }),
            tab.onDropped((event) => {
                this._onDropped.fire({ event, index: this.indexOf(tab) });
            })
        );

        const value: IValueDisposable<ITab> = { value: tab, disposable };

        this.addTab(value, index);
        this.activePanel = panel;
    }

    public closePanel(panel: IGroupPanel) {
        this.delete(panel.id);
    }

    public dispose() {
        super.dispose();

        this.tabs.forEach((tab) => {
            tab.disposable.dispose();
        });
        this.tabs = [];
    }
}
