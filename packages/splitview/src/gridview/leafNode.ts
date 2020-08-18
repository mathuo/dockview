import { IView, Orientation } from "../splitview/splitview";
import { Emitter, Event } from "../events";
import { IGridView } from "./gridview";

export class LeafNode implements IView {
  private readonly _onDidChange = new Emitter<number | undefined>();
  readonly onDidChange: Event<number | undefined> = this._onDidChange.event;
  private _size: number;
  private _orthogonalSize: number;

  public dispose() {}

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
  ) {
    this._orthogonalSize = orthogonalSize;
    this._size = size;
  }

  public layout(size: number, orthogonalSize: number) {
    this._size = size;
    this._orthogonalSize = orthogonalSize;

    const [width, height] =
      this.orientation === Orientation.HORIZONTAL
        ? [orthogonalSize, size]
        : [size, orthogonalSize];

    this.view.layout(width, height, 0, 0);
  }
}
