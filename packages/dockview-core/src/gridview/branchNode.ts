/*---------------------------------------------------------------------------------------------
 * Accreditation: This file is largly based upon the MIT licenced VSCode sourcecode found at:
 * https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/grid
 *--------------------------------------------------------------------------------------------*/

import {
    IView,
    Splitview,
    Orientation,
    Sizing,
    LayoutPriority,
    ISplitviewStyles,
} from '../splitview/splitview';
import { Emitter, Event } from '../events';
import { INodeDescriptor } from './gridview';
import { LeafNode } from './leafNode';
import { Node } from './types';
import { CompositeDisposable, IDisposable, Disposable } from '../lifecycle';

export class BranchNode extends CompositeDisposable implements IView {
    readonly element: HTMLElement;
    private readonly splitview: Splitview;
    private _orthogonalSize: number;
    private _size: number;
    private _childrenDisposable: IDisposable = Disposable.NONE;

    public readonly children: Node[] = [];

    private readonly _onDidChange = new Emitter<{
        size?: number;
        orthogonalSize?: number;
    }>();
    readonly onDidChange: Event<{ size?: number; orthogonalSize?: number }> =
        this._onDidChange.event;

    private readonly _onDidVisibilityChange = new Emitter<{
        visible: boolean;
    }>();
    readonly onDidVisibilityChange: Event<{
        visible: boolean;
    }> = this._onDidVisibilityChange.event;

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
            : Math.max(
                  ...this.children.map((c, index) =>
                      this.splitview.isViewVisible(index)
                          ? c.minimumOrthogonalSize
                          : 0
                  )
              );
    }

    get maximumSize(): number {
        return Math.min(
            ...this.children.map((c, index) =>
                this.splitview.isViewVisible(index)
                    ? c.maximumOrthogonalSize
                    : Number.POSITIVE_INFINITY
            )
        );
    }

    get minimumOrthogonalSize(): number {
        return this.splitview.minimumSize;
    }

    get maximumOrthogonalSize(): number {
        return this.splitview.maximumSize;
    }

    get orthogonalSize(): number {
        return this._orthogonalSize;
    }

    get size(): number {
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

    get priority(): LayoutPriority {
        if (this.children.length === 0) {
            return LayoutPriority.Normal;
        }

        const priorities = this.children.map((c) =>
            typeof c.priority === 'undefined'
                ? LayoutPriority.Normal
                : c.priority
        );

        if (priorities.some((p) => p === LayoutPriority.High)) {
            return LayoutPriority.High;
        } else if (priorities.some((p) => p === LayoutPriority.Low)) {
            return LayoutPriority.Low;
        }

        return LayoutPriority.Normal;
    }

    get disabled(): boolean {
        return this.splitview.disabled;
    }

    set disabled(value: boolean) {
        this.splitview.disabled = value;
    }

    get margin(): number {
        return this.splitview.margin;
    }

    set margin(value: number) {
        this.splitview.margin = value;

        this.children.forEach((child) => {
            if (child instanceof BranchNode) {
                child.margin = value;
            }
        });
    }

    constructor(
        readonly orientation: Orientation,
        readonly proportionalLayout: boolean,
        readonly styles: ISplitviewStyles | undefined,
        size: number,
        orthogonalSize: number,
        disabled: boolean,
        margin: number | undefined,
        childDescriptors?: INodeDescriptor[]
    ) {
        super();
        this._orthogonalSize = orthogonalSize;
        this._size = size;

        this.element = document.createElement('div');
        this.element.className = 'dv-branch-node';

        if (!childDescriptors) {
            this.splitview = new Splitview(this.element, {
                orientation: this.orientation,
                proportionalLayout,
                styles,
                margin,
            });
            this.splitview.layout(this.size, this.orthogonalSize);
        } else {
            const descriptor = {
                views: childDescriptors.map((childDescriptor) => {
                    return {
                        view: childDescriptor.node,
                        size: childDescriptor.node.size,
                        visible:
                            childDescriptor.node instanceof LeafNode &&
                            childDescriptor.visible !== undefined
                                ? childDescriptor.visible
                                : true,
                    };
                }),
                size: this.orthogonalSize,
            };

            this.children = childDescriptors.map((c) => c.node);
            this.splitview = new Splitview(this.element, {
                orientation: this.orientation,
                descriptor,
                proportionalLayout,
                styles,
                margin,
            });
        }

        this.disabled = disabled;

        this.addDisposables(
            this._onDidChange,
            this._onDidVisibilityChange,
            this.splitview.onDidSashEnd(() => {
                this._onDidChange.fire({});
            })
        );

        this.setupChildrenEvents();
    }

    setVisible(_visible: boolean): void {
        // noop
    }

    isChildVisible(index: number): boolean {
        if (index < 0 || index >= this.children.length) {
            throw new Error('Invalid index');
        }

        return this.splitview.isViewVisible(index);
    }

    setChildVisible(index: number, visible: boolean): void {
        if (index < 0 || index >= this.children.length) {
            throw new Error('Invalid index');
        }

        if (this.splitview.isViewVisible(index) === visible) {
            return;
        }

        const wereAllChildrenHidden = this.splitview.contentSize === 0;

        this.splitview.setViewVisible(index, visible);
        // }
        const areAllChildrenHidden = this.splitview.contentSize === 0;

        // If all children are hidden then the parent should hide the entire splitview
        // If the entire splitview is hidden then the parent should show the splitview when a child is shown
        if (
            (visible && wereAllChildrenHidden) ||
            (!visible && areAllChildrenHidden)
        ) {
            this._onDidVisibilityChange.fire({ visible });
        }
    }

    moveChild(from: number, to: number): void {
        if (from === to) {
            return;
        }

        if (from < 0 || from >= this.children.length) {
            throw new Error('Invalid from index');
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
            throw new Error('Invalid index');
        }

        return this.splitview.getViewSize(index);
    }

    resizeChild(index: number, size: number): void {
        if (index < 0 || index >= this.children.length) {
            throw new Error('Invalid index');
        }

        this.splitview.resizeView(index, size);
    }

    public layout(size: number, orthogonalSize: number) {
        this._size = orthogonalSize;
        this._orthogonalSize = size;

        this.splitview.layout(orthogonalSize, size);
    }

    public addChild(
        node: Node,
        size: number | Sizing,
        index: number,
        skipLayout?: boolean
    ): void {
        if (index < 0 || index > this.children.length) {
            throw new Error('Invalid index');
        }

        this.splitview.addView(node, size, index, skipLayout);
        this._addChild(node, index);
    }

    getChildCachedVisibleSize(index: number): number | undefined {
        if (index < 0 || index >= this.children.length) {
            throw new Error('Invalid index');
        }

        return this.splitview.getViewCachedVisibleSize(index);
    }

    public removeChild(index: number, sizing?: Sizing): Node {
        if (index < 0 || index >= this.children.length) {
            throw new Error('Invalid index');
        }

        this.splitview.removeView(index, sizing);
        return this._removeChild(index);
    }

    private _addChild(node: Node, index: number): void {
        this.children.splice(index, 0, node);
        this.setupChildrenEvents();
    }

    private _removeChild(index: number): Node {
        const [child] = this.children.splice(index, 1);
        this.setupChildrenEvents();

        return child;
    }

    private setupChildrenEvents(): void {
        this._childrenDisposable.dispose();

        this._childrenDisposable = new CompositeDisposable(
            Event.any(...this.children.map((c) => c.onDidChange))((e) => {
                /**
                 * indicate a change has occured to allows any re-rendering but don't bubble
                 * event because that was specific to this branch
                 */
                this._onDidChange.fire({ size: e.orthogonalSize });
            }),
            ...this.children.map((c, i) => {
                if (c instanceof BranchNode) {
                    return c.onDidVisibilityChange(({ visible }) => {
                        this.setChildVisible(i, visible);
                    });
                }
                return Disposable.NONE;
            })
        );
    }

    public dispose(): void {
        this._childrenDisposable.dispose();
        this.splitview.dispose();
        this.children.forEach((child) => child.dispose());

        super.dispose();
    }
}
