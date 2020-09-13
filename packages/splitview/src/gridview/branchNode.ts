import {
  IView,
  SplitView,
  Orientation,
  Sizing,
  LayoutPriority,
} from "../splitview/splitview";
import { Emitter, Event } from "../events";
import { INodeDescriptor } from "./gridview";
import { Node } from "./types";
import { CompositeDisposable, IDisposable, Disposable } from "../lifecycle";

export class BranchNode extends CompositeDisposable implements IView {
  readonly element: HTMLElement;
  private splitview: SplitView;
  private _orthogonalSize: number;
  private _size: number;
  public readonly children: Node[] = [];

  private readonly _onDidChange = new Emitter<number | undefined>();
  readonly onDidChange: Event<number | undefined> = this._onDidChange.event;

  get width(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.size
      : this.orthogonalSize;
  }

  get height(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.orthogonalSize
      : this.size;
  }

  get minimumSize(): number {
    return this.children.length === 0
      ? 0
      : Math.max(...this.children.map((c) => c.minimumOrthogonalSize));
  }

  get maximumSize(): number {
    return Math.min(...this.children.map((c) => c.maximumOrthogonalSize));
  }

  get minimumOrthogonalSize(): number {
    return this.splitview.minimumSize;
  }

  get maximumOrthogonalSize(): number {
    return this.splitview.maximumSize;
  }

  get orthogonalSize() {
    return this._orthogonalSize;
  }

  get size() {
    return this._size;
  }

  get minimumWidth(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.minimumOrthogonalSize
      : this.minimumSize;
  }

  get snapSize() {
    return undefined;
  }

  get minimumHeight(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.minimumSize
      : this.minimumOrthogonalSize;
  }

  get maximumWidth(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.maximumOrthogonalSize
      : this.maximumSize;
  }

  get maximumHeight(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.maximumSize
      : this.maximumOrthogonalSize;
  }

  get priority(): LayoutPriority {
    if (this.children.length === 0) {
      return LayoutPriority.Normal;
    }

    const priorities = this.children.map((c) =>
      typeof c.priority === "undefined" ? LayoutPriority.Normal : c.priority
    );

    if (priorities.some((p) => p === LayoutPriority.High)) {
      return LayoutPriority.High;
    } else if (priorities.some((p) => p === LayoutPriority.Low)) {
      return LayoutPriority.Low;
    }

    return LayoutPriority.Normal;
  }

  constructor(
    readonly orientation: Orientation,
    readonly proportionalLayout: boolean,
    size: number = 0,
    orthogonalSize: number,

    childDescriptors?: INodeDescriptor[]
  ) {
    super();
    this._orthogonalSize = orthogonalSize;
    this._size = size;
    this.element = document.createElement("div");
    this.element.className = "branch-node";

    if (!childDescriptors) {
      this.splitview = new SplitView(this.element, {
        orientation: this.orientation,
        proportionalLayout,
      });
      this.splitview.layout(this.size, this.orthogonalSize);
    } else {
      const descriptor = {
        views: childDescriptors.map((childDescriptor) => {
          return {
            view: childDescriptor.node,
            size: childDescriptor.node.size,
          };
        }),
        size: this.orthogonalSize,
      };

      this.children = childDescriptors.map((c) => c.node);
      this.splitview = new SplitView(this.element, {
        orientation: this.orientation,
        descriptor,
      });
    }

    this.addDisposables(
      this.splitview.onDidSashEnd(() => {
        this._onDidChange.fire(undefined);
      })
    );
  }

  moveChild(from: number, to: number): void {
    if (from === to) {
      return;
    }

    if (from < 0 || from >= this.children.length) {
      throw new Error("Invalid from index");
    }

    if (from < to) {
      to--;
    }

    this.splitview.moveView(from, to);

    const child = this._removeChild(from);
    this._addChild(child, to);
  }

  getChildSize(index: number): number {
    if (index < 0 || index >= this.children.length) {
      throw new Error("Invalid index");
    }

    return this.splitview.getViewSize(index);
  }

  resizeChild(index: number, size: number): void {
    if (index < 0 || index >= this.children.length) {
      throw new Error("Invalid index");
    }

    this.splitview.resizeView(index, size);
  }

  public layout(size: number, orthogonalSize: number) {
    this._size = orthogonalSize;
    this._orthogonalSize = size;

    this.splitview.layout(this.size, this.orthogonalSize);
  }

  public addChild(node: Node, size: number | Sizing, index: number): void {
    if (index < 0 || index > this.children.length) {
      throw new Error("Invalid index");
    }

    this.splitview.addView(node, size, index);
    this._addChild(node, index);
  }

  public removeChild(index: number, sizing?: Sizing) {
    if (index < 0 || index >= this.children.length) {
      throw new Error("Invalid index");
    }

    this.splitview.removeView(index, sizing);
    this._removeChild(index);
  }

  private _addChild(node: Node, index: number): void {
    this.children.splice(index, 0, node);
    this.setupChildrenEvents();
  }

  private _removeChild(index: number): Node {
    const first = index === 0;
    const last = index === this.children.length - 1;
    const [child] = this.children.splice(index, 1);
    this.setupChildrenEvents();

    return child;
  }

  private _childrenDisposable: IDisposable = Disposable.NONE;

  private setupChildrenEvents() {
    this._childrenDisposable.dispose();

    this._childrenDisposable = Event.any(
      ...this.children.map((c) => c.onDidChange)
    )((e) => {
      this._onDidChange.fire(e);
    });
  }

  public dispose() {
    super.dispose();
    this._childrenDisposable.dispose();
    this.splitview.dispose();
    this.children.forEach((child) => child.dispose());
  }
}
