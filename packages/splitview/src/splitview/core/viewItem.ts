import { IDisposable } from '../../lifecycle';
import { clamp } from '../../math';
import { IView, LayoutPriority } from './splitview';

export class ViewItem {
    private _size: number;
    set size(size: number) {
        this._size = size;
    }

    get size(): number {
        return this._size;
    }

    private _cachedVisibleSize: number | undefined = undefined;
    get cachedVisibleSize(): number | undefined {
        return this._cachedVisibleSize;
    }

    get visible(): boolean {
        return typeof this._cachedVisibleSize === 'undefined';
    }

    setVisible(visible: boolean, size?: number): void {
        if (visible === this.visible) {
            return;
        }

        if (visible) {
            this.size = clamp(
                this._cachedVisibleSize ?? 0,
                this.viewMinimumSize,
                this.viewMaximumSize
            );
            this._cachedVisibleSize = undefined;
        } else {
            this._cachedVisibleSize =
                typeof size === 'number' ? size : this.size;
            this.size = 0;
        }

        this.container.classList.toggle('visible', visible);

        if (this.view.setVisible) {
            this.view.setVisible(visible);
        }
    }

    get minimumSize(): number {
        return this.visible ? this.view.minimumSize : 0;
    }
    get viewMinimumSize(): number {
        return this.view.minimumSize;
    }

    get maximumSize(): number {
        return this.visible ? this.view.maximumSize : 0;
    }
    get viewMaximumSize(): number {
        return this.view.maximumSize;
    }

    get priority(): LayoutPriority | undefined {
        return this.view.priority;
    }
    get snap(): boolean {
        return !!this.view.snap;
    }

    set enabled(enabled: boolean) {
        this.container.style.pointerEvents = enabled ? '' : 'none';
    }

    constructor(
        public container: HTMLElement,
        public view: IView,
        size: number | { cachedVisibleSize: number },
        private disposable: IDisposable
    ) {
        if (typeof size === 'number') {
            this._size = size;
            this._cachedVisibleSize = undefined;
            container.classList.add('visible');
        } else {
            this._size = 0;
            this._cachedVisibleSize = size.cachedVisibleSize;
        }
    }

    // layout(offset: number, layoutContext: TLayoutContext | undefined): void {
    //     this.layoutContainer(offset);
    //     this.view.layout(this.size, offset, layoutContext);
    // }

    // abstract layoutContainer(offset: number): void;

    dispose(): IView {
        this.disposable.dispose();
        return this.view;
    }
}
