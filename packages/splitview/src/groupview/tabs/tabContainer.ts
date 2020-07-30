import { IDisposable, CompositeDisposable } from "../../types";
import { addDisposableListener, Emitter, Event } from "../../events";
import { ITab, Tab } from "./tab";
import { removeClasses, addClasses, toggleClass } from "../../dom";
import { hasProcessed } from "../droptarget/droptarget";
import { TabDropEvent } from "../events";
import { IPanel } from "../group";
import { IGroupview } from "../groupview";
import { IGroupAccessor } from "../../layout";

export interface ITabContainer extends IDisposable {
  element: HTMLElement;
  hasActiveDragEvent: boolean;
  addTab: (tab: ITab, index?: number) => void;
  delete: (id: string) => void;
  indexOf: (tabOrId: ITab | string) => number;
  at: (index: number) => ITab;
  onDropped: Event<TabDropEvent>;
  setActive: (isGroupActive: boolean) => void;
  setActivePanel: (panel: IPanel) => void;
  isActive: (tab: ITab) => boolean;
  closePanel: (panel: IPanel) => void;
  openPanel: (panel: IPanel, index?: number) => void;
}

export class TabContainer extends CompositeDisposable implements ITabContainer {
  private _element: HTMLElement;

  private tabs: ITab[] = [];
  private selectedIndex: number = -1;
  private active: boolean;

  private readonly _onDropped = new Emitter<TabDropEvent>();
  readonly onDropped: Event<TabDropEvent> = this._onDropped.event;

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
    this._element.className = "tab-container";

    this.addDisposables(
      addDisposableListener(this._element, "dragenter", (event) => {
        if (!this.tabs[this.tabs.length - 1].hasActiveDragEvent) {
          addClasses(this._element, "drag-over-target");
        }
      }),
      addDisposableListener(this._element, "dragover", (event) => {
        event.preventDefault();
      }),
      addDisposableListener(this._element, "dragleave", (event) => {
        removeClasses(this.element, "drag-over-target");
      }),
      addDisposableListener(this._element, "drop", (event) => {
        if (hasProcessed(event)) {
          console.debug("tab drop event has already been processed");
          return;
        }
        removeClasses(this.element, "drag-over-target");

        const {
          groupId,
          itemId,
        }: { groupId: string; itemId: string } = JSON.parse(
          event.dataTransfer.getData("text/plain")
        );

        if (this.group.id === groupId) {
          const index = this.tabs.findIndex((tab) => tab.id === itemId);
          if (index > -1) {
            if (index === this.tabs.length - 1) {
              console.log("last");
              return;
            }
          }
        }

        const activetab = this.tabs.find((tab) => tab.hasActiveDragEvent);

        const ignore = !!(
          activetab && event.composedPath().find((x) => activetab.element === x)
        );

        if (ignore) {
          console.log("drag el in path");
          return;
        }

        this._onDropped.fire({
          groupId,
          itemId,
          target: undefined,
        });
      })
    );
  }

  public setActive(isGroupActive: boolean) {
    this.active = isGroupActive;

    toggleClass(this.element, "active", isGroupActive);
    toggleClass(this.element, "inactive", !isGroupActive);
  }

  public addTab(tab: ITab, index: number = this.tabs.length) {
    if (index < 0 || index > this.tabs.length) {
      throw new Error("invalid location");
    }

    this.element.insertBefore(tab.element, this.element.children[index]);

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
    // panel.
  }

  public openPanel(panel: IPanel, index: number = this.tabs.length) {
    const tab = new Tab(panel.id, this.group.id);
    tab.setContent(panel.header);

    const disposables = CompositeDisposable.from(
      tab.onChanged((event) => {
        this.group.openPanel(panel);
      }),
      tab.onDropped((event) => {
        const group = this.accessor.getGroup(event.groupId);

        this.accessor.moveGroup(
          this.group,
          event.groupId,
          event.itemId,
          event.target,
          this.indexOf(tab)
        );
      })
    );

    this.addTab(tab, index);
  }

  public closePanel(panel: IPanel) {}

  public dispose() {
    super.dispose();
  }

  private redraw() {
    this.group.panels.forEach((panel, i) => {
      const isTabActive = this.group.isActive(panel);
      const isGroupActive = this.isActive;
    });
  }
}
