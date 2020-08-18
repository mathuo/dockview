import {
  Gridview,
  getRelativeLocation,
  IViewDeserializer,
} from "../gridview/gridview";
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
import { DefaultTab } from "../groupview/panel/tab";
import { DefaultPanel } from "../groupview/panel/panel";
import { CompositeDisposable, IDisposable } from "../types";
import { Event, Emitter } from "../events";
import { Watermark } from "./watermark/watermark";
import { timeoutPromise } from "../async";
import { IPanelDeserializer, DefaultDeserializer } from "../react/deserializer";
import { DebugWidget } from "./debug";
import {
  PanelContentPart,
  PanelHeaderPart,
  PanelContentPartConstructor,
  PanelHeaderPartConstructor,
  WatermarkConstructor,
} from "../groupview/panel/parts";

const counter = () => {
  let value = 1;
  return { next: () => (value++).toString() };
};

let nextGroupId = counter();
let nextLayoutId = counter();

interface AddPanelOptions {
  tabComponentName?: string | PanelHeaderPartConstructor;
  params?: { [key: string]: any };
  title?: string;
  position?: {
    direction?: "left" | "right" | "above" | "below" | "within";
    referencePanel: string;
  };
}

interface AddGroupOptions {
  direction?: "left" | "right" | "above" | "below";
  referencePanel: string;
}

const toTarget = (
  direction: "left" | "right" | "above" | "below" | "within"
) => {
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
};

export type PanelReference = {
  update: (event: { params: { [key: string]: any } }) => void;
  remove: () => void;
};

export interface Api {
  addPanelFromComponent(
    id: string,
    componentName: string | PanelContentPartConstructor,
    options?: AddPanelOptions
  ): PanelReference;
  addEmptyGroup(options?: AddGroupOptions);
  layout(width: number, height: number): void;
  toJSON(): object;
  deserialize: (data: object) => void;
  deserializer: IPanelDeserializer;
  setAutoResizeToFit(enabled: boolean): void;
  resizeToFit(): void;
  setHeight(height: number): void;
  groupCount: number;
  panelCount: number;
  onDidLayoutChange: Event<GroupChangeEvent>;
  closeAll: () => Promise<boolean>;
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
  options: Options;
  onDidLayoutChange: Event<GroupChangeEvent>;
}

export type FrameworkPanelWrapper = {
  createContentWrapper: (id: string, component: any) => PanelContentPart;
  createTabWrapper: (id: string, component: any) => PanelHeaderPart;
};

interface Options {
  tabComponents?: {
    [componentName: string]: PanelHeaderPartConstructor;
  };
  components?: {
    [componentName: string]: PanelContentPartConstructor;
  };
  frameworkTabComponents?: {
    [componentName: string]: any;
  };
  frameworkComponents?: {
    [componentName: string]: any;
  };
  watermarkComponent?: WatermarkConstructor;
  frameworkPanelWrapper: FrameworkPanelWrapper;
  tabHeight?: number;
}

enum ChangeType {
  ADD_GROUP,
  REMOVE_GROUP,
}

type LayoutChangeEvent = {
  type: ChangeType;
};

export class Layout extends CompositeDisposable implements IGroupAccessor, Api {
  private readonly _id = nextLayoutId.next();
  private debugContainer: DebugWidget;
  private readonly groups = new Map<
    string,
    { view: IGroupview; disposable: IDisposable }
  >();
  private readonly panels = new Map<
    string,
    { panel: IPanel; disposable?: IDisposable }
  >();
  private gridview: Gridview = new Gridview();
  private _activeGroup: IGroupview;
  private _size: number;
  private _orthogonalSize: number;
  private _element: HTMLElement;
  private _deserializer: IPanelDeserializer;
  private resizeTimer: NodeJS.Timer;
  private readonly _onDidLayoutChange = new Emitter<GroupChangeEvent>();
  readonly onDidLayoutChange: Event<GroupChangeEvent> = this._onDidLayoutChange
    .event;

  constructor(public readonly options: Options) {
    super();

    this._element = document.createElement("div");
    this._element.appendChild(this.gridview.element);

    if (!this.options.components) {
      this.options.components = {};
    }
    if (!this.options.tabComponents) {
      this.options.tabComponents = {};
    }
    if (!this.options.watermarkComponent) {
      this.options.watermarkComponent = Watermark;
    }

    this.gridview.onDidChange((e) => {
      this._onDidLayoutChange.fire({ kind: GroupChangeKind.LAYOUT });
    });

    this.toggleDebugContainer();
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

  private dirty = new Set<string>();

  public registerPanel(panel: IPanel) {
    if (this.panels.has(panel.id)) {
      throw new Error(`panel ${panel.id} already exists`);
    }

    const disposable = new CompositeDisposable(
      panel.onDidStateChange((e) => {
        this.dirty.add(panel.id);
        panel.setDirty(true);

        console.log("state event ");
      })
    );

    this.panels.set(panel.id, { panel, disposable });

    this._onDidLayoutChange.fire({ kind: GroupChangeKind.PANEL_CREATED });
  }

  public unregisterPanel(panel: IPanel) {
    if (!this.panels.has(panel.id)) {
      throw new Error(`panel ${panel.id} doesn't exist`);
    }
    const { disposable, panel: unregisteredPanel } = this.panels.get(panel.id);

    disposable.dispose();
    unregisteredPanel.dispose();

    this.panels.delete(panel.id);

    this._onDidLayoutChange.fire({ kind: GroupChangeKind.PANEL_DESTROYED });
  }

  public toJSON() {
    const data = this.gridview.serialize();
    this._activeGroup.id;
    return data;
  }

  public deserialize(data: object) {
    this.gridview.clear();
    this.panels.forEach((panel) => {
      panel.disposable.dispose();
      panel.panel.dispose();
    });
    this.panels.clear();
    this.groups.clear();

    this.fromJSON(data, this.deserializer);
    this.gridview.layout(this._size, this._orthogonalSize);
  }

  public fromJSON(data: object, deserializer: IPanelDeserializer) {
    this.gridview.deserialize(
      data,
      new DefaultDeserializer(this, {
        fromJSON: (data) => {
          const panel = deserializer.fromJSON(data);
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

      const didCloseAll = await group.view.closeAll();
      if (!didCloseAll) {
        return false;
      }
      await timeoutPromise(0);
    }
    return true;
  }

  public setHeight(height: number) {
    this.groups.forEach((value) => {
      value.view.tabHeight = height;
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
    id: string,
    componentName: string | PanelContentPartConstructor,
    options?: AddPanelOptions
  ): PanelReference {
    const component = this.createContentComponent(componentName);
    const tabComponent = this.createTabComponent(options?.tabComponentName);

    const panel = new DefaultPanel(id, tabComponent, component);
    panel.init({
      title: options?.title,
      params: options?.params || {},
    });

    this.registerPanel(panel);

    if (options?.position?.referencePanel) {
      const referencePanel = this.panels.get(options.position.referencePanel)
        .panel;
      const referenceGroup = this.findGroup(referencePanel);

      const target = toTarget(options.position.direction);
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
      const referencePanel = this.panels.get(options.referencePanel).panel;
      const referenceGroup = this.findGroup(referencePanel);

      const target = toTarget(options.direction);

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
    return this.groups.get(id)?.view;
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
      Array.from(this.groups.values())[0].view.size === 0
    ) {
      group = Array.from(this.groups.values())[0].view;
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
      this.doSetGroupActive(Array.from(this.groups.values())[0].view);
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
    const sourceGroup = this.groups.get(groupId).view;

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

      this.groups.set(group.id, { view: group, disposable });
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
      group.view.contains(panel)
    ).view;
  }

  private createContentComponent(
    componentName: string | PanelContentPartConstructor | any
  ): PanelContentPart {
    const Component =
      typeof componentName === "string"
        ? this.options.components[componentName]
        : componentName;
    const FrameworkComponent =
      typeof componentName === "string"
        ? this.options.frameworkComponents[componentName]
        : componentName;
    if (Component && FrameworkComponent) {
      throw new Error(
        `cannot register component ${componentName} as both a component and frameworkComponent`
      );
    }
    if (FrameworkComponent) {
      if (!this.options.frameworkPanelWrapper) {
        throw new Error(
          "you must register a frameworkPanelWrapper to use framework components"
        );
      }
      const wrappedComponent = this.options.frameworkPanelWrapper.createContentWrapper(
        componentName,
        FrameworkComponent
      );
      return wrappedComponent;
    }
    return new Component() as PanelContentPart;
  }
  private createTabComponent(
    componentName: string | PanelHeaderPartConstructor | any
  ): PanelHeaderPart {
    const Component =
      typeof componentName === "string"
        ? this.options.tabComponents[componentName]
        : componentName;
    const FrameworkComponent =
      typeof componentName === "string"
        ? this.options.frameworkTabComponents[componentName]
        : componentName;
    if (Component && FrameworkComponent) {
      throw new Error(
        `cannot register component ${componentName} as both a component and frameworkComponent`
      );
    }
    if (FrameworkComponent) {
      if (!this.options.frameworkPanelWrapper) {
        throw new Error(
          "you must register a frameworkPanelWrapper to use framework components"
        );
      }
      const wrappedComponent = this.options.frameworkPanelWrapper.createTabWrapper(
        componentName,
        FrameworkComponent
      );
      return wrappedComponent;
    }

    if (!Component) {
      return new DefaultTab();
    }

    return new Component() as PanelHeaderPart;
  }

  public dispose() {
    super.dispose();

    this.debugContainer?.dispose();

    if (this.resizeTimer) {
      clearInterval(this.resizeTimer);
      this.resizeTimer = undefined;
    }

    this._onDidLayoutChange.dispose();
  }

  private toggleDebugContainer() {
    if (!this.debugContainer) {
      this.debugContainer = new DebugWidget(this);
    } else {
      this.debugContainer.dispose();
      this.debugContainer = undefined;
    }
  }
}
