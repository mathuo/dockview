import {
    IDisposable,
    CompositeDisposable,
    IValueDisposable,
} from '../../lifecycle';
import { addDisposableListener, Emitter, Event } from '../../events';
import { ITab, MouseEventKind, Tab } from '../tab';
import { last } from '../../array';
import { IGroupPanel } from '../groupPanel';
import { IDockviewComponent } from '../../dockview/dockviewComponent';
import { getPanelData } from '../../dnd/dataTransfer';
import { GroupviewPanel } from '../groupviewPanel';
import { Droptarget } from '../../dnd/droptarget';
import { DockviewDropTargets } from '../groupview';

export interface TabDropIndexEvent {
    event: DragEvent;
    readonly index: number;
}

export interface ITabsContainer extends IDisposable {
    readonly element: HTMLElement;
    readonly panels: string[];
    readonly size: number;
    height: number | undefined;
    delete: (id: string) => void;
    indexOf: (id: string) => number;
    at: (index: number) => ITab;
    onDrop: Event<TabDropIndexEvent>;
    setActive: (isGroupActive: boolean) => void;
    setActivePanel: (panel: IGroupPanel) => void;
    isActive: (tab: ITab) => boolean;
    closePanel: (panel: IGroupPanel) => void;
    openPanel: (panel: IGroupPanel, index?: number) => void;
    setActionElement(element: HTMLElement | undefined): void;
    show(): void;
    hide(): void;
}

export class TabsContainer
    extends CompositeDisposable
    implements ITabsContainer
{
    private readonly _element: HTMLElement;
    private readonly tabContainer: HTMLElement;
    private readonly voidContainer: HTMLElement;
    private readonly actionContainer: HTMLElement;

    private readonly voidDropTarget: Droptarget;

    private tabs: IValueDisposable<ITab>[] = [];
    private selectedIndex = -1;
    private active = false;
    private activePanel: IGroupPanel | undefined;
    private actions: HTMLElement | undefined;

    private _height: number | undefined;

    private readonly _onDrop = new Emitter<TabDropIndexEvent>();
    readonly onDrop: Event<TabDropIndexEvent> = this._onDrop.event;

    get panels() {
        return this.tabs.map((_) => _.value.panelId);
    }

    get size() {
        return this.tabs.length;
    }

    get height(): number | undefined {
        return this._height;
    }

    set height(value: number | undefined) {
        this._height = value;
        if (typeof value !== 'number') {
            this.element.style.removeProperty(
                '--dv-tabs-and-actions-container-height'
            );
        } else {
            this.element.style.setProperty(
                '--dv-tabs-and-actions-container-height',
                `${value}px`
            );
        }
    }

    show() {
        this.element.style.display = '';
    }

    hide() {
        this.element.style.display = 'none';
    }

    setActionElement(element: HTMLElement | undefined): void {
        if (this.actions === element) {
            return;
        }
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

    public at(index: number) {
        return this.tabs[index]?.value;
    }

    public indexOf(id: string): number {
        return this.tabs.findIndex((tab) => tab.value.panelId === id);
    }

    constructor(
        private accessor: IDockviewComponent,
        private group: GroupviewPanel,
        options: { tabHeight?: number }
    ) {
        super();

        this.addDisposables(this._onDrop);

        this._element = document.createElement('div');
        this._element.className = 'tabs-and-actions-container';

        this.height = options.tabHeight;

        this.actionContainer = document.createElement('div');
        this.actionContainer.className = 'action-container';

        this.tabContainer = document.createElement('div');
        this.tabContainer.className = 'tabs-container';

        this.voidContainer = document.createElement('div');
        this.voidContainer.className = 'void-container';

        this._element.appendChild(this.tabContainer);
        this._element.appendChild(this.voidContainer);
        this._element.appendChild(this.actionContainer);

        this.voidDropTarget = new Droptarget(this.voidContainer, {
            validOverlays: 'none',
            canDisplayOverlay: (event) => {
                const data = getPanelData();

                if (data) {
                    // don't show the overlay if the tab being dragged is the last panel of this group
                    return last(this.tabs)?.value.panelId !== data.panelId;
                }

                return group.model.canDisplayOverlay(
                    event,
                    DockviewDropTargets.Panel
                );
            },
        });

        this.addDisposables(
            this.voidDropTarget.onDrop((event) => {
                this._onDrop.fire({
                    event: event.event,
                    index: this.tabs.length,
                });
            }),
            this.voidDropTarget,
            addDisposableListener(this.tabContainer, 'mousedown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }

                const isLeftClick = event.button === 0;

                if (isLeftClick) {
                    this.accessor.doSetGroupActive(this.group);
                }
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
        const index = this.tabs.findIndex((tab) => tab.value.panelId === id);

        const tabToRemove = this.tabs.splice(index, 1)[0];

        const { value, disposable } = tabToRemove;

        disposable.dispose();
        value.element.remove();
    }

    public setActivePanel(panel: IGroupPanel) {
        this.tabs.forEach((tab) => {
            const isActivePanel = panel.id === tab.value.panelId;
            tab.value.setActive(isActivePanel);
        });
    }

    public openPanel(panel: IGroupPanel, index: number = this.tabs.length) {
        if (this.tabs.find((tab) => tab.value.panelId === panel.id)) {
            return;
        }
        const tabToAdd = new Tab(panel.id, this.accessor, this.group);
        if (!panel.view?.tab) {
            throw new Error('invalid header component');
        }
        tabToAdd.setContent(panel.view.tab);

        const disposable = CompositeDisposable.from(
            tabToAdd.onChanged((event) => {
                const alreadyFocused =
                    panel.id === this.group.model.activePanel?.id &&
                    this.group.model.isContentFocused();
                this.accessor.fireMouseEvent({ ...event, panel, tab: true });

                const isLeftClick = event.event.button === 0;

                if (!isLeftClick || event.event.defaultPrevented) {
                    return;
                }

                switch (event.kind) {
                    case MouseEventKind.CLICK:
                        this.group.model.openPanel(panel, {
                            skipFocus: alreadyFocused,
                        });
                        break;
                }
            }),
            tabToAdd.onDrop((event) => {
                this._onDrop.fire({
                    event: event.event,
                    index: this.tabs.findIndex((x) => x.value === tabToAdd),
                });
            })
        );

        const value: IValueDisposable<ITab> = { value: tabToAdd, disposable };

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
