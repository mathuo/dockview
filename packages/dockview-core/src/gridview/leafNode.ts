/*---------------------------------------------------------------------------------------------
 * Accreditation: This file is largly based upon the MIT licenced VSCode sourcecode found at:
 * https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/grid
 *--------------------------------------------------------------------------------------------*/

import { IView, LayoutPriority, Orientation } from '../splitview/splitview';
import { Emitter, Event } from '../events';
import { IGridView } from './gridview';
import { IDisposable } from '../lifecycle';

export class LeafNode implements IView {
    private readonly _onDidChange = new Emitter<{
        size?: number;
        orthogonalSize?: number;
    }>();
    readonly onDidChange: Event<{ size?: number; orthogonalSize?: number }> =
        this._onDidChange.event;
    private _size: number;
    private _orthogonalSize: number;
    private readonly _disposable: IDisposable;

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

    get snap(): boolean | undefined {
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

    get orthogonalSize(): number {
        return this._orthogonalSize;
    }

    get size(): number {
        return this._size;
    }

    get element(): HTMLElement {
        return this.view.element;
    }

    get width(): number {
        return this.orientation === Orientation.HORIZONTAL
            ? this.orthogonalSize
            : this.size;
    }

    get height(): number {
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

        this._disposable = this.view.onDidChange((event) => {
            if (event) {
                this._onDidChange.fire({
                    size:
                        this.orientation === Orientation.VERTICAL
                            ? event.width
                            : event.height,
                    orthogonalSize:
                        this.orientation === Orientation.VERTICAL
                            ? event.height
                            : event.width,
                });
            } else {
                this._onDidChange.fire({});
            }
        });
    }

    public setVisible(visible: boolean): void {
        if (this.view.setVisible) {
            this.view.setVisible(visible);
        }
    }

    public layout(size: number, orthogonalSize: number): void {
        this._size = size;
        this._orthogonalSize = orthogonalSize;

        this.view.layout(this.width, this.height);
    }

    public dispose(): void {
        this._onDidChange.dispose();
        this._disposable.dispose();
    }
}
