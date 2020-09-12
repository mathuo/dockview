import { removeClasses, addClasses, firstIndex, toggleClass } from "../dom";
import { clamp } from "../math";
import { Event, Emitter } from "../events";
import { pushToStart, pushToEnd, range } from "../array";

export const clampView = (view: IView, size: number) => {
  const result = clamp(size, view.minimumSize, view.maximumSize);

  if (typeof view.snapSize !== "number" || size >= view.minimumSize) {
    return result;
  }

  const snapSize = Math.min(view.snapSize, view.minimumSize);
  return size < snapSize ? 0 : view.minimumSize;
};

export enum Orientation {
  HORIZONTAL = "HORIZONTAL",
  VERTICAL = "VERTICAL",
}

export enum SashState {
  MAXIMUM,
  MINIMUM,
  DISABLED,
  ENABLED,
}

export interface ISplitViewOptions {
  orientation: Orientation;
  readonly descriptor?: ISplitViewDescriptor;
  proportionalLayout?: boolean;
}
export enum LayoutPriority {
  Low = "low",
  High = "high",
  Normal = "normal",
}

export interface IBaseView {
  minimumSize: number;
  maximumSize: number;
  snapSize?: number;
  priority?: LayoutPriority;
}

export interface IView extends IBaseView {
  readonly element: HTMLElement | DocumentFragment;
  readonly onDidChange: Event<number | undefined>;
  layout(size: number, orthogonalSize: number): void;
  setVisible?(visible: boolean): void;
}

export interface IViewItem {
  view: IView;
  size: number;
  container: HTMLElement;
  dispose: () => void;
}

interface ISashItem {
  container: HTMLElement;
  disposable: () => void;
}

export type DistributeSizing = { type: "distribute" };
export type SplitSizing = { type: "split"; index: number };
export type Sizing = DistributeSizing | SplitSizing;

export interface ISplitViewDescriptor {
  size: number;
  views: {
    visible?: boolean;
    size: number;
    view: IView;
  }[];
}

export class SplitView {
  private element: HTMLElement;
  private viewContainer: HTMLElement;
  private sashContainer: HTMLElement;
  private views: IViewItem[] = [];
  private sashes: ISashItem[] = [];
  private _orientation: Orientation;
  private _size: number;
  private _orthogonalSize: number;
  private contentSize: number;
  private _proportions: number[];
  private proportionalLayout: boolean;

  private _onDidSashEnd = new Emitter<any>();
  public onDidSashEnd = this._onDidSashEnd.event;

  get size() {
    return this._size;
  }

  get orthogonalSize() {
    return this._orthogonalSize;
  }

  public get length() {
    return this.views.length;
  }

  public get proportions() {
    return this._proportions ? [...this._proportions] : undefined;
  }

  get orientation() {
    return this._orientation;
  }

  get minimumSize(): number {
    return this.views.reduce((r, item) => r + item.view.minimumSize, 0);
  }

  get maximumSize(): number {
    return this.length === 0
      ? Number.POSITIVE_INFINITY
      : this.views.reduce((r, item) => r + item.view.maximumSize, 0);
  }

  constructor(
    private readonly container: HTMLElement,
    options: ISplitViewOptions
  ) {
    this._orientation = options.orientation;
    this.element = this.createContainer();

    this.proportionalLayout =
      options.proportionalLayout === undefined
        ? true
        : !!options.proportionalLayout;

    this.viewContainer = this.createViewContainer();
    this.sashContainer = this.createSashContainer();

    this.element.appendChild(this.sashContainer);
    this.element.appendChild(this.viewContainer);

    this.container.appendChild(this.element);

    // We have an existing set of view, add them now
    if (options.descriptor) {
      this._size = options.descriptor.size;
      options.descriptor.views.forEach((viewDescriptor, index) => {
        const sizing = viewDescriptor.size;

        const view = viewDescriptor.view;
        this.addView(
          view,
          sizing,
          index,
          true
          // true skip layout
        );
      });

      // Initialize content size and proportions for first layout
      this.contentSize = this.views.reduce((r, i) => r + i.size, 0);
      this.saveProportions();
    }
  }

  getViewSize(index: number): number {
    if (index < 0 || index >= this.views.length) {
      return -1;
    }

    return this.views[index].size;
  }

  resizeView(index: number, size: number): void {
    if (index < 0 || index >= this.views.length) {
      return;
    }

    const indexes =
      // range(this.views.length)
      this.views.map((_, i) => i).filter((i) => i !== index);
    // const lowPriorityIndexes = [
    //   ...indexes.filter((i) => this.views[i].priority === LayoutPriority.Low),
    //   index,
    // ];
    // const highPriorityIndexes = indexes.filter(
    //   (i) => this.views[i].priority === LayoutPriority.High
    // );

    const item = this.views[index];
    size = Math.round(size);
    size = clamp(
      size,
      item.view.minimumSize,
      Math.min(item.view.maximumSize, this._size)
    );

    item.size = size;
    this
      .relayout
      // lowPriorityIndexes, highPriorityIndexes
      ();
  }

  public getViews() {
    return this.views.map((x) => x.view);
  }

  private onDidChange(item: IViewItem, size: number | undefined): void {
    const index = this.views.indexOf(item);

    if (index < 0 || index >= this.views.length) {
      return;
    }

    size = typeof size === "number" ? size : item.size;
    size = clamp(size, item.view.minimumSize, item.view.maximumSize);

    item.size = size;

    const contentSize = this.views.reduce((r, i) => r + i.size, 0);

    this.resize(this.views.length - 1, this._size - contentSize, undefined, [
      index,
    ]);
    this.distributeEmptySpace();
    this.layoutViews();
    this.saveProportions();
  }

  public addView(
    view: IView,
    size: number | Sizing = undefined,
    index: number = this.views.length,
    skipLayout?: boolean
  ) {
    const container = document.createElement("div");
    container.className = "view";

    container.appendChild(view.element);

    const disposable = view.onDidChange((size) =>
      this.onDidChange(viewItem, size)
    );

    let viewSize: number;

    if (typeof size === "number") {
      viewSize = size;
    } else if (size.type === "split") {
      viewSize = this.getViewSize(size.index) / 2;
    } else {
      viewSize = view.minimumSize;
    }

    const viewItem: IViewItem = {
      view,
      size: viewSize,
      container,
      dispose: () => {
        disposable?.dispose();
        this.viewContainer.removeChild(container);
      },
    };

    if (index === this.views.length) {
      this.viewContainer.appendChild(container);
    } else {
      this.viewContainer.insertBefore(
        container,
        this.viewContainer.children.item(index)
      );
    }

    this.views.splice(index, 0, viewItem);

    if (this.views.length > 1) {
      //add sash
      const sash = document.createElement("div");
      sash.className = "sash";

      const cb = (event: MouseEvent) => {
        let start =
          this._orientation === Orientation.HORIZONTAL
            ? event.clientX
            : event.clientY;
        const sizes = this.views.map((x) => x.size);

        const index = firstIndex(this.sashes, (s) => s.container === sash);

        const mousemove = (event: MouseEvent) => {
          const current =
            this._orientation === Orientation.HORIZONTAL
              ? event.clientX
              : event.clientY;
          const delta = current - start;

          this.resize(
            index,
            delta,
            sizes
            // sizes
          );
          this.distributeEmptySpace();
          this.layoutViews();
        };

        const end = () => {
          this.saveProportions();

          document.removeEventListener("mousemove", mousemove);
          document.removeEventListener("mouseup", end);
          document.removeEventListener("mouseend", end);

          this._onDidSashEnd.fire(undefined);
        };

        document.addEventListener("mousemove", mousemove);
        document.addEventListener("mouseup", end);
        document.addEventListener("mouseend", end);
      };

      sash.addEventListener("mousedown", cb);

      const disposable = () => {
        sash.removeEventListener("mousedown", cb);
        this.sashContainer.removeChild(sash);
      };

      const sashItem: ISashItem = { container: sash, disposable };

      this.sashContainer.appendChild(sash);
      this.sashes.push(sashItem);
    }

    if (!skipLayout) {
      this.relayout([index]);
    }

    if (!skipLayout && typeof size !== "number" && size.type === "distribute") {
      this.distributeViewSizes();
    }
  }

  distributeViewSizes(): void {
    const flexibleViewItems: IViewItem[] = [];
    let flexibleSize = 0;

    for (const item of this.views) {
      if (item.view.maximumSize - item.view.minimumSize > 0) {
        flexibleViewItems.push(item);
        flexibleSize += item.size;
      }
    }

    const size = Math.floor(flexibleSize / flexibleViewItems.length);

    for (const item of flexibleViewItems) {
      item.size = clamp(size, item.view.minimumSize, item.view.maximumSize);
    }

    // const indexes = range(this.viewItems.length);
    // const lowPriorityIndexes = indexes.filter(
    //   (i) => this.views[i].priority === LayoutPriority.Low
    // );
    // const highPriorityIndexes = indexes.filter(
    //   (i) => this.viewItems[i].priority === LayoutPriority.High
    // );

    this
      .relayout
      // lowPriorityIndexes, highPriorityIndexes
      ();
  }

  public removeView(index: number, sizing?: Sizing): IView {
    // Remove view
    const viewItem = this.views.splice(index, 1)[0];
    viewItem.dispose();

    // Remove sash
    if (this.views.length >= 1) {
      const sashIndex = Math.max(index - 1, 0);
      const sashItem = this.sashes.splice(sashIndex, 1)[0];
      sashItem.disposable();
    }

    this.relayout();
    this.distributeEmptySpace();

    if (sizing && sizing.type === "distribute") {
      this.distributeViewSizes();
    }

    return viewItem.view;
  }

  public moveView(from: number, to: number) {
    const sizing = this.getViewSize(from);
    const view = this.removeView(from);
    this.addView(view, sizing, to);
  }

  set orientation(orientation: Orientation) {
    if (orientation === this._orientation) {
      return;
    }
    this._orientation = orientation;

    const classname =
      orientation === Orientation.HORIZONTAL ? "horizontal" : "vertical";

    removeClasses(this.viewContainer, "vertical", "horizontal");
    removeClasses(this.sashContainer, "vertical", "horizontal");
    addClasses(this.viewContainer, classname);
    addClasses(this.sashContainer, classname);
  }

  public layout(size: number, orthogonalSize: number) {
    const previousSize = Math.max(this.size, this.contentSize);
    this._size = size;
    this._orthogonalSize = orthogonalSize;

    if (!this.proportions) {
      const indexes = range(this.views.length);
      const lowPriorityIndexes = indexes.filter(
        (i) => this.views[i].view.priority === LayoutPriority.Low
      );
      const highPriorityIndexes = indexes.filter(
        (i) => this.views[i].view.priority === LayoutPriority.High
      );

      this.resize(
        this.views.length - 1,
        size - previousSize,
        undefined,
        lowPriorityIndexes,
        highPriorityIndexes
      );
    } else {
      for (let i = 0; i < this.views.length; i++) {
        const item = this.views[i];

        item.size = clampView(
          item.view,
          Math.round(this._proportions[i] * size)
        );
      }
    }

    this.distributeEmptySpace();
    this.layoutViews();
  }

  private relayout(
    lowPriorityIndexes?: number[],
    highPriorityIndexes?: number[]
  ) {
    const contentSize = this.views.reduce((r, i) => r + i.size, 0);

    this.resize(
      this.views.length - 1,
      this._size - contentSize,
      undefined,
      lowPriorityIndexes,
      highPriorityIndexes
    );
    this.layoutViews();
    this.saveProportions();
  }

  private distributeEmptySpace() {
    let contentSize = this.views.reduce((r, i) => r + i.size, 0);
    let emptyDelta = this._size - contentSize;

    for (let i = this.views.length - 1; emptyDelta !== 0 && i >= 0; i--) {
      const item = this.views[i];
      const size = clampView(item.view, item.size + emptyDelta);
      const viewDelta = size - item.size;

      emptyDelta -= viewDelta;
      item.size = size;
    }
  }

  private saveProportions(): void {
    if (this.proportionalLayout && this.contentSize > 0) {
      this._proportions = this.views.map((i) => i.size / this.contentSize);
    }
  }

  private layoutViews() {
    this.contentSize = this.views.reduce((r, i) => r + i.size, 0);
    let sum = 0;
    let x: number[] = [];

    this.updateSashEnablement();

    for (let i = 0; i < this.views.length - 1; i++) {
      sum += this.views[i].size;
      x.push(sum);

      const offset = Math.min(Math.max(0, sum - 2), this.size - 4);

      if (this._orientation === Orientation.HORIZONTAL) {
        this.sashes[i].container.style.left = `${offset}px`;
        this.sashes[i].container.style.top = `0px`;
      }
      if (this._orientation === Orientation.VERTICAL) {
        this.sashes[i].container.style.left = `0px`;
        this.sashes[i].container.style.top = `${offset}px`;
      }
    }
    this.views.forEach((view, i) => {
      if (this._orientation === Orientation.HORIZONTAL) {
        view.container.style.width = `${view.size}px`;
        view.container.style.left = i == 0 ? "0px" : `${x[i - 1]}px`;
        view.container.style.top = "";
        view.container.style.height = "";
      }
      if (this._orientation === Orientation.VERTICAL) {
        view.container.style.height = `${view.size}px`;
        view.container.style.top = i == 0 ? "0px" : `${x[i - 1]}px`;
        view.container.style.width = "";
        view.container.style.left = "";
      }

      view.view.layout(view.size, this._orthogonalSize);
    });
  }

  private findFirstSnapIndex(indexes: number[]): number | undefined {
    // visible views first
    for (const index of indexes) {
      const viewItem = this.views[index];

      // if (!viewItem.visible) {
      // 	continue;
      // }

      if (viewItem.view.snapSize) {
        return index;
      }
    }

    return undefined;
  }

  private updateSashEnablement(): void {
    let previous = false;
    const collapsesDown = this.views.map(
      (i) => (previous = i.size - i.view.minimumSize > 0 || previous)
    );

    previous = false;
    const expandsDown = this.views.map(
      (i) => (previous = i.view.maximumSize - i.size > 0 || previous)
    );

    const reverseViews = [...this.views].reverse();
    previous = false;
    const collapsesUp = reverseViews
      .map((i) => (previous = i.size - i.view.minimumSize > 0 || previous))
      .reverse();

    previous = false;
    const expandsUp = reverseViews
      .map((i) => (previous = i.view.maximumSize - i.size > 0 || previous))
      .reverse();

    let position = 0;
    for (let index = 0; index < this.sashes.length; index++) {
      const sash = this.sashes[index];
      const viewItem = this.views[index];
      position += viewItem.size;

      const min = !(collapsesDown[index] && expandsUp[index + 1]);
      const max = !(expandsDown[index] && collapsesUp[index + 1]);

      if (min && max) {
        const upIndexes = range(index, -1);
        const downIndexes = range(index + 1, this.views.length);
        const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
        const snapAfterIndex = this.findFirstSnapIndex(downIndexes);

        const snappedBefore = false;
        // typeof snapBeforeIndex === "number" &&
        // !this.views[snapBeforeIndex].visible;
        const snappedAfter = false;
        // typeof snapAfterIndex === "number" &&
        // !this.views[snapAfterIndex].visible;

        if (
          snappedBefore &&
          collapsesUp[index] &&
          // (
          position > 0
          //  || this.startSnappingEnabled)
        ) {
          this.updateSash(sash, SashState.MINIMUM);
          // sash.state = SashState.Minimum;
        } else if (
          snappedAfter &&
          collapsesDown[index] &&
          // (
          position < this.contentSize
          // || this.endSnappingEnabled)
        ) {
          // sash.state = SashState.Maximum;
          this.updateSash(sash, SashState.MAXIMUM);
        } else {
          // sash.state = SashState.Disabled;
          this.updateSash(sash, SashState.DISABLED);
        }
      } else if (min && !max) {
        // sash.state = SashState.Minimum;
        this.updateSash(sash, SashState.MINIMUM);
      } else if (!min && max) {
        // sash.state = SashState.Maximum;

        this.updateSash(sash, SashState.MAXIMUM);
      } else {
        // sash.state = SashState.Enabled;
        this.updateSash(sash, SashState.ENABLED);
      }
    }
  }

  private updateSash(sash: ISashItem, state: SashState) {
    toggleClass(sash.container, "disabled", state === SashState.DISABLED);
    toggleClass(sash.container, "enabled", state === SashState.ENABLED);
    toggleClass(sash.container, "maximum", state === SashState.MAXIMUM);
    toggleClass(sash.container, "minimum", state === SashState.MINIMUM);
  }

  private resize = (
    index: number,
    delta: number,
    sizes: number[] = this.views.map((x) => x.size),
    lowPriorityIndexes?: number[],
    highPriorityIndexes?: number[]
  ) => {
    if (index < 0 || index > this.views.length) {
      return;
    }

    const upIndexes = range(index, -1);
    const downIndexes = range(index + 1, this.views.length);
    //
    if (highPriorityIndexes) {
      for (const index of highPriorityIndexes) {
        pushToStart(upIndexes, index);
        pushToStart(downIndexes, index);
      }
    }

    if (lowPriorityIndexes) {
      for (const index of lowPriorityIndexes) {
        pushToEnd(upIndexes, index);
        pushToEnd(downIndexes, index);
      }
    }
    //
    const upItems = upIndexes.map((i) => this.views[i]);
    const upSizes = upIndexes.map((i) => sizes[i]);
    //
    const downItems = downIndexes.map((i) => this.views[i]);
    const downSizes = downIndexes.map((i) => sizes[i]);
    //
    const minDeltaUp = upIndexes.reduce(
      (_, i) =>
        _ +
        (typeof this.views[i].view.snapSize === "number"
          ? 0
          : this.views[i].view.minimumSize) -
        sizes[i],
      0
    );
    const maxDeltaUp = upIndexes.reduce(
      (_, i) => _ + this.views[i].view.maximumSize - sizes[i],
      0
    );
    //
    const maxDeltaDown =
      downIndexes.length === 0
        ? Number.POSITIVE_INFINITY
        : downIndexes.reduce(
            (_, i) =>
              _ +
              sizes[i] -
              (typeof this.views[i].view.snapSize === "number"
                ? 0
                : this.views[i].view.minimumSize),
            0
          );
    const minDeltaDown =
      downIndexes.length === 0
        ? Number.NEGATIVE_INFINITY
        : downIndexes.reduce(
            (_, i) => _ + sizes[i] - this.views[i].view.maximumSize,
            0
          );
    //
    const minDelta = Math.max(minDeltaUp, minDeltaDown);
    const maxDelta = Math.min(maxDeltaDown, maxDeltaUp);
    //
    const tentativeDelta = clamp(delta, minDelta, maxDelta);
    let actualDelta = 0;
    //
    let deltaUp = tentativeDelta;

    for (let i = 0; i < upItems.length; i++) {
      const item = upItems[i];
      const size = clampView(item.view, upSizes[i] + deltaUp);
      const viewDelta = size - upSizes[i];

      actualDelta += viewDelta;
      deltaUp -= viewDelta;
      item.size = size;
    }
    //
    let deltaDown = actualDelta;
    for (let i = 0; i < downItems.length; i++) {
      const item = downItems[i];
      const size = clampView(item.view, downSizes[i] - deltaDown);
      const viewDelta = size - downSizes[i];

      deltaDown += viewDelta;
      item.size = size;
    }
    //
  };

  private createViewContainer() {
    const element = document.createElement("div");
    element.className = "view-container";
    return element;
  }

  private createSashContainer() {
    const element = document.createElement("div");
    element.className = "sash-container";
    return element;
  }

  private createContainer() {
    const element = document.createElement("div");
    const orientationClassname =
      this._orientation === Orientation.HORIZONTAL ? "horizontal" : "vertical";
    element.className = `split-view-container ${orientationClassname}`;
    return element;
  }

  public dispose() {
    this.element.remove();
    for (let i = 0; i < this.element.children.length; i++) {
      if (this.element.children.item[i] === this.element) {
        this.element.removeChild(this.element);
        break;
      }
    }
  }
}
