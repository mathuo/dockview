import { IDisposable, CompositeDisposable } from "../lifecycle";
import { ITabContainer, TabContainer } from "./tabs/tabContainer";
import { IContentContainer, ContentContainer } from "./content";
import { IGridView } from "../gridview/gridview";
import { Target, Droptarget } from "./droptarget/droptarget";
import { Event, Emitter, addDisposableListener } from "../events";
import { IGroupAccessor, Layout } from "../layout";
import { toggleClass } from "../dom";
import { ClosePanelResult, WatermarkPart } from "./panel/parts";
import { IPanel } from "./panel/types";
import { timeoutPromise } from "../async";

export const enum GroupChangeKind {
  GROUP_ACTIVE = "GROUP_ACTIVE",
  ADD_GROUP = "ADD_GROUP",
  REMOVE_GROUP = "REMOVE_GROUP",
  //
  ADD_PANEL = "ADD_PANEL",
  REMOVE_PANEL = "REMOVE_PANEL",
  PANEL_OPEN = "PANEL_OPEN",
  PANEL_CLOSE = "PANEL_CLOSE",
  PANEL_ACTIVE = "PANEL_ACTIVE",
  //
  NEW_LAYOUT = "NEW_LAYOUT",
  LAYOUT = "LAYOUT",
  //
  PANEL_CREATED = "PANEL_CREATED",
  PANEL_DESTROYED = "PANEL_DESTROYED",
  PANEL_DIRTY = "PANEL_DIRTY",
  PANEL_CLEAN = "PANEL_CLEAN",
}

export interface IGroupItem {
  id: string;
  header: { element: HTMLElement };
  body: { element: HTMLElement };
}

type GroupMoveEvent = {
  groupId: string;
  itemId: string;
  target: Target;
  index?: number;
};

export interface GroupOptions {
  panels: IPanel[];
  activePanel?: IPanel;
}

export interface GroupChangeEvent {
  kind: GroupChangeKind;
  panel?: IPanel;
}

export interface IGroupview extends IDisposable, IGridView {
  id: string;
  size: number;
  active: boolean;
  onDidGroupChange: Event<{ kind: GroupChangeKind }>;
  panels: IPanel[];
  tabHeight: number;
  open(panel: IPanel, index?: number): void;
  close(panel: IPanel): Promise<boolean>;
  closeAll(): Promise<boolean>;
  contains(panel: IPanel): boolean;
  remove: (panelOrId: IPanel | string) => IPanel;
  setActive: (isActive: boolean) => void;
  isActive: (panel: IPanel) => boolean;
  onMove: Event<GroupMoveEvent>;
}

export class Groupview extends CompositeDisposable implements IGroupview {
  private _element: HTMLElement;

  private tabContainer: ITabContainer;
  private contentContainer: IContentContainer;
  private _active: boolean;
  private activePanel: IPanel;
  private dropTarget: Droptarget;
  private watermark: WatermarkPart;

  private _width: number;
  private _height: number;

  private _panels: IPanel[] = [];

  private readonly _onMove = new Emitter<GroupMoveEvent>();
  readonly onMove: Event<GroupMoveEvent> = this._onMove.event;

  private readonly _onDidGroupChange = new Emitter<GroupChangeEvent>();
  readonly onDidGroupChange: Event<{ kind: GroupChangeKind }> = this
    ._onDidGroupChange.event;

  get tabHeight() {
    return this.tabContainer.height;
  }

  set tabHeight(height: number) {
    this.tabContainer.height = height;
  }

  get active() {
    return this._active;
  }

  get panels() {
    return this._panels;
  }

  get element() {
    return this._element;
  }

  get size() {
    return this._panels.length;
  }

  get isEmpty() {
    return this._panels.length === 0;
  }

  get minimumHeight() {
    return 100;
  }

  get maximumHeight() {
    return Number.MAX_SAFE_INTEGER;
  }

  get minimumWidth() {
    return 100;
  }

  get maximumWidth() {
    return Number.MAX_SAFE_INTEGER;
  }

  public toJSON(): object {
    return {
      views: this.panels.map((panel) => panel.id),
      activeView: this.activePanel?.id,
    };
  }

  public contains(panel: IPanel) {
    return this.panels.includes(panel);
  }

  constructor(
    private accessor: IGroupAccessor,
    public id: string,
    private options?: GroupOptions
  ) {
    super();

    this.addDisposables(this._onMove);

    this._element = document.createElement("div");
    this._element.className = "groupview";
    this._element.tabIndex = -1;

    this.tabContainer = new TabContainer(this.accessor, this);
    this.contentContainer = new ContentContainer();
    this.dropTarget = new Droptarget(this.contentContainer.element, {
      isDirectional: true,
      id: this.accessor.id,
      isDisabled: () => {
        // disable the drop target if we only have one tab, and that is also the tab we are moving
        return (
          this._panels.length === 1 && this.tabContainer.hasActiveDragEvent
        );
      },
    });

    this._element.append(
      this.tabContainer.element,
      this.contentContainer.element
    );

    this.addDisposables(
      this._onMove,
      this._onDidGroupChange,
      this.tabContainer.onDropEvent((event) => {
        this._onMove.fire(event);
      }),
      this.contentContainer.onDidFocus(() => {
        this.accessor.doSetGroupActive(this);
      }),
      this.dropTarget.onDidChange((event) => {
        // if we've center dropped on ourself then ignore
        if (
          event.target === Target.Center &&
          this.tabContainer.hasActiveDragEvent
        ) {
          return;
        }

        const {
          groupId,
          itemId,
        }: { groupId: string; itemId: string } = JSON.parse(
          event.event.dataTransfer.getData("text/plain")
        );
        setTimeout(() => {
          this._onMove.fire({ groupId, itemId, target: event.target });
        }, 0);
      })
    );

    if (options?.panels) {
      options.panels.forEach((panel) => {
        this.open(panel);
      });
    }
    if (options?.activePanel) {
      this.open(options?.activePanel);
    }

    this.updateContainer();
  }

  public open(panel: IPanel, index?: number) {
    if (this.activePanel === panel) {
      this.accessor.doSetGroupActive(this);
      return;
    }

    this.doAddPanel(panel, index);

    this.tabContainer.openPanel(panel, index);
    this.contentContainer.openPanel(panel.content.element);

    this.doSetActivePanel(panel);
    this.accessor.doSetGroupActive(this);

    this.updateContainer();
  }

  public remove(groupItemOrId: IPanel | string): IPanel {
    const id =
      typeof groupItemOrId === "string" ? groupItemOrId : groupItemOrId.id;

    const panel = this._panels.find((panel) => panel.id === id);

    if (!panel) {
      throw new Error("invalid operation");
    }

    return this.removePanel(panel);
  }

  public async closeAll() {
    const index = this.panels.indexOf(this.activePanel);

    if (index > -1) {
      if (this.panels.indexOf(this.activePanel) < 0) {
        console.warn("active panel not tracked");
      }

      const canClose =
        !this.activePanel.close ||
        (await this.activePanel.close()) === ClosePanelResult.CLOSE;
      if (!canClose) {
        return false;
      }
    }

    for (let i = 0; i < this.panels.length; i++) {
      if (i === index) {
        continue;
      }
      const panel = this.panels[i];
      this.open(panel);

      if (panel.close) {
        await timeoutPromise(0);
        const canClose = (await panel.close()) === ClosePanelResult.CLOSE;
        if (!canClose) {
          return false;
        }
      }
    }

    if (this.panels.length > 0) {
      // take a copy since we will be edting the array as we iterate through
      const arrPanelCpy = [...this.panels];
      await Promise.all(arrPanelCpy.map((p) => this.doClose(p)));
    } else {
      this.accessor.remove(this);
    }

    return true;
  }

  public close = async (panel: IPanel) => {
    if (panel.close && (await panel.close()) === ClosePanelResult.DONT_CLOSE) {
      return false;
    }

    this.doClose(panel);
    return true;
  };

  private doClose(panel: IPanel) {
    this.remove(panel);

    (this.accessor as Layout).unregisterPanel(panel);

    panel.dispose();

    if (this.panels.length === 0) {
      this.accessor.remove(this);
    }
  }

  public isActive(panel: IPanel) {
    return this.activePanel === panel;
  }

  public setActive(isActive: boolean) {
    if (this._active === isActive) {
      return;
    }

    this._active = isActive;

    toggleClass(this.element, "active", isActive);
    toggleClass(this.element, "inactive", !isActive);

    this.tabContainer.setActive(this._active);

    if (!this.activePanel && this.panels.length > 0) {
      this.doSetActivePanel(this.panels[0]);
    }

    this.panels.forEach((panel) => panel.setVisible(this._active, this));

    if (this.watermark?.setVisible) {
      this.watermark.setVisible(this._active, this);
    }

    if (isActive) {
      this._onDidGroupChange.fire({ kind: GroupChangeKind.GROUP_ACTIVE });
    }
  }

  public layout(width: number, height: number) {
    this._width = width;
    this._height = height;

    if (this.activePanel?.layout) {
      this.activePanel.layout(this._width, this._height);
    }
  }

  private removePanel(panel: IPanel) {
    const index = this._panels.indexOf(panel);

    const isActivePanel = this.activePanel === panel;

    this.doRemovePanel(panel);

    if (isActivePanel && this.panels.length > 0) {
      const nextPanel = this.panels[Math.max(0, index - 1)];
      this.open(nextPanel);
    }

    if (this.activePanel && this.panels.length === 0) {
      this.activePanel = undefined;
    }

    this.updateContainer();
    return panel;
  }

  private doRemovePanel(panel: IPanel) {
    const index = this.panels.indexOf(panel);

    if (this.activePanel === panel) {
      this.contentContainer.closePanel();
    }

    this.tabContainer.delete(panel.id);
    this._panels.splice(index, 1);

    this._onDidGroupChange.fire({ kind: GroupChangeKind.REMOVE_PANEL, panel });
  }

  private doAddPanel(panel: IPanel, index?: number) {
    const existingPanel = this._panels.indexOf(panel);
    const hasExistingPabel = existingPanel > -1;

    if (hasExistingPabel) {
      return;
    }

    this._panels = [
      ...this._panels.splice(0, index),
      panel,
      ...this._panels.splice(index),
    ];

    this._onDidGroupChange.fire({ kind: GroupChangeKind.ADD_PANEL });
  }

  private doSetActivePanel(panel: IPanel) {
    this.activePanel = panel;
    this.tabContainer.setActivePanel(panel);
    this._onDidGroupChange.fire({ kind: GroupChangeKind.PANEL_ACTIVE });
  }

  private updateContainer() {
    toggleClass(this.element, "empty", this.isEmpty);

    if (this.accessor.options.watermarkComponent && !this.watermark) {
      const WatermarkComponent = this.accessor.options.watermarkComponent;
      this.watermark = new WatermarkComponent();
      this.watermark.init({ accessor: this.accessor });
    }

    this.panels.forEach((panel) => panel.setVisible(this._active, this));

    if (this.isEmpty && !this.watermark?.element.parentNode) {
      addDisposableListener(this.watermark.element, "click", () => {
        if (!this._active) {
          this.accessor.doSetGroupActive(this);
        }
      });

      this.contentContainer.openPanel(this.watermark.element);

      this.watermark.setVisible(true, this);
    }
    if (!this.isEmpty && this.watermark.element.parentNode) {
      this.watermark.dispose();
      this.watermark = undefined;
      this.contentContainer.closePanel();
    }
  }

  public dispose() {
    for (const panel of this.panels) {
      panel.dispose();
    }

    super.dispose();

    this.dropTarget.dispose();
    this.tabContainer.dispose();
    this.contentContainer.dispose();
  }
}
