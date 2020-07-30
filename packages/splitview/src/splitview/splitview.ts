import { removeClasses, addClasses, firstIndex } from "../dom";
import { clamp, clampView, range } from "../util";
import { Event } from "../events";
import { pushToStart, pushToEnd } from "../util";

export enum Orientation {
  HORIZONTAL = "HORIZONTAL",
  VERTICAL = "VERTICAL",
}

export interface ISplitViewOptions {
  orientation: Orientation;
}

export interface IBaseView {
  readonly minimumSize: number;
  readonly maximumSize: number;
  readonly snapSize?: number;
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

export class SplitView {
  private element: HTMLElement;
  private viewContainer: HTMLElement;
  private sashContainer: HTMLElement;
  private views: IViewItem[] = [];
  private sashes: ISashItem[] = [];
  private orientation: Orientation;
  private size: number;
  private orthogonalSize: number;
  private contentSize: number;
  private _proportions: number[];

  public get length() {
    return this.views.length;
  }

  public get proportions() {
    return [...this._proportions];
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
    this.orientation = options.orientation;
    this.element = this.createContainer();

    this.viewContainer = this.createViewContainer();
    this.sashContainer = this.createSashContainer();

    this.element.appendChild(this.sashContainer);
    this.element.appendChild(this.viewContainer);

    this.container.appendChild(this.element);
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
      Math.min(item.view.maximumSize, this.size)
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

    this.resize(this.views.length - 1, this.size - contentSize, undefined, [
      index,
    ]);
    this.distributeEmptySpace();
    this.layoutViews();
    this.saveProportions();
  }

  public addView(
    view: IView,
    size: number = undefined,
    index: number = this.views.length
  ) {
    const container = document.createElement("div");
    container.className = "view";

    container.appendChild(view.element);

    const disposable = view.onDidChange((size) =>
      this.onDidChange(viewItem, size)
    );

    const viewItem: IViewItem = {
      view,
      size: size || view.minimumSize,
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
          this.orientation === Orientation.HORIZONTAL
            ? event.clientX
            : event.clientY;
        const sizes = this.views.map((x) => x.size);

        const index = firstIndex(this.sashes, (s) => s.container === sash);

        const mousemove = (event: MouseEvent) => {
          const current =
            this.orientation === Orientation.HORIZONTAL
              ? event.clientX
              : event.clientY;
          const delta = current - start;

          console.log(delta);

          this.resize(
            index,
            delta,
            sizes
            // sizes
          );
          console.log(this.views.map((x) => x.size));
          this.distributeEmptySpace();
          this.layoutViews();
        };

        const end = () => {
          this.saveProportions();

          document.removeEventListener("mousemove", mousemove);
          document.removeEventListener("mouseup", end);
          document.removeEventListener("mouseend", end);
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

    this.relayout();
  }

  public removeView(index: number): IView {
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

    return viewItem.view;
  }

  public moveView(from: number, to: number) {
    const view = this.removeView(from);
    this.addView(view, undefined, to);
  }

  public setOrientation(orientation: Orientation) {
    if (orientation === this.orientation) {
      return;
    }
    this.orientation = orientation;

    const classname =
      orientation === Orientation.HORIZONTAL ? "horizontal" : "vertical";

    removeClasses(this.viewContainer, "vertical", "horizontal");
    removeClasses(this.sashContainer, "vertical", "horizontal");
    addClasses(this.viewContainer, classname);
    addClasses(this.sashContainer, classname);
  }

  public layout(size: number, orthogonalSize: number) {
    this.size = size;
    this.orthogonalSize = orthogonalSize;

    for (let i = 0; i < this.views.length; i++) {
      const item = this.views[i];

      // const x =
      //   this.proportions.length > 0
      //     ? this.proportions[i]
      //     : 1 / this.views.length;

      item.size = clampView(item.view, Math.round(this._proportions[i] * size));
    }

    this.distributeEmptySpace();
    this.layoutViews();
  }

  private relayout() {
    this.layoutViews();
    this.saveProportions();
  }

  private distributeEmptySpace() {
    let contentSize = this.views.reduce((r, i) => r + i.size, 0);
    let emptyDelta = this.size - contentSize;

    for (let i = this.views.length - 1; emptyDelta !== 0 && i >= 0; i--) {
      const item = this.views[i];
      const size = clampView(item.view, item.size + emptyDelta);
      const viewDelta = size - item.size;

      emptyDelta -= viewDelta;
      item.size = size;
    }
  }

  private saveProportions(): void {
    if (this.contentSize > 0) {
      this._proportions = this.views.map((i) => i.size / this.contentSize);
    }
  }

  private layoutViews() {
    this.contentSize = this.views.reduce((r, i) => r + i.size, 0);
    let sum = 0;
    let x: number[] = [];
    for (let i = 0; i < this.views.length - 1; i++) {
      sum += this.views[i].size;
      x.push(sum);
      if (this.orientation === Orientation.HORIZONTAL) {
        this.sashes[i].container.style.left = `${sum - 2}px`;
        this.sashes[i].container.style.top = `0px`;
      }
      if (this.orientation === Orientation.VERTICAL) {
        this.sashes[i].container.style.left = `0px`;
        this.sashes[i].container.style.top = `${sum - 2}px`;
      }
    }
    this.views.forEach((view, i) => {
      if (this.orientation === Orientation.HORIZONTAL) {
        view.container.style.width = `${view.size}px`;
        view.container.style.left = i == 0 ? "0px" : `${x[i - 1]}px`;
        view.container.style.top = "";
        view.container.style.height = "";
      }
      if (this.orientation === Orientation.VERTICAL) {
        view.container.style.height = `${view.size}px`;
        view.container.style.top = i == 0 ? "0px" : `${x[i - 1]}px`;
        view.container.style.width = "";
        view.container.style.left = "";
      }

      view.view.layout(view.size, this.orthogonalSize);
    });
  }

  private resizeView2(
    index: number,
    size: number,
    // views: T[],
    _size: number
  ) {
    if (index < 0 || index >= this.views.length) {
      return;
    }

    const item = this.views[index];
    size = Math.round(size);
    // size = clamp(size, item.minimumSize, item.maximumSize);
    size = clamp(
      size,
      item.view.minimumSize,
      Math.min(item.view.maximumSize, _size)
    );

    let delta = size - item.size;

    if (delta !== 0 && index < this.views.length - 1) {
      const downIndexes = range(index + 1, this.views.length);
      const collapseDown = downIndexes.reduce(
        (r, i) => r + (this.views[i].size - this.views[i].view.minimumSize),
        0
      );
      const expandDown = downIndexes.reduce(
        (r, i) => r + (this.views[i].view.maximumSize - this.views[i].size),
        0
      );
      const deltaDown = clamp(delta, -expandDown, collapseDown);

      this.resize(index, deltaDown);
      delta -= deltaDown;
    }

    if (delta !== 0 && index > 0) {
      const upIndexes = range(index - 1, -1);
      const collapseUp = upIndexes.reduce(
        (r, i) => r + (this.views[i].size - this.views[i].view.minimumSize),
        0
      );
      const expandUp = upIndexes.reduce(
        (r, i) => r + (this.views[i].view.maximumSize - this.views[i].size),
        0
      );
      const deltaUp = clamp(-delta, -collapseUp, expandUp);

      this.resize(index - 1, deltaUp);
    }
  }

  private resize = (
    index: number,
    delta: number,
    // views: T[],
    sizes: number[] = this.views.map((x) => x.size),
    lowPriorityIndexes?: number[],
    highPriorityIndexes?: number[]
  ) => {
    // const values = views; // [...views].map(_ => ({ ..._ }));

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
      this.orientation === Orientation.HORIZONTAL ? "horizontal" : "vertical";
    element.className = `split-view-container ${orientationClassname}`;
    return element;
  }

  public dispose() {
    for (let i = 0; i < this.element.children.length; i++) {
      if (this.element.children.item[i] === this.element) {
        this.element.removeChild(this.element);
        break;
      }
    }
  }
}
