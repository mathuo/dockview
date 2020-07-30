import { IDisposable, CompositeDisposable } from "../types";
import { ITabContainer, TabContainer } from "./tabs/tabContainer";
import { IContentContainer, ContentContainer } from "./content";
import { IGridView } from "../gridview/gridview";
import { Tab } from "./tabs/tab";
import { Target, Droptarget } from "./droptarget/droptarget";
import { Event, Emitter } from "../events";
import { IPanel, Group, ClosePanelResult } from "./group";
import { IGroupAccessor } from "../layout";
import { toggleClass } from "../dom";

export const DRAG_TYPE = "group_drag";

export const enum GroupChangeKind {
  /* Group Changes */
  GROUP_ACTIVE,
  GROUP_INDEX,

  /* Editor Changes */
  EDITOR_OPEN,
  EDITOR_CLOSE,
  EDITOR_MOVE,
  EDITOR_ACTIVE,
  EDITOR_LABEL,
  EDITOR_PIN,
  EDITOR_DIRTY,
}

type GroupItemSelectedEvent = {
  groupId: string;
  itemId: string;
};

export interface IGroupItem {
  id: string;
  header: { element: HTMLElement };
  body: { element: HTMLElement };
}

export interface IHub {
  getGroup: (id: string) => IGroupview;
}

class Hub implements IHub {
  public getGroup(id: string): IGroupview {
    return null;
  }
}

type GroupMoveEvent = {
  groupId: string;
  itemId: string;
  target: Target;
  index?: number;
};

type EditorCloseEvent = {};

export interface IGroupview extends IDisposable, IGridView {
  id: string;
  openPanel(panel: IPanel, index?: number): void;
  closePanel(panel: IPanel): Promise<void>;
  remove: (panelOrId: IPanel | string) => IPanel;
  size: number;
  setActive: (isActive: boolean) => void;
  active: boolean;
  isActive: (panel: IPanel) => boolean;
  onMove: Event<GroupMoveEvent>;
  onDidGroupChange: Event<{ kind: GroupChangeKind }>;
  panels: IPanel[];
}

export class Groupview extends CompositeDisposable implements IGroupview {
  private _element: HTMLElement;
  private _group: Group;

  private tabContainer: ITabContainer;
  private contentContainer: IContentContainer;
  private _active: boolean;
  private activePanel: IPanel;
  private dropTarget: Droptarget;

  private _panels: IPanel[] = [];

  private readonly _onMove = new Emitter<GroupMoveEvent>();
  readonly onMove: Event<GroupMoveEvent> = this._onMove.event;

  private readonly _onWillCloseEditor = new Emitter<EditorCloseEvent>();
  readonly onWillCloseEditor: Event<EditorCloseEvent> = this._onWillCloseEditor
    .event;

  private readonly _onDidGroupChange = new Emitter<{
    kind: GroupChangeKind;
  }>();
  readonly onDidGroupChange: Event<{ kind: GroupChangeKind }> = this
    ._onDidGroupChange.event;

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

  get minimumHeight() {
    return 100;
  }

  get maximumHeight() {
    return 1000;
  }

  get minimumWidth() {
    return 100;
  }

  get maximumWidth() {
    return 1000;
  }

  constructor(private accessor: IGroupAccessor, public id: string) {
    super();

    this.addDisposables(this._onMove);

    this._element = document.createElement("div");
    this._element.className = "groupview";
    this._element.tabIndex = -1;

    this.tabContainer = new TabContainer(this.accessor, this);

    this.addDisposables(
      this.tabContainer.onDropped((event) => {
        this._onMove.fire(event);
      })
    );

    this.contentContainer = new ContentContainer();

    this.addDisposables(
      this.contentContainer.onDidFocus(() => {
        this.accessor.doSetGroupActive(this);
      })
    );

    this.dropTarget = new Droptarget(this.contentContainer.element, {
      isDirectional: true,
      isDisabled: () => {
        // disable the drop target if we only have one tab, and that is also the tab we are moving
        return (
          this._panels.length === 1 && this.tabContainer.hasActiveDragEvent
        );
      },
    });

    this.addDisposables(
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

    this._element.append(
      this.tabContainer.element,
      this.contentContainer.element
    );
  }

  public isActive(panel: IPanel) {
    return this.activePanel === panel;
  }

  public setActive(isActive: boolean) {
    this._active = isActive;

    toggleClass(this.element, "active", isActive);
    toggleClass(this.element, "inactive", !isActive);

    this.tabContainer.setActive(this._active);

    this.panels.forEach((panel) => panel.setVisible(this._active, this));

    // this.activePanel.setVisible(this._active, this);

    this._onDidGroupChange.fire({ kind: GroupChangeKind.GROUP_ACTIVE });
  }

  public remove(groupItemOrId: IPanel | string): IPanel {
    const id =
      typeof groupItemOrId === "string" ? groupItemOrId : groupItemOrId.id;

    const panelToRemove = this._panels.find((panel) => panel.id === id);

    const index = this._panels.indexOf(panelToRemove);
    let nextIndex: number;

    if (this.activePanel === panelToRemove) {
      nextIndex = index < this._panels.length - 1 ? index + 1 : index - 1;
      this.contentContainer.closePanel();
    }

    this.tabContainer.delete(id);

    if (nextIndex > -1) {
      nextIndex = Math.max(nextIndex, this._panels.length - 1);
      const nextPanel = this._panels[nextIndex];
      this.contentContainer.openPanel(nextPanel);
      this.activePanel = nextPanel;
      this.activePanel.setVisible(this.active, this);
    }

    this._panels.splice(index, 1);

    return panelToRemove;
  }

  public openPanel(panel: IPanel, index?: number) {
    if (this.activePanel === panel) {
      this.accessor.doSetGroupActive(this);
      return;
    }

    const existingPanel = this._panels.indexOf(panel);

    this.contentContainer.openPanel(panel);

    if (existingPanel < 0) {
      this.tabContainer.openPanel(panel, index);
      this._panels = [
        ...this._panels.splice(0, index),
        panel,
        ...this._panels.splice(index),
      ];
    }

    this.tabContainer.setActivePanel(panel);

    const oldPanel = this.activePanel;

    this.activePanel = panel;

    this.accessor.doSetGroupActive(this);

    oldPanel?.setVisible(false, this);
  }

  public closePanel = async (panel: IPanel) => {
    const closeResult = await panel.close();

    if (closeResult === ClosePanelResult.DONT_CLOSE) {
      return;
    }

    if (this.isActive(panel)) {
      this.doCloseActivePanel();
    } else {
      this.doCloseInactivePanel(panel);
    }

    this.tabContainer.closePanel(panel);
  };

  private doCloseActivePanel() {
    const panelToClose = this.activePanel;
  }

  private doCloseInactivePanel(panel: IPanel) {
    // this._group.closePanel(panel);
  }

  public layout(size: number, orthogonalSize: number) {}

  public dispose() {
    this.dispose();

    this.dropTarget.dispose();
    this.tabContainer.dispose();
    this.contentContainer.dispose();
  }
}
