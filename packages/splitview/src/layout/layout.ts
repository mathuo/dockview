import { Gridview, getRelativeLocation } from "../gridview/gridview";
import { Target } from "../groupview/droptarget/droptarget";
import { getGridLocation } from "../gridview/gridview";
import { tail, sequenceEquals } from "../array";
import {
  IGroupview,
  Groupview,
  GroupOptions,
  GroupChangeKind,
  GroupChangeEvent,
} from "../groupview/groupview";
import { IPanel } from "../groupview/panel/types";
import { DefaultPanel } from "../groupview/panel/panel";
import { CompositeDisposable, IValueDisposable } from "../lifecycle";
import { Event, Emitter } from "../events";
import { Watermark } from "./watermark/watermark";
import { timeoutPromise } from "../async";
import { DebugWidget } from "./debug/debug";
import { PanelContentPartConstructor } from "../groupview/panel/parts";
import { debounce } from "../functions";
import { sequentialNumberGenerator } from "../math";
import { DefaultDeserializer, IPanelDeserializer } from "./deserializer";
import { createContentComponent, createTabComponent } from "./componentFactory";
import { AddGroupOptions, AddPanelOptions, LayoutOptions } from "./options";

const nextGroupId = sequentialNumberGenerator();
const nextLayoutId = sequentialNumberGenerator();

export type PanelReference = {
  update: (event: { params: { [key: string]: any } }) => void;
  remove: () => void;
};

export interface Api {
  layout(width: number, height: number): void;
  //
  addPanelFromComponent(
    componentName: string | PanelContentPartConstructor,
    options: AddPanelOptions
  ): PanelReference;
  addEmptyGroup(options?: AddGroupOptions);
  closeAll: () => Promise<boolean>;
  //
  setAutoResizeToFit(enabled: boolean): void;
  resizeToFit(): void;
  setTabHeight(height: number): void;
  groupCount: number;
  panelCount: number;
  // lifecycle
  toJSON(): object;
  deserialize: (data: object) => void;
  deserializer: IPanelDeserializer;
  // events
  onDidLayoutChange: Event<GroupChangeEvent>;
}

export interface IGroupAccessor {
  id: string;
  getGroup: (id: string) => IGroupview;
  moveGroup(
    referenceGroup: IGroupview,
    groupId: string,
    itemId: string,
    target: Target,
    index?: number
  ): void;
  doSetGroupActive: (group: IGroupview) => void;
  remove: (group: IGroupview) => void;
  groupCount: number;
  panelCount: number;
  options: LayoutOptions;
  onDidLayoutChange: Event<GroupChangeEvent>;
}

export interface ILayout extends IGroupAccessor, Api {}

export class Layout extends CompositeDisposable implements ILayout {
  private readonly _element: HTMLElement;
  private readonly _id = nextLayoutId.next();
  private readonly groups = new Map<string, IValueDisposable<IGroupview>>();
  private readonly panels = new Map<string, IValueDisposable<IPanel>>();
  private readonly gridview: Gridview = new Gridview();
  private readonly dirtyPanels = new Set<IPanel>();
  private readonly debouncedDeque = debounce(this.persist.bind(this), 5000);
  // events
  private readonly _onDidLayoutChange = new Emitter<GroupChangeEvent>();
  readonly onDidLayoutChange: Event<GroupChangeEvent> = this._onDidLayoutChange
    .event;
  // everything else
  private _size: number;
  private _orthogonalSize: number;
  private _activeGroup: IGroupview;
  private _deserializer: IPanelDeserializer;
  private resizeTimer: NodeJS.Timer;
  private debugContainer: DebugWidget;
  private panelState = {};

  constructor(public readonly options: LayoutOptions) {
    super();

    this._element = document.createElement("div");
    this._element.appendChild(this.gridview.element);

    if (!this.options.components) {
      this.options.components = {};
    }
    if (!this.options.frameworkComponents) {
      this.options.frameworkComponents = {};
    }
    if (!this.options.frameworkTabComponents) {
      this.options.frameworkTabComponents = {};
    }
    if (!this.options.tabComponents) {
      this.options.tabComponents = {};
    }
    if (!this.options.watermarkComponent) {
      this.options.watermarkComponent = Watermark;
    }

    this.addDisposables(
      this.gridview.onDidChange((e) => {
        this._onDidLayoutChange.fire({ kind: GroupChangeKind.LAYOUT });
      })
    );

    this.updateContainer();
  }
  get panelCount() {
    return this.panels.size;
  }

  get deserializer() {
    return this._deserializer;
  }

  set deserializer(value: IPanelDeserializer) {
    this._deserializer = value;
  }

  get id() {
    return this._id;
  }

  get groupCount() {
    return this.groups.size;
  }

  get element() {
    return this._element;
  }

  public registerPanel(panel: IPanel) {
    if (this.panels.has(panel.id)) {
      throw new Error(`panel ${panel.id} already exists`);
    }

    const disposable = new CompositeDisposable(
      panel.onDidStateChange((e) => this.addDirtyPanel(panel))
    );

    this.panels.set(panel.id, { value: panel, disposable });

    this._onDidLayoutChange.fire({ kind: GroupChangeKind.PANEL_CREATED });
  }

  public unregisterPanel(panel: IPanel) {
    if (!this.panels.has(panel.id)) {
      throw new Error(`panel ${panel.id} doesn't exist`);
    }
    const { disposable, value: unregisteredPanel } = this.panels.get(panel.id);

    disposable.dispose();
    unregisteredPanel.dispose();

    this.panels.delete(panel.id);

    this._onDidLayoutChange.fire({ kind: GroupChangeKind.PANEL_DESTROYED });
  }

  /**
   * Serialize the current state of the layout
   *
   * @returns A JSON respresentation of the layout
   */
  public toJSON() {
    const data = this.gridview.serialize();

    const state = { ...this.panelState };

    const panels = Array.from(this.panels.values()).reduce(
      (collection, panel) => {
        if (!this.panelState[panel.value.id]) {
          collection[panel.value.id] = panel.value.toJSON();
        }
        return collection;
      },
      state
    );

    return { grid: data, panels };
  }

  public deserialize(data: any) {
    this.gridview.clear();
    this.panels.forEach((panel) => {
      panel.disposable.dispose();
      panel.value.dispose();
    });
    this.panels.clear();
    this.groups.clear();

    this.fromJSON(data, this.deserializer);
    this.gridview.layout(this._size, this._orthogonalSize);
  }

  public fromJSON(data: any, deserializer: IPanelDeserializer) {
    const { grid, panels } = data;

    this.gridview.deserialize(
      grid,
      new DefaultDeserializer(this, {
        createPanel: (id) => {
          const panelData = panels[id];
          const panel = deserializer.fromJSON(panelData);
          this.registerPanel(panel);
          return panel;
        },
      })
    );
    this._onDidLayoutChange.fire({ kind: GroupChangeKind.NEW_LAYOUT });
  }

  public async closeAll() {
    for (const entry of this.groups.entries()) {
      const [key, group] = entry;

      const didCloseAll = await group.value.closeAll();
      if (!didCloseAll) {
        return false;
      }
      await timeoutPromise(0);
    }
    return true;
  }

  public setTabHeight(height: number) {
    this.groups.forEach((value) => {
      value.value.tabHeight = height;
    });
  }

  public setAutoResizeToFit(enabled: boolean) {
    if (this.resizeTimer) {
      clearInterval(this.resizeTimer);
    }
    if (enabled) {
      this.resizeTimer = setInterval(() => {
        this.resizeToFit();
      }, 500);
    }
  }

  /**
   * Resize the layout to fit the parent container
   */
  public resizeToFit() {
    const {
      width,
      height,
    } = this.element.parentElement.getBoundingClientRect();
    this.layout(width, height);
  }

  public addPanelFromComponent(
    componentName: string | PanelContentPartConstructor,
    options: AddPanelOptions
  ): PanelReference {
    const component = createContentComponent(
      componentName,
      this.options.components,
      this.options.frameworkComponents,
      this.options.frameworkPanelWrapper.createContentWrapper
    );
    const tabComponent = createTabComponent(
      options.tabComponentName,
      this.options.tabComponents,
      this.options.frameworkTabComponents,
      this.options.frameworkPanelWrapper.createTabWrapper
    );

    const panel = new DefaultPanel(options.id, tabComponent, component);
    panel.init({
      title: options.title,
      suppressClosable: options?.suppressClosable,
      params: options?.params || {},
    });

    this.registerPanel(panel);

    if (options.position?.referencePanel) {
      const referencePanel = this.panels.get(options.position.referencePanel)
        .value;
      const referenceGroup = this.findGroup(referencePanel);

      const target = this.toTarget(options.position.direction);
      if (target === Target.Center) {
        referenceGroup.open(panel);
      } else {
        const location = getGridLocation(referenceGroup.element);
        const relativeLocation = getRelativeLocation(
          this.gridview.orientation,
          location,
          target
        );
        this.addPanelToNewGroup(panel, relativeLocation);
      }
    } else {
      this.addPanelToNewGroup(panel);
    }

    return {
      update: (event: { params: { [key: string]: any } }) => {
        if (panel.update) {
          panel.update({ params: event.params });
        }
      },
      remove: () => {
        const group = this.findGroup(panel);
        group.remove(panel);
      },
    };
  }

  public addEmptyGroup(options: AddGroupOptions) {
    const group = this.createGroup();

    if (options) {
      const referencePanel = this.panels.get(options.referencePanel).value;
      const referenceGroup = this.findGroup(referencePanel);

      const target = this.toTarget(options.direction);

      const location = getGridLocation(referenceGroup.element);
      const relativeLocation = getRelativeLocation(
        this.gridview.orientation,
        location,
        target
      );
      this.doAddGroup(group, relativeLocation);
    } else {
      this.doAddGroup(group);
    }
  }

  public getGroup(id: string) {
    return this.groups.get(id)?.value;
  }

  public remove(group: IGroupview) {
    if (this.groups.size === 1) {
      group.panels.forEach((panel) => group.remove(panel));
      this._activeGroup = group;
      return;
    }

    if (group === this._activeGroup) {
      this._activeGroup = undefined;
    }
    this.doRemoveGroup(group);
  }

  private addPanelToNewGroup(panel: IPanel, location: number[] = [0]) {
    let group: IGroupview;

    if (
      this.groups.size === 1 &&
      Array.from(this.groups.values())[0].value.size === 0
    ) {
      group = Array.from(this.groups.values())[0].value;
    } else {
      group = this.createGroup();
      this.doAddGroup(group, location);
    }

    group.open(panel);
  }

  private doAddGroup(group: IGroupview, location: number[] = [0]) {
    this.gridview.addView(group, { type: "distribute" }, location);
    this._onDidLayoutChange.fire({ kind: GroupChangeKind.ADD_GROUP });
    this.doSetGroupActive(group);
  }

  private doRemoveGroup(
    group: IGroupview,
    options?: { skipActive?: boolean; skipDispose?: boolean }
  ) {
    if (!this.groups.has(group.id)) {
      throw new Error("invalid operation");
    }

    const { disposable } = this.groups.get(group.id);

    if (!options?.skipDispose) {
      disposable.dispose();
      this.groups.delete(group.id);
    }

    const view = this.gridview.remove(group, { type: "distribute" });
    this._onDidLayoutChange.fire({ kind: GroupChangeKind.REMOVE_GROUP });

    if (!options?.skipActive && this.groups.size > 0) {
      this.doSetGroupActive(Array.from(this.groups.values())[0].value);
    }

    return view;
  }

  public doSetGroupActive(group: IGroupview) {
    if (this._activeGroup && this._activeGroup !== group) {
      this._activeGroup.setActive(false);
    }
    group.setActive(true);
    this._activeGroup = group;
  }

  public moveGroup(
    referenceGroup: IGroupview,
    groupId: string,
    itemId: string,
    target: Target,
    index?: number
  ) {
    const sourceGroup = this.groups.get(groupId).value;

    switch (target) {
      case Target.Center:
      case undefined:
        const groupItem = sourceGroup.remove(itemId);
        if (sourceGroup.size === 0) {
          this.doRemoveGroup(sourceGroup);
        }
        referenceGroup.open(groupItem, index);

        return;
    }

    const referenceLocation = getGridLocation(referenceGroup.element);
    const targetLocation = getRelativeLocation(
      this.gridview.orientation,
      referenceLocation,
      target
    );

    if (sourceGroup.size < 2) {
      const [targetParentLocation, to] = tail(targetLocation);
      const sourceLocation = getGridLocation(sourceGroup.element);
      const [sourceParentLocation, from] = tail(sourceLocation);

      if (sequenceEquals(sourceParentLocation, targetParentLocation)) {
        // special case when 'swapping' two views within same grid location
        // if a group has one tab - we are essentially moving the 'group'
        // which is equivalent to swapping two views in this case
        this.gridview.moveView(sourceParentLocation, from, to);

        return;
      }

      // source group will become empty so delete the group
      // TODO - this doesn't work on linked groups
      const targetGroup = this.doRemoveGroup(sourceGroup, {
        skipActive: true,
        skipDispose: true,
      }) as IGroupview;

      // after deleting the group we need to re-evaulate the ref location
      const updatedReferenceLocation = getGridLocation(referenceGroup.element);
      const location = getRelativeLocation(
        this.gridview.orientation,
        updatedReferenceLocation,
        target
      );
      this.doAddGroup(targetGroup, location);
    } else {
      const groupItem = sourceGroup.remove(itemId);
      const dropLocation = getRelativeLocation(
        this.gridview.orientation,
        referenceLocation,
        target
      );

      this.addPanelToNewGroup(groupItem, dropLocation);
    }
  }

  createGroup(options?: GroupOptions) {
    const group = new Groupview(this, nextGroupId.next(), options);

    if (typeof this.options.tabHeight === "number") {
      group.tabHeight = this.options.tabHeight;
    }

    if (!this.groups.has(group.id)) {
      const disposable = new CompositeDisposable(
        group.onMove((event) => {
          const { groupId, itemId, target, index } = event;
          this.moveGroup(group, groupId, itemId, target, index);
        }),
        group.onDidGroupChange((event) => {
          this._onDidLayoutChange.fire(event);
        }),
        group
      );

      this.groups.set(group.id, { value: group, disposable });
    }

    return group;
  }

  public layout(size: number, orthogonalSize: number, force?: boolean) {
    const different =
      force || size !== this._size || orthogonalSize !== this._orthogonalSize;

    if (!different) {
      return;
    }

    this._element.style.height = `${orthogonalSize}px`;
    this._element.style.width = `${size}px`;

    this._size = size;
    this._orthogonalSize = orthogonalSize;
    this.gridview.layout(size, orthogonalSize);
  }

  private findGroup(panel: IPanel): IGroupview | undefined {
    return Array.from(this.groups.values()).find((group) =>
      group.value.contains(panel)
    ).value;
  }

  private addDirtyPanel(panel: IPanel) {
    this.dirtyPanels.add(panel);
    panel.setDirty(true);
    this._onDidLayoutChange.fire({ kind: GroupChangeKind.PANEL_DIRTY });
    this.debouncedDeque();
  }

  private persist() {
    const dirtyPanels = Array.from(this.dirtyPanels);
    this.dirtyPanels.clear();

    const partialPanelState = dirtyPanels
      .map((p) => this.panels.get(p.id))
      .filter((_) => !!_)
      .reduce((collection, panel) => {
        collection[panel.value.id] = panel.value.toJSON();
        return collection;
      }, {});

    this.panelState = {
      ...this.panelState,
      ...partialPanelState,
    };

    dirtyPanels
      .filter((p) => this.panels.has(p.id))
      .forEach((panel) => {
        panel.setDirty(false);
        this._onDidLayoutChange.fire({ kind: GroupChangeKind.PANEL_CLEAN });
      });

    this._onDidLayoutChange.fire({
      kind: GroupChangeKind.LAYOUT_CONFIG_UPDATED,
    });
  }

  private toTarget(direction: "left" | "right" | "above" | "below" | "within") {
    switch (direction) {
      case "left":
        return Target.Left;
      case "right":
        return Target.Right;
      case "above":
        return Target.Top;
      case "below":
        return Target.Bottom;
      case "within":
      default:
        return Target.Center;
    }
  }

  public dispose() {
    super.dispose();

    this.gridview.dispose();

    this.debugContainer?.dispose();

    if (this.resizeTimer) {
      clearInterval(this.resizeTimer);
      this.resizeTimer = undefined;
    }

    this._onDidLayoutChange.dispose();
  }

  private updateContainer() {
    if (this.options.debug) {
      if (!this.debugContainer) {
        this.debugContainer = new DebugWidget(this);
      } else {
        this.debugContainer.dispose();
        this.debugContainer = undefined;
      }
    }
  }
}
