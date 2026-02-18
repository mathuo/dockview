import { Emitter, Event } from '../events';
import { CompositeDisposable, Disposable, IDisposable } from '../lifecycle';
import {
    IView,
    LayoutPriority,
    Orientation,
    Splitview,
} from '../splitview/splitview';
import { watchElementResize } from '../dom';

export type FixedPanelPosition = 'top' | 'bottom' | 'left' | 'right';

export interface FixedPanelViewOptions {
    id: string;
    initialSize?: number;
    minimumSize?: number;
    maximumSize?: number;
    snap?: boolean;
}

export interface FixedPanelsConfig {
    top?: FixedPanelViewOptions;
    bottom?: FixedPanelViewOptions;
    left?: FixedPanelViewOptions;
    right?: FixedPanelViewOptions;
}

export interface SerializedFixedPanels {
    top?: { size: number; visible: boolean; group?: unknown };
    bottom?: { size: number; visible: boolean; group?: unknown };
    left?: { size: number; visible: boolean; group?: unknown };
    right?: { size: number; visible: boolean; group?: unknown };
}

/**
 * Minimal interface for a fixed panel group host.
 * Avoids circular imports by not referencing DockviewGroupPanel directly.
 */
export interface IFixedPanelGroup {
    readonly element: HTMLElement;
    layout(width: number, height: number): void;
}

export class FixedPanelView implements IView {
    private readonly _group: IFixedPanelGroup;
    private readonly _orientation: 'horizontal' | 'vertical';
    private readonly _onDidChange = new Emitter<{
        size?: number;
        orthogonalSize?: number;
    }>();

    readonly onDidChange: Event<{ size?: number; orthogonalSize?: number }> =
        this._onDidChange.event;

    readonly minimumSize: number;
    readonly maximumSize: number;
    readonly snap: boolean;
    readonly priority = LayoutPriority.Low;

    get element(): HTMLElement {
        return this._group.element;
    }

    constructor(
        options: FixedPanelViewOptions,
        group: IFixedPanelGroup,
        orientation: 'horizontal' | 'vertical'
    ) {
        this._group = group;
        this._orientation = orientation;

        group.element.classList.add('dv-fixed-panel');
        group.element.dataset.testid = `dv-fixed-panel-${options.id}`;

        this.minimumSize = options.minimumSize ?? 0;
        this.maximumSize = options.maximumSize ?? Number.POSITIVE_INFINITY;
        this.snap = options.snap ?? true;
    }

    layout(size: number, orthogonalSize: number): void {
        // horizontal (left/right): size=width, orthogonalSize=height → layout(width, height)
        // vertical (top/bottom): size=height, orthogonalSize=width → layout(width, height)
        if (this._orientation === 'horizontal') {
            this._group.layout(size, orthogonalSize);
        } else {
            this._group.layout(orthogonalSize, size);
        }
    }

    setVisible(_visible: boolean): void {
        // visibility is managed by the parent splitview
    }

    dispose(): void {
        this._onDidChange.dispose();
    }
}

class CenterView implements IView {
    readonly priority = LayoutPriority.High;
    readonly minimumSize = 100;
    readonly maximumSize = Number.POSITIVE_INFINITY;

    private readonly _onDidChange = new Emitter<{
        size?: number;
        orthogonalSize?: number;
    }>();
    readonly onDidChange: Event<{ size?: number; orthogonalSize?: number }> =
        this._onDidChange.event;

    get element(): HTMLElement {
        return this._dockviewElement;
    }

    constructor(
        private readonly _dockviewElement: HTMLElement,
        private readonly _layoutDockview: (
            width: number,
            height: number
        ) => void
    ) {}

    layout(size: number, orthogonalSize: number): void {
        // Inner splitview is HORIZONTAL: size = width, orthogonalSize = height
        this._layoutDockview(size, orthogonalSize);
    }

    setVisible(_visible: boolean): void {
        // center is always visible
    }

    dispose(): void {
        this._onDidChange.dispose();
    }
}

class MiddleRowView implements IView, IDisposable {
    private readonly _element: HTMLElement;
    private readonly _splitview: Splitview;
    private readonly _onDidChange = new Emitter<{
        size?: number;
        orthogonalSize?: number;
    }>();

    readonly onDidChange: Event<{ size?: number; orthogonalSize?: number }> =
        this._onDidChange.event;
    readonly minimumSize = 100;
    readonly maximumSize = Number.POSITIVE_INFINITY;
    readonly priority = LayoutPriority.High;

    private readonly _leftIndex: number | undefined;
    private readonly _centerIndex: number;
    private readonly _rightIndex: number | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        leftView: FixedPanelView | undefined,
        centerView: CenterView,
        rightView: FixedPanelView | undefined,
        leftSize: number,
        rightSize: number
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-shell-middle-row';
        this._element.style.height = '100%';
        this._element.style.width = '100%';

        this._splitview = new Splitview(this._element, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
        });

        let index = 0;
        if (leftView) {
            this._leftIndex = index;
            this._splitview.addView(leftView, leftSize, index++);
        }

        this._centerIndex = index;
        this._splitview.addView(centerView, { type: 'distribute' }, index++);

        if (rightView) {
            this._rightIndex = index;
            this._splitview.addView(rightView, rightSize, index);
        }
    }

    layout(size: number, orthogonalSize: number): void {
        // Outer splitview is VERTICAL: size = height, orthogonalSize = width
        // Inner splitview is HORIZONTAL: layout(width, height)
        this._splitview.layout(orthogonalSize, size);
    }

    setVisible(_visible: boolean): void {
        // middle row is always visible
    }

    setViewVisible(position: 'left' | 'right', visible: boolean): void {
        const index =
            position === 'left' ? this._leftIndex : this._rightIndex;
        if (index !== undefined) {
            this._splitview.setViewVisible(index, visible);
        }
    }

    isViewVisible(position: 'left' | 'right'): boolean {
        const index =
            position === 'left' ? this._leftIndex : this._rightIndex;
        if (index !== undefined) {
            return this._splitview.isViewVisible(index);
        }
        return false;
    }

    getViewSize(position: 'left' | 'right'): number {
        const index =
            position === 'left' ? this._leftIndex : this._rightIndex;
        if (index !== undefined) {
            return this._splitview.getViewSize(index);
        }
        return 0;
    }

    dispose(): void {
        this._onDidChange.dispose();
        this._splitview.dispose();
    }
}

export class ShellManager implements IDisposable {
    private readonly _outerSplitview: Splitview;
    private readonly _middleRow: MiddleRowView;
    private readonly _shellElement: HTMLElement;

    private readonly _topView: FixedPanelView | undefined;
    private readonly _bottomView: FixedPanelView | undefined;
    private readonly _leftView: FixedPanelView | undefined;
    private readonly _rightView: FixedPanelView | undefined;

    private readonly _topIndex: number | undefined;
    private readonly _middleIndex: number;
    private readonly _bottomIndex: number | undefined;

    private readonly _disposables = new CompositeDisposable();

    constructor(
        container: HTMLElement,
        dockviewElement: HTMLElement,
        config: FixedPanelsConfig,
        groups: {
            top?: IFixedPanelGroup;
            bottom?: IFixedPanelGroup;
            left?: IFixedPanelGroup;
            right?: IFixedPanelGroup;
        },
        layoutGrid: (width: number, height: number) => void
    ) {
        this._shellElement = document.createElement('div');
        this._shellElement.className = 'dv-shell';
        this._shellElement.style.height = '100%';
        this._shellElement.style.width = '100%';
        container.appendChild(this._shellElement);

        // Create fixed panel views for configured positions
        if (config.top && groups.top) {
            this._topView = new FixedPanelView(config.top, groups.top, 'vertical');
        }
        if (config.bottom && groups.bottom) {
            this._bottomView = new FixedPanelView(config.bottom, groups.bottom, 'vertical');
        }
        if (config.left && groups.left) {
            this._leftView = new FixedPanelView(config.left, groups.left, 'horizontal');
        }
        if (config.right && groups.right) {
            this._rightView = new FixedPanelView(config.right, groups.right, 'horizontal');
        }

        // Create center view wrapping the dockview element
        const centerView = new CenterView(dockviewElement, layoutGrid);

        // Create middle row with left | center | right
        this._middleRow = new MiddleRowView(
            this._leftView,
            centerView,
            this._rightView,
            config.left?.initialSize ?? 200,
            config.right?.initialSize ?? 200
        );

        // Create outer splitview (VERTICAL = top-to-bottom rows)
        this._outerSplitview = new Splitview(this._shellElement, {
            orientation: Orientation.VERTICAL,
            proportionalLayout: false,
        });

        let index = 0;
        if (this._topView) {
            this._topIndex = index;
            this._outerSplitview.addView(
                this._topView,
                config.top?.initialSize ?? 40,
                index++
            );
        }

        this._middleIndex = index;
        this._outerSplitview.addView(
            this._middleRow,
            { type: 'distribute' },
            index++
        );

        if (this._bottomView) {
            this._bottomIndex = index;
            this._outerSplitview.addView(
                this._bottomView,
                config.bottom?.initialSize ?? 200,
                index
            );
        }

        this._disposables.addDisposables(
            watchElementResize(this._shellElement, (entry) => {
                const { width, height } = entry.contentRect;
                this.layout(width, height);
            }),
            this._outerSplitview,
            this._middleRow,
            centerView,
            ...[
                this._topView,
                this._bottomView,
                this._leftView,
                this._rightView,
            ].filter((v): v is FixedPanelView => v !== undefined)
        );
    }

    get element(): HTMLElement {
        return this._shellElement;
    }

    layout(width: number, height: number): void {
        // Outer splitview is VERTICAL: layout(size=height, orthogonalSize=width)
        this._outerSplitview.layout(height, width);
    }

    hasFixedPanel(position: FixedPanelPosition): boolean {
        switch (position) {
            case 'top':
                return this._topView !== undefined;
            case 'bottom':
                return this._bottomView !== undefined;
            case 'left':
                return this._leftView !== undefined;
            case 'right':
                return this._rightView !== undefined;
        }
    }

    setFixedPanelVisible(
        position: FixedPanelPosition,
        visible: boolean
    ): void {
        switch (position) {
            case 'top':
                if (this._topIndex !== undefined) {
                    this._outerSplitview.setViewVisible(
                        this._topIndex,
                        visible
                    );
                }
                break;
            case 'bottom':
                if (this._bottomIndex !== undefined) {
                    this._outerSplitview.setViewVisible(
                        this._bottomIndex,
                        visible
                    );
                }
                break;
            case 'left':
            case 'right':
                this._middleRow.setViewVisible(position, visible);
                break;
        }
    }

    isFixedPanelVisible(position: FixedPanelPosition): boolean {
        switch (position) {
            case 'top':
                if (this._topIndex !== undefined) {
                    return this._outerSplitview.isViewVisible(this._topIndex);
                }
                return false;
            case 'bottom':
                if (this._bottomIndex !== undefined) {
                    return this._outerSplitview.isViewVisible(
                        this._bottomIndex
                    );
                }
                return false;
            case 'left':
            case 'right':
                return this._middleRow.isViewVisible(position);
        }
    }

    toJSON(): SerializedFixedPanels {
        const fixedPanels: SerializedFixedPanels = {};

        if (this._topView && this._topIndex !== undefined) {
            fixedPanels.top = {
                size: this._outerSplitview.getViewSize(this._topIndex),
                visible: this._outerSplitview.isViewVisible(this._topIndex),
            };
        }
        if (this._bottomView && this._bottomIndex !== undefined) {
            fixedPanels.bottom = {
                size: this._outerSplitview.getViewSize(this._bottomIndex),
                visible: this._outerSplitview.isViewVisible(
                    this._bottomIndex
                ),
            };
        }
        if (this._leftView) {
            fixedPanels.left = {
                size: this._middleRow.getViewSize('left'),
                visible: this._middleRow.isViewVisible('left'),
            };
        }
        if (this._rightView) {
            fixedPanels.right = {
                size: this._middleRow.getViewSize('right'),
                visible: this._middleRow.isViewVisible('right'),
            };
        }

        return fixedPanels;
    }

    fromJSON(data: SerializedFixedPanels): void {
        if (data.top && this._topIndex !== undefined) {
            this._outerSplitview.resizeView(this._topIndex, data.top.size);
            if (!data.top.visible) {
                this._outerSplitview.setViewVisible(this._topIndex, false);
            }
        }
        if (data.bottom && this._bottomIndex !== undefined) {
            this._outerSplitview.resizeView(
                this._bottomIndex,
                data.bottom.size
            );
            if (!data.bottom.visible) {
                this._outerSplitview.setViewVisible(
                    this._bottomIndex,
                    false
                );
            }
        }
        if (data.left) {
            if (!data.left.visible) {
                this._middleRow.setViewVisible('left', false);
            }
        }
        if (data.right) {
            if (!data.right.visible) {
                this._middleRow.setViewVisible('right', false);
            }
        }
    }

    dispose(): void {
        this._disposables.dispose();
        this._shellElement.parentElement?.removeChild(this._shellElement);
    }
}
