import {
    IView,
    LayoutPriority,
    Orientation,
} from '../splitview/core/splitview';
import { Emitter, Event } from '../events';
import { IGridView } from './gridview';
import { IDisposable } from '../lifecycle';

export class LeafNode implements IView {
    private readonly _onDidChange = new Emitter<number | undefined>();
    readonly onDidChange: Event<number | undefined> = this._onDidChange.event;
    private _size: number;
    private _orthogonalSize: number;
    private _disposable: IDisposable;

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

    get priority(): LayoutPriority | undefined {
        return this.view.priority;
    }

    get snap() {
        return this.view.snap;
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

    get width() {
        return this.orientation === Orientation.HORIZONTAL
            ? this.orthogonalSize
            : this.size;
    }

    get height() {
        return this.orientation === Orientation.HORIZONTAL
            ? this.size
            : this.orthogonalSize;
    }

    constructor(
        public readonly view: IGridView,
        readonly orientation: Orientation,
        orthogonalSize: number,
        size = 0
    ) {
        this._orthogonalSize = orthogonalSize;
        this._size = size;

        this._disposable = this.view.onDidChange((event) =>
            this._onDidChange.fire(
                event
                    ? this.orientation === Orientation.VERTICAL
                        ? event.width
                        : event.height
                    : undefined
            )
        );
    }

    public setVisible(visible: boolean) {
        if (this.view.setVisible) {
            this.view.setVisible(visible);
        }
    }

    public layout(size: number, orthogonalSize: number) {
        this._size = size;
        this._orthogonalSize = orthogonalSize;

        this.view.layout(this.width, this.height);
    }

    public dispose() {
        this._disposable.dispose();
    }
}
