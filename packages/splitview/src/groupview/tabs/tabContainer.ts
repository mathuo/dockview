import { IDisposable, CompositeDisposable } from "../../lifecycle";
import { addDisposableListener, Emitter, Event } from "../../events";
import { ITab, Tab } from "./tab";
import { removeClasses, addClasses, toggleClass } from "../../dom";
import { hasProcessed } from "../droptarget/droptarget";
import { TabDropEvent } from "../events";

import { IGroupview } from "../groupview";
import { IGroupAccessor } from "../../layout";
import { last } from "../../array";
import { DataTransferSingleton } from "../droptarget/dataTransfer";
import { IPanel } from "../panel/types";

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
  setActivePanel: (panel: IPanel) => void;
  isActive: (tab: ITab) => boolean;
  closePanel: (panel: IPanel) => void;
  openPanel: (panel: IPanel, index?: number) => void;
}

export class TabContainer extends CompositeDisposable implements ITabContainer {
  private tabContainer: HTMLElement;
  private _element: HTMLElement;
  private actionContainer: HTMLElement;

  private tabs: ITab[] = [];
  private selectedIndex: number = -1;
  private active: boolean;
  private activePanel: IPanel;

  private _visible: boolean = true;
  private _height: number;

  private readonly _onDropped = new Emitter<TabDropEvent>();
  readonly onDropEvent: Event<TabDropEvent> = this._onDropped.event;

  get visible() {
    return this._visible;
  }

  set visible(value: boolean) {
    this._visible = value;

    toggleClass(this.element, "hidden", !this._visible);
  }

  get height() {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
    this._element.style.height = `${this.height}px`;
  }

  public get element() {
    return this._element;
  }

  public isActive(tab: ITab) {
    return this.selectedIndex > -1 && this.tabs[this.selectedIndex] === tab;
  }

  public get hasActiveDragEvent() {
    return !!this.tabs.find((tab) => tab.hasActiveDragEvent);
  }

  public at(index: number) {
    return this.tabs[index];
  }

  public indexOf(tabOrId: ITab) {
    const id = typeof tabOrId === "string" ? tabOrId : tabOrId.id;
    return this.tabs.findIndex((tab) => tab.id === id);
  }

  constructor(private accessor: IGroupAccessor, private group: IGroupview) {
    super();

    this.addDisposables(this._onDropped);

    this._element = document.createElement("div");
    this._element.className = "title-container";

    this.height = 35;

    this.actionContainer = document.createElement("div");
    this.actionContainer.className = "action-container";

    const list = document.createElement("ul");
    list.className = "action-list";

    this.tabContainer = document.createElement("div");
    this.tabContainer.className = "tab-container";

    this._element.appendChild(this.tabContainer);
    this._element.appendChild(this.actionContainer);

    this.addDisposables(
      addDisposableListener(this.tabContainer, "dragenter", (event) => {
        if (!DataTransferSingleton.has(this.accessor.id)) {
          console.debug("[tabs] invalid drop event");
          return;
        }
        if (!last(this.tabs).hasActiveDragEvent) {
          addClasses(this.tabContainer, "drag-over-target");
        }
      }),
      addDisposableListener(this.tabContainer, "dragover", (event) => {
        event.preventDefault();
      }),
      addDisposableListener(this.tabContainer, "dragleave", (event) => {
        removeClasses(this.tabContainer, "drag-over-target");
      }),
      addDisposableListener(this.tabContainer, "drop", (event) => {
        if (!DataTransferSingleton.has(this.accessor.id)) {
          console.debug("[tabs] invalid drop event");
          return;
        }
        if (hasProcessed(event)) {
          console.debug("[tab] drop event already processed");
          return;
        }
        removeClasses(this.tabContainer, "drag-over-target");

        const activetab = this.tabs.find((tab) => tab.hasActiveDragEvent);

        const ignore = !!(
          activetab && event.composedPath().find((x) => activetab.element === x)
        );

        if (ignore) {
          console.debug("[tabs] ignore event");
          return;
        }

        this._onDropped.fire({
          event: { event, target: undefined },
        });
      })
    );
  }

  public setActive(isGroupActive: boolean) {
    this.active = isGroupActive;
  }

  private addTab(tab: ITab, index: number = this.tabs.length) {
    if (index < 0 || index > this.tabs.length) {
      throw new Error("invalid location");
    }

    this.tabContainer.insertBefore(
      tab.element,
      this.tabContainer.children[index]
    );

    this.tabs = [...this.tabs.slice(0, index), tab, ...this.tabs.slice(index)];

    if (this.selectedIndex < 0) {
      this.selectedIndex = index;
    }
  }

  public delete(id: string) {
    const index = this.tabs.findIndex((tab) => tab.id === id);

    const tab = this.tabs.splice(index, 1)[0];
    tab.element.remove();
  }

  public setActivePanel(panel: IPanel) {
    this.tabs.forEach((tab) => {
      const isActivePanel = panel.id === tab.id;
      tab.setActive(isActivePanel);
    });
  }

  public openPanel(panel: IPanel, index: number = this.tabs.length) {
    if (this.tabs.find((tab) => tab.id === panel.id)) {
      return;
    }
    const tab = new Tab(panel.id, this.accessor, this.group);
    tab.setContent(panel.header.element);

    // TODO - dispose of resources
    const disposables = CompositeDisposable.from(
      tab.onChanged((event) => {
        this.group.openPanel(panel);
      }),
      tab.onDropped((event) => {
        this._onDropped.fire({ event, index: this.indexOf(tab) });
      })
    );

    this.addTab(tab, index);
    this.activePanel = panel;
  }

  public closePanel(panel: IPanel) {
    this.delete(panel.id);
  }

  public dispose() {
    super.dispose();
  }
}
