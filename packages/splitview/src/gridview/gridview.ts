import { Orientation, SplitView } from "../splitview/splitview";
import { Emitter, Event } from "../events";
import { IView as ISplitviewView } from "../splitview/splitview";
import { Target } from "../groupview/droptarget/droptarget";
import { tail } from "../array";

export function indexInParent(element: HTMLElement): number {
  const parentElement = element.parentElement;

  if (!parentElement) {
    throw new Error("Invalid grid element");
  }

  let el = parentElement.firstElementChild;
  let index = 0;

  while (el !== element && el !== parentElement.lastElementChild && el) {
    el = el.nextElementSibling;
    index++;
  }

  return index;
}

/**
 * Find the grid location of a specific DOM element by traversing the parent
 * chain and finding each child index on the way.
 *
 * This will break as soon as DOM structures of the Splitview or Gridview change.
 */
export function getGridLocation(element: HTMLElement): number[] {
  const parentElement = element.parentElement;

  if (!parentElement) {
    throw new Error("Invalid grid element");
  }

  if (/\bgrid-view\b/.test(parentElement.className)) {
    return [];
  }

  const index = indexInParent(parentElement);
  const ancestor = parentElement.parentElement!.parentElement!.parentElement!;
  return [...getGridLocation(ancestor), index];
}

export function getRelativeLocation(
  rootOrientation: Orientation,
  location: number[],
  direction: Target
): number[] {
  const orientation = getLocationOrientation(rootOrientation, location);
  const directionOrientation = getDirectionOrientation(direction);

  if (orientation === directionOrientation) {
    let [rest, index] = tail(location);

    if (direction === Target.Right || direction === Target.Bottom) {
      index += 1;
    }

    return [...rest, index];
  } else {
    const index =
      direction === Target.Right || direction === Target.Bottom ? 1 : 0;
    return [...location, index];
  }
}

export function getDirectionOrientation(direction: Target): Orientation {
  return direction === Target.Top || direction === Target.Bottom
    ? Orientation.VERTICAL
    : Orientation.HORIZONTAL;
}

export function getLocationOrientation(
  rootOrientation: Orientation,
  location: number[]
): Orientation {
  return location.length % 2 === 0
    ? orthogonal(rootOrientation)
    : rootOrientation;
}

export interface IGridView {
  readonly element: HTMLElement;
  readonly minimumWidth: number;
  readonly maximumWidth: number;
  readonly minimumHeight: number;
  readonly maximumHeight: number;
  layout(width: number, height: number, top: number, left: number): void;
}

class LeafNode implements ISplitviewView {
  private readonly _onDidChange = new Emitter<number | undefined>();
  readonly onDidChange: Event<number | undefined> = this._onDidChange.event;
  private _size: number;
  private _orthogonalSize: number;

  private get minimumWidth(): number {
    return this.view.minimumWidth;
  }

  private get maximumWidth(): number {
    return this.view.maximumWidth;
  }

  private get minimumHeight(): number {
    return this.view.minimumHeight;
  }

  private get maximumHeight(): number {
    return this.view.maximumHeight;
  }

  get minimumSize(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.minimumHeight
      : this.minimumWidth;
  }

  get maximumSize(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.maximumHeight
      : this.maximumWidth;
  }

  get minimumOrthogonalSize(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.minimumWidth
      : this.minimumHeight;
  }

  get maximumOrthogonalSize(): number {
    return this.orientation === Orientation.HORIZONTAL
      ? this.maximumWidth
      : this.maximumHeight;
  }

  get orthogonalSize() {
    return this._orthogonalSize;
  }

  get size() {
    return this._size;
  }

  get element() {
    return this.view.element;
  }

  constructor(
    public readonly view: IGridView,
    readonly orientation: Orientation,
    orthogonalSize: number,
    size: number = 0
  ) {}

  public layout(size: number, orthogonalSize: number) {
    this._size = size;
    this._orthogonalSize = orthogonalSize;
  }
}

class BranchNode implements ISplitviewView {
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

  constructor(
    readonly orientation: Orientation,
    orthogonalSize: number,
    size: number = 0
  ) {
    this._orthogonalSize = orthogonalSize;
    this._size = size;
    this.element = document.createElement("div");
    this.element.className = "branch-node";

    this.splitview = new SplitView(this.element, {
      orientation: this.orientation,
    });
    this.splitview.layout(this.size, this.orthogonalSize);
  }

  moveChild(from: number, to: number): void {
    if (from === to) {
      return;
    }

    if (from < 0 || from >= this.children.length) {
      throw new Error("Invalid from index");
    }

    // to = clamp(to, 0, this.children.length);

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

  public addChild(node: Node, size: number, index: number): void {
    if (index < 0 || index > this.children.length) {
      throw new Error("Invalid index");
    }

    this.splitview.addView(node, size, index);
    this._addChild(node, index);
  }

  public removeChild(index: number) {
    if (index < 0 || index >= this.children.length) {
      throw new Error("Invalid index");
    }

    this.splitview.removeView(index);
    this._removeChild(index);
  }

  private _addChild(node: Node, index: number): void {
    this.children.splice(index, 0, node);
  }

  private _removeChild(index: number): Node {
    const first = index === 0;
    const last = index === this.children.length - 1;
    const [child] = this.children.splice(index, 1);

    return child;
  }
}

type Node = BranchNode | LeafNode;

const orthogonal = (orientation: Orientation) =>
  orientation === Orientation.HORIZONTAL
    ? Orientation.VERTICAL
    : Orientation.HORIZONTAL;

export class Gridview {
  private _root: BranchNode;
  public readonly element: HTMLElement;

  public get orientation() {
    return this.root.orientation;
  }

  public set orienation(orientation: Orientation) {
    // this._orienation = orientation;
  }

  private get root(): BranchNode {
    return this._root;
  }

  private set root(root: BranchNode) {
    const oldRoot = this._root;

    if (oldRoot) {
      this.element.removeChild(oldRoot.element);
      // oldRoot.dispose();
    }

    this._root = root;
    this.element.appendChild(root.element);
  }

  get width(): number {
    return this.root.width;
  }
  get height(): number {
    return this.root.height;
  }

  get minimumWidth(): number {
    return this.root.minimumWidth;
  }
  get minimumHeight(): number {
    return this.root.minimumHeight;
  }
  get maximumWidth(): number {
    return this.root.maximumHeight;
  }
  get maximumHeight(): number {
    return this.root.maximumHeight;
  }

  constructor() {
    this.orienation = Orientation.HORIZONTAL;
    this.element = document.createElement("div");
    this.element.className = "grid-view";
    this.root = new BranchNode(Orientation.HORIZONTAL, 0, 0);

    this.element.appendChild(this.root.element);
  }

  public moveView(parentLocation: number[], from: number, to: number): void {
    const [, parent] = this.getNode(parentLocation);

    if (!(parent instanceof BranchNode)) {
      throw new Error("Invalid location");
    }

    parent.moveChild(from, to);
  }

  public addView(view: IGridView, size: number, location: number[]) {
    const [rest, index] = tail(location);

    const [pathToParent, parent] = this.getNode(rest);

    if (parent instanceof BranchNode) {
      const node = new LeafNode(
        view,
        orthogonal(parent.orientation),
        parent.orthogonalSize
      );
      parent.addChild(node, size, index);
    } else {
      const [grandParent, ..._] = [...pathToParent].reverse();
      const [parentIndex, ...__] = [...rest].reverse();

      let newSiblingSize: number = 0;

      grandParent.removeChild(parentIndex);

      const newParent = new BranchNode(
        parent.orientation,
        parent.size,
        parent.orthogonalSize
      );
      grandParent.addChild(newParent, parent.size, parentIndex);

      const newSibling = new LeafNode(
        parent.view,
        grandParent.orientation,
        parent.size
      );
      newParent.addChild(newSibling, newSiblingSize, 0);

      const node = new LeafNode(view, grandParent.orientation, parent.size);
      newParent.addChild(node, size, index);
    }
  }

  public remove(view: IGridView) {
    const location = getGridLocation(view.element);
    return this.removeView(location);
  }

  removeView(location: number[]): IGridView {
    const [rest, index] = tail(location);
    const [pathToParent, parent] = this.getNode(rest);

    if (!(parent instanceof BranchNode)) {
      throw new Error("Invalid location");
    }

    const node = parent.children[index];

    if (!(node instanceof LeafNode)) {
      throw new Error("Invalid location");
    }

    parent.removeChild(index);

    if (parent.children.length === 0) {
      throw new Error("Invalid grid state");
    }

    if (parent.children.length > 1) {
      return node.view;
    }

    if (pathToParent.length === 0) {
      // parent is root
      const sibling = parent.children[0];

      if (sibling instanceof LeafNode) {
        return node.view;
      }

      // we must promote sibling to be the new root
      parent.removeChild(0);
      this.root = sibling;
      return node.view;
    }

    const [grandParent, ..._] = [...pathToParent].reverse();
    const [parentIndex, ...__] = [...rest].reverse();

    const sibling = parent.children[0];
    parent.removeChild(0);

    const sizes = grandParent.children.map((_, i) =>
      grandParent.getChildSize(i)
    );
    grandParent.removeChild(parentIndex);

    if (sibling instanceof BranchNode) {
      sizes.splice(parentIndex, 1, ...sibling.children.map((c) => c.size));

      for (let i = 0; i < sibling.children.length; i++) {
        const child = sibling.children[i];
        grandParent.addChild(child, child.size, parentIndex + i);
      }
    } else {
      const newSibling = new LeafNode(
        sibling.view,
        orthogonal(sibling.orientation),
        sibling.size
      );
      grandParent.addChild(newSibling, sibling.orthogonalSize, parentIndex);
    }

    for (let i = 0; i < sizes.length; i++) {
      grandParent.resizeChild(i, sizes[i]);
    }

    return node.view;
  }

  public layout(width: number, height: number) {
    const [size, orthogonalSize] =
      this.root.orientation === Orientation.HORIZONTAL
        ? [height, width]
        : [width, height];
    this.root.layout(size, orthogonalSize);
  }

  private getNode(
    location: number[],
    node: Node = this.root,
    path: BranchNode[] = []
  ): [BranchNode[], Node] {
    if (location.length === 0) {
      return [path, node];
    }

    if (!(node instanceof BranchNode)) {
      throw new Error("Invalid location");
    }

    const [index, ...rest] = location;

    if (index < 0 || index >= node.children.length) {
      throw new Error("Invalid location");
    }

    const child = node.children[index];
    path.push(node);

    return this.getNode(rest, child, path);
  }
}
