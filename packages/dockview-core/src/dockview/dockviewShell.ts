import { Emitter, Event } from '../events';
import { CompositeDisposable, IDisposable } from '../lifecycle';
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
    collapsedSize?: number;
    initiallyCollapsed?: boolean;
}

export interface FixedPanelsConfig {
    top?: FixedPanelViewOptions;
    bottom?: FixedPanelViewOptions;
    left?: FixedPanelViewOptions;
    right?: FixedPanelViewOptions;
}

export interface SerializedFixedPanels {
    top?: {
        size: number;
        visible: boolean;
        collapsed?: boolean;
        group?: unknown;
    };
    bottom?: {
        size: number;
        visible: boolean;
        collapsed?: boolean;
        group?: unknown;
    };
    left?: {
        size: number;
        visible: boolean;
        collapsed?: boolean;
        group?: unknown;
    };
    right?: {
        size: number;
        visible: boolean;
        collapsed?: boolean;
        group?: unknown;
    };
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

    readonly snap = false;
    readonly priority = LayoutPriority.Low;

    private _isCollapsed = false;
    private _lastExpandedSize: number;
    private readonly _collapsedSize: number;
    private readonly _expandedMinimumSize: number;
    private readonly _expandedMaximumSize: number;

    get minimumSize(): number {
        // When collapsed, lock size to collapsedSize so sash can't drag it open
        return this._isCollapsed
            ? this._collapsedSize
            : this._expandedMinimumSize;
    }

    get maximumSize(): number {
        // When collapsed, lock size to collapsedSize so sash can't drag it open
        return this._isCollapsed
            ? this._collapsedSize
            : this._expandedMaximumSize;
    }

    get element(): HTMLElement {
        return this._group.element;
    }

    get isCollapsed(): boolean {
        return this._isCollapsed;
    }

    get lastExpandedSize(): number {
        return this._lastExpandedSize;
    }

    get collapsedSize(): number {
        return this._collapsedSize;
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

        this._collapsedSize = options.collapsedSize ?? 35;
        this._expandedMaximumSize =
            options.maximumSize ?? Number.POSITIVE_INFINITY;
        // If the caller explicitly provides a minimumSize, respect it.
        // Otherwise fall back to collapsedSize + 50 so the expanded state is
        // visually distinguishable from the collapsed state.
        this._expandedMinimumSize =
            options.minimumSize !== undefined
                ? options.minimumSize
                : this._collapsedSize + 50;

        this._lastExpandedSize = options.initialSize ?? 200;

        if (options.initiallyCollapsed) {
            this._isCollapsed = true;
            group.element.classList.add('dv-fixed-collapsed');
        }
    }

    layout(size: number, orthogonalSize: number): void {
        // Track the last expanded size so we can restore it after collapsing
        if (!this._isCollapsed) {
            this._lastExpandedSize = size;
        }

        // horizontal (left/right): size=width, orthogonalSize=height → layout(width, height)
        // vertical (top/bottom): size=height, orthogonalSize=width → layout(width, height)
        if (this._orientation === 'horizontal') {
            this._group.layout(size, orthogonalSize);
        } else {
            this._group.layout(orthogonalSize, size);
        }
    }

    setCollapsed(collapsed: boolean): void {
        if (this._isCollapsed === collapsed) {
            return;
        }
        this._isCollapsed = collapsed;
        this._group.element.classList.toggle('dv-fixed-collapsed', collapsed);
        // ShellManager calls resizeView directly after this; no _onDidChange needed
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
        // Lives in a VERTICAL middle-column splitview:
        // size = height alloc, orthogonalSize = width
        this._layoutDockview(orthogonalSize, size);
    }

    setVisible(_visible: boolean): void {
        // center is always visible
    }

    dispose(): void {
        this._onDidChange.dispose();
    }
}

/**
 * The vertical centre column: top (optional) | center | bottom (optional).
 * This view sits between the left and right fixed panels in the outer
 * horizontal splitview, so its primary axis is width (horizontal).
 */
class MiddleColumnView implements IView, IDisposable {
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

    private readonly _topIndex: number | undefined;
    private readonly _centerIndex: number;
    private readonly _bottomIndex: number | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        topView: FixedPanelView | undefined,
        centerView: CenterView,
        bottomView: FixedPanelView | undefined,
        topSize: number,
        bottomSize: number
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-shell-middle-column';
        this._element.style.height = '100%';
        this._element.style.width = '100%';

        this._splitview = new Splitview(this._element, {
            orientation: Orientation.VERTICAL,
            proportionalLayout: false,
        });

        let index = 0;
        if (topView) {
            this._topIndex = index;
            this._splitview.addView(topView, topSize, index++);
        }

        this._centerIndex = index;
        this._splitview.addView(centerView, { type: 'distribute' }, index++);

        if (bottomView) {
            this._bottomIndex = index;
            this._splitview.addView(bottomView, bottomSize, index);
        }
    }

    layout(size: number, orthogonalSize: number): void {
        // Outer horizontal splitview: size = width, orthogonalSize = height
        // Inner vertical splitview: layout(height, width)
        this._splitview.layout(orthogonalSize, size);
    }

    setVisible(_visible: boolean): void {
        // middle column is always visible
    }

    setViewVisible(position: 'top' | 'bottom', visible: boolean): void {
        const index = position === 'top' ? this._topIndex : this._bottomIndex;
        if (index !== undefined) {
            this._splitview.setViewVisible(index, visible);
        }
    }

    isViewVisible(position: 'top' | 'bottom'): boolean {
        const index = position === 'top' ? this._topIndex : this._bottomIndex;
        if (index !== undefined) {
            return this._splitview.isViewVisible(index);
        }
        return false;
    }

    getViewSize(position: 'top' | 'bottom'): number {
        const index = position === 'top' ? this._topIndex : this._bottomIndex;
        if (index !== undefined) {
            return this._splitview.getViewSize(index);
        }
        return 0;
    }

    resizeView(position: 'top' | 'bottom', size: number): void {
        const index = position === 'top' ? this._topIndex : this._bottomIndex;
        if (index !== undefined) {
            this._splitview.resizeView(index, size);
        }
    }

    dispose(): void {
        this._onDidChange.dispose();
        this._splitview.dispose();
    }
}

export class ShellManager implements IDisposable {
    private readonly _outerSplitview: Splitview;
    private readonly _middleColumn: MiddleColumnView;
    private readonly _shellElement: HTMLElement;

    private readonly _topView: FixedPanelView | undefined;
    private readonly _bottomView: FixedPanelView | undefined;
    private readonly _leftView: FixedPanelView | undefined;
    private readonly _rightView: FixedPanelView | undefined;

    // Indices in the outer HORIZONTAL splitview
    private readonly _leftIndex: number | undefined;
    private readonly _middleIndex: number;
    private readonly _rightIndex: number | undefined;

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
            this._topView = new FixedPanelView(
                config.top,
                groups.top,
                'vertical'
            );
        }
        if (config.bottom && groups.bottom) {
            this._bottomView = new FixedPanelView(
                config.bottom,
                groups.bottom,
                'vertical'
            );
        }
        if (config.left && groups.left) {
            this._leftView = new FixedPanelView(
                config.left,
                groups.left,
                'horizontal'
            );
        }
        if (config.right && groups.right) {
            this._rightView = new FixedPanelView(
                config.right,
                groups.right,
                'horizontal'
            );
        }

        // Create center view wrapping the dockview element
        const centerView = new CenterView(dockviewElement, layoutGrid);

        // Middle column: top | center | bottom (vertical splitview)
        this._middleColumn = new MiddleColumnView(
            this._topView,
            centerView,
            this._bottomView,
            this._topView
                ? this._topView.isCollapsed
                    ? this._topView.collapsedSize
                    : this._topView.lastExpandedSize
                : 200,
            this._bottomView
                ? this._bottomView.isCollapsed
                    ? this._bottomView.collapsedSize
                    : this._bottomView.lastExpandedSize
                : 200
        );

        // Outer splitview: left | middle-column | right (horizontal)
        this._outerSplitview = new Splitview(this._shellElement, {
            orientation: Orientation.HORIZONTAL,
            proportionalLayout: false,
        });

        let index = 0;
        if (this._leftView) {
            this._leftIndex = index;
            this._outerSplitview.addView(
                this._leftView,
                this._leftView.isCollapsed
                    ? this._leftView.collapsedSize
                    : this._leftView.lastExpandedSize,
                index++
            );
        }

        this._middleIndex = index;
        this._outerSplitview.addView(
            this._middleColumn,
            { type: 'distribute' },
            index++
        );

        if (this._rightView) {
            this._rightIndex = index;
            this._outerSplitview.addView(
                this._rightView,
                this._rightView.isCollapsed
                    ? this._rightView.collapsedSize
                    : this._rightView.lastExpandedSize,
                index
            );
        }

        this._disposables.addDisposables(
            watchElementResize(this._shellElement, (entry) => {
                const { width, height } = entry.contentRect;
                this.layout(width, height);
            }),
            this._outerSplitview,
            this._middleColumn,
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
        // Outer splitview is HORIZONTAL: layout(size=width, orthogonalSize=height)
        this._outerSplitview.layout(width, height);
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

    setFixedPanelVisible(position: FixedPanelPosition, visible: boolean): void {
        switch (position) {
            case 'left':
                if (this._leftIndex !== undefined) {
                    this._outerSplitview.setViewVisible(
                        this._leftIndex,
                        visible
                    );
                }
                break;
            case 'right':
                if (this._rightIndex !== undefined) {
                    this._outerSplitview.setViewVisible(
                        this._rightIndex,
                        visible
                    );
                }
                break;
            case 'top':
            case 'bottom':
                this._middleColumn.setViewVisible(position, visible);
                break;
        }
    }

    isFixedPanelVisible(position: FixedPanelPosition): boolean {
        switch (position) {
            case 'left':
                if (this._leftIndex !== undefined) {
                    return this._outerSplitview.isViewVisible(this._leftIndex);
                }
                return false;
            case 'right':
                if (this._rightIndex !== undefined) {
                    return this._outerSplitview.isViewVisible(this._rightIndex);
                }
                return false;
            case 'top':
            case 'bottom':
                return this._middleColumn.isViewVisible(position);
        }
    }

    setFixedPanelCollapsed(
        position: FixedPanelPosition,
        collapsed: boolean
    ): void {
        const view = this._getView(position);
        if (!view) {
            return;
        }
        view.setCollapsed(collapsed);
        const targetSize = collapsed
            ? view.collapsedSize
            : view.lastExpandedSize;
        switch (position) {
            case 'left':
                if (this._leftIndex !== undefined) {
                    this._outerSplitview.resizeView(
                        this._leftIndex,
                        targetSize
                    );
                }
                break;
            case 'right':
                if (this._rightIndex !== undefined) {
                    this._outerSplitview.resizeView(
                        this._rightIndex,
                        targetSize
                    );
                }
                break;
            case 'top':
            case 'bottom':
                this._middleColumn.resizeView(position, targetSize);
                break;
        }
    }

    isFixedPanelCollapsed(position: FixedPanelPosition): boolean {
        return this._getView(position)?.isCollapsed ?? false;
    }

    private _getView(position: FixedPanelPosition): FixedPanelView | undefined {
        switch (position) {
            case 'top':
                return this._topView;
            case 'bottom':
                return this._bottomView;
            case 'left':
                return this._leftView;
            case 'right':
                return this._rightView;
        }
    }

    toJSON(): SerializedFixedPanels {
        const fixedPanels: SerializedFixedPanels = {};

        if (this._leftView && this._leftIndex !== undefined) {
            fixedPanels.left = {
                size: this._leftView.isCollapsed
                    ? this._leftView.lastExpandedSize
                    : this._outerSplitview.getViewSize(this._leftIndex),
                visible: this._outerSplitview.isViewVisible(this._leftIndex),
                collapsed: this._leftView.isCollapsed || undefined,
            };
        }
        if (this._rightView && this._rightIndex !== undefined) {
            fixedPanels.right = {
                size: this._rightView.isCollapsed
                    ? this._rightView.lastExpandedSize
                    : this._outerSplitview.getViewSize(this._rightIndex),
                visible: this._outerSplitview.isViewVisible(this._rightIndex),
                collapsed: this._rightView.isCollapsed || undefined,
            };
        }
        if (this._topView) {
            fixedPanels.top = {
                size: this._topView.isCollapsed
                    ? this._topView.lastExpandedSize
                    : this._middleColumn.getViewSize('top'),
                visible: this._middleColumn.isViewVisible('top'),
                collapsed: this._topView.isCollapsed || undefined,
            };
        }
        if (this._bottomView) {
            fixedPanels.bottom = {
                size: this._bottomView.isCollapsed
                    ? this._bottomView.lastExpandedSize
                    : this._middleColumn.getViewSize('bottom'),
                visible: this._middleColumn.isViewVisible('bottom'),
                collapsed: this._bottomView.isCollapsed || undefined,
            };
        }

        return fixedPanels;
    }

    fromJSON(data: SerializedFixedPanels): void {
        if (data.left && this._leftIndex !== undefined) {
            this._leftView?.setCollapsed(data.left.collapsed ?? false);
            this._outerSplitview.resizeView(this._leftIndex, data.left.size);
            if (!data.left.visible) {
                this._outerSplitview.setViewVisible(this._leftIndex, false);
            }
        }
        if (data.right && this._rightIndex !== undefined) {
            this._rightView?.setCollapsed(data.right.collapsed ?? false);
            this._outerSplitview.resizeView(this._rightIndex, data.right.size);
            if (!data.right.visible) {
                this._outerSplitview.setViewVisible(this._rightIndex, false);
            }
        }
        if (data.top) {
            this._topView?.setCollapsed(data.top.collapsed ?? false);
            this._middleColumn.resizeView('top', data.top.size);
            if (!data.top.visible) {
                this._middleColumn.setViewVisible('top', false);
            }
        }
        if (data.bottom) {
            this._bottomView?.setCollapsed(data.bottom.collapsed ?? false);
            this._middleColumn.resizeView('bottom', data.bottom.size);
            if (!data.bottom.visible) {
                this._middleColumn.setViewVisible('bottom', false);
            }
        }
    }

    dispose(): void {
        this._disposables.dispose();
        this._shellElement.parentElement?.removeChild(this._shellElement);
    }
}
