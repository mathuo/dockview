/*---------------------------------------------------------------------------------------------
 * Accreditation: This file is largly based upon the MIT licenced VSCode sourcecode found at:
 * https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/grid
 *--------------------------------------------------------------------------------------------*/

import {
    ISplitviewStyles,
    EnhancedLayoutPriority,
    Orientation,
    Sizing,
} from '../splitview/splitview';
import { tail } from '../array';
import { LeafNode } from './leafNode';
import { BranchNode } from './branchNode';
import { Node } from './types';
import { Emitter, Event } from '../events';
import { IDisposable, MutableDisposable } from '../lifecycle';
import { Position } from '../dnd/droptarget';

function findLeaf(candiateNode: Node, last: boolean): LeafNode {
    if (candiateNode instanceof LeafNode) {
        return candiateNode;
    }
    if (candiateNode instanceof BranchNode) {
        return findLeaf(
            candiateNode.children[last ? candiateNode.children.length - 1 : 0],
            last
        );
    }
    throw new Error('invalid node');
}

function flipNode<T extends Node>(
    node: T,
    size: number,
    orthogonalSize: number
): T {
    if (node instanceof BranchNode) {
        const result = new BranchNode(
            orthogonal(node.orientation),
            node.proportionalLayout,
            node.styles,
            size,
            orthogonalSize,
            node.disabled
        );

        let totalSize = 0;

        for (let i = node.children.length - 1; i >= 0; i--) {
            const child = node.children[i];
            const childSize =
                child instanceof BranchNode ? child.orthogonalSize : child.size;

            let newSize =
                node.size === 0
                    ? 0
                    : Math.round((size * childSize) / node.size);
            totalSize += newSize;

            // The last view to add should adjust to rounding errors
            if (i === 0) {
                newSize += size - totalSize;
            }

            result.addChild(
                flipNode(child, orthogonalSize, newSize),
                newSize,
                0,
                true
            );
        }

        return result as T;
    } else {
        return new LeafNode(
            node.view,
            orthogonal(node.orientation),
            orthogonalSize
        ) as T;
    }
}

export function indexInParent(element: HTMLElement): number {
    const parentElement = element.parentElement;

    if (!parentElement) {
        throw new Error('Invalid grid element');
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
        throw new Error('Invalid grid element');
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
    direction: Position
): number[] {
    const orientation = getLocationOrientation(rootOrientation, location);
    const directionOrientation = getDirectionOrientation(direction);

    if (orientation === directionOrientation) {
        const [rest, _index] = tail(location);
        let index = _index;

        if (direction === 'right' || direction === 'bottom') {
            index += 1;
        }

        return [...rest, index];
    } else {
        const index = direction === 'right' || direction === 'bottom' ? 1 : 0;
        return [...location, index];
    }
}

export function getDirectionOrientation(direction: Position): Orientation {
    return direction === 'top' || direction === 'bottom'
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

export interface IViewSize {
    width?: number;
    height?: number;
}

export interface IGridView {
    readonly onDidChange: Event<IViewSize | undefined>;
    readonly element: HTMLElement;
    readonly minimumWidth: number;
    readonly maximumWidth: number;
    readonly minimumHeight: number;
    readonly maximumHeight: number;
    priority?: EnhancedLayoutPriority;
    layout(width: number, height: number): void;
    toJSON(): object;
    fromJSON?(json: object): void;
    snap?: boolean;
    setVisible?(visible: boolean): void;
}

export const orthogonal = (orientation: Orientation) =>
    orientation === Orientation.HORIZONTAL
        ? Orientation.VERTICAL
        : Orientation.HORIZONTAL;

export interface GridLeafNode<T extends IGridView> {
    readonly view: T;
    readonly cachedVisibleSize: number | undefined;
    readonly box: { width: number; height: number };
}

export interface GridBranchNode<T extends IGridView> {
    readonly children: GridNode<T>[];
    readonly box: { width: number; height: number };
}

export type GridNode<T extends IGridView> = GridLeafNode<T> | GridBranchNode<T>;

export function isGridBranchNode<T extends IGridView>(
    node: GridNode<T>
): node is GridBranchNode<T> {
    return !!(node as any).children;
}

export interface SerializedGridObject<T> {
    type: 'leaf' | 'branch';
    data: T | SerializedGridObject<T>[];
    size?: number;
    visible?: boolean;
}

const serializeBranchNode = <T extends IGridView>(
    node: GridNode<T>,
    orientation: Orientation
): SerializedGridObject<any> => {
    const size =
        orientation === Orientation.VERTICAL ? node.box.width : node.box.height;

    if (!isGridBranchNode(node)) {
        if (typeof node.cachedVisibleSize === 'number') {
            return {
                type: 'leaf',
                data: node.view.toJSON(),
                size: node.cachedVisibleSize,
                visible: false,
            };
        }

        return { type: 'leaf', data: node.view.toJSON(), size };
    }

    return {
        type: 'branch',
        data: node.children.map((c) =>
            serializeBranchNode(c, orthogonal(orientation))
        ),
        size,
    };
};

export interface ISerializedLeafNode<T = any> {
    type: 'leaf';
    data: T;
    size: number;
    visible?: boolean;
}

export interface ISerializedBranchNode {
    type: 'branch';
    data: ISerializedNode[];
    size: number;
}

export type ISerializedNode = ISerializedLeafNode | ISerializedBranchNode;

export interface INodeDescriptor {
    node: Node;
    visible?: boolean;
}

export interface IViewDeserializer {
    fromJSON: (data: ISerializedLeafNode) => IGridView;
}

export interface SerializedGridview<T> {
    root: SerializedGridObject<T>;
    width: number;
    height: number;
    orientation: Orientation;
}

export class Gridview implements IDisposable {
    readonly element: HTMLElement;

    private _root: BranchNode | undefined;
    private _locked = false;
    private _maximizedNode:
        | { leaf: LeafNode; hiddenOnMaximize: LeafNode[] }
        | undefined = undefined;
    private readonly disposable: MutableDisposable = new MutableDisposable();

    private readonly _onDidChange = new Emitter<{
        size?: number;
        orthogonalSize?: number;
    }>();
    readonly onDidChange: Event<{ size?: number; orthogonalSize?: number }> =
        this._onDidChange.event;

    private readonly _onDidMaximizedNodeChange = new Emitter<void>();
    readonly onDidMaximizedNodeChange = this._onDidMaximizedNodeChange.event;

    public get length(): number {
        return this._root ? this._root.children.length : 0;
    }

    public get orientation(): Orientation {
        return this.root.orientation;
    }

    public set orientation(orientation: Orientation) {
        if (this.root.orientation === orientation) {
            return;
        }

        const { size, orthogonalSize } = this.root;
        this.root = flipNode(this.root, orthogonalSize, size);
        this.root.layout(size, orthogonalSize);
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

    get locked(): boolean {
        return this._locked;
    }

    set locked(value: boolean) {
        this._locked = value;

        const branch: Node[] = [this.root];

        /**
         * simple depth-first-search to cover all nodes
         *
         * @see https://en.wikipedia.org/wiki/Depth-first_search
         */
        while (branch.length > 0) {
            const node = branch.pop();

            if (node instanceof BranchNode) {
                node.disabled = value;
                branch.push(...node.children);
            }
        }
    }

    maximizedView(): IGridView | undefined {
        return this._maximizedNode?.leaf.view;
    }

    hasMaximizedView(): boolean {
        return this._maximizedNode !== undefined;
    }

    maximizeView(view: IGridView): void {
        const location = getGridLocation(view.element);
        const [_, node] = this.getNode(location);

        if (!(node instanceof LeafNode)) {
            return;
        }

        if (this._maximizedNode?.leaf === node) {
            return;
        }

        if (this.hasMaximizedView()) {
            this.exitMaximizedView();
        }

        const hiddenOnMaximize: LeafNode[] = [];

        function hideAllViewsBut(parent: BranchNode, exclude: LeafNode): void {
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                if (child instanceof LeafNode) {
                    if (child !== exclude) {
                        if (parent.isChildVisible(i)) {
                            parent.setChildVisible(i, false);
                        } else {
                            hiddenOnMaximize.push(child);
                        }
                    }
                } else {
                    hideAllViewsBut(child, exclude);
                }
            }
        }

        hideAllViewsBut(this.root, node);
        this._maximizedNode = { leaf: node, hiddenOnMaximize };
        this._onDidMaximizedNodeChange.fire();
    }

    exitMaximizedView(): void {
        if (!this._maximizedNode) {
            return;
        }

        const hiddenOnMaximize = this._maximizedNode.hiddenOnMaximize;

        function showViewsInReverseOrder(parent: BranchNode): void {
            for (let index = parent.children.length - 1; index >= 0; index--) {
                const child = parent.children[index];
                if (child instanceof LeafNode) {
                    if (!hiddenOnMaximize.includes(child)) {
                        parent.setChildVisible(index, true);
                    }
                } else {
                    showViewsInReverseOrder(child);
                }
            }
        }

        showViewsInReverseOrder(this.root);

        this._maximizedNode = undefined;
        this._onDidMaximizedNodeChange.fire();
    }

    public serialize(): SerializedGridview<any> {
        if (this.hasMaximizedView()) {
            /**
             * do not persist maximized view state
             * firstly exit any maximized views to ensure the correct dimensions are persisted
             */
            this.exitMaximizedView();
        }

        const root = serializeBranchNode(this.getView(), this.orientation);

        return {
            root,
            width: this.width,
            height: this.height,
            orientation: this.orientation,
        };
    }

    public dispose(): void {
        this.disposable.dispose();
        this._onDidChange.dispose();
        this._onDidMaximizedNodeChange.dispose();
        this.root.dispose();
        this._maximizedNode = undefined;
        this.element.remove();
    }

    public clear(): void {
        const orientation = this.root.orientation;
        this.root = new BranchNode(
            orientation,
            this.proportionalLayout,
            this.styles,
            this.root.size,
            this.root.orthogonalSize,
            this._locked
        );
    }

    public deserialize<T>(
        json: SerializedGridview<T>,
        deserializer: IViewDeserializer
    ): void {
        const orientation = json.orientation;
        const height =
            orientation === Orientation.VERTICAL ? json.height : json.width;

        this._deserialize(
            json.root as ISerializedBranchNode,
            orientation,
            deserializer,
            height
        );
    }

    private _deserialize(
        root: ISerializedBranchNode,
        orientation: Orientation,
        deserializer: IViewDeserializer,
        orthogonalSize: number
    ): void {
        this.root = this._deserializeNode(
            root,
            orientation,
            deserializer,
            orthogonalSize
        ) as BranchNode;
    }

    private _deserializeNode(
        node: ISerializedNode,
        orientation: Orientation,
        deserializer: IViewDeserializer,
        orthogonalSize: number
    ): Node {
        let result: Node;
        if (node.type === 'branch') {
            const serializedChildren = node.data;
            const children = serializedChildren.map((serializedChild) => {
                return {
                    node: this._deserializeNode(
                        serializedChild,
                        orthogonal(orientation),
                        deserializer,
                        node.size
                    ),
                    visible: (serializedChild as { visible: boolean }).visible,
                } as INodeDescriptor;
            });

            result = new BranchNode(
                orientation,
                this.proportionalLayout,
                this.styles,
                node.size, // <- orthogonal size - flips at each depth
                orthogonalSize, // <- size - flips at each depth,
                this._locked,
                children
            );
        } else {
            result = new LeafNode(
                deserializer.fromJSON(node),
                orientation,
                orthogonalSize,
                node.size
            );
        }

        return result;
    }

    private get root(): BranchNode {
        return this._root!;
    }

    private set root(root: BranchNode) {
        const oldRoot = this._root;

        if (oldRoot) {
            oldRoot.dispose();
            this._maximizedNode = undefined;
            this.element.removeChild(oldRoot.element);
        }

        this._root = root;
        this.element.appendChild(this._root.element);
        this.disposable.value = this._root.onDidChange((e) => {
            this._onDidChange.fire(e);
        });
    }

    /**
     * If the root is orientated as a VERTICAL node then nest the existing root within a new HORIZIONTAL root node
     * If the root is orientated as a HORIZONTAL node then nest the existing root within a new VERITCAL root node
     */
    public insertOrthogonalSplitviewAtRoot(): void {
        if (!this._root) {
            return;
        }

        const oldRoot = this.root;
        oldRoot.element.remove();

        this._root = new BranchNode(
            orthogonal(oldRoot.orientation),
            this.proportionalLayout,
            this.styles,
            this.root.orthogonalSize,
            this.root.size,
            this._locked
        );

        if (oldRoot.children.length === 0) {
            // no data so no need to add anything back in
        } else if (oldRoot.children.length === 1) {
            // can remove one level of redundant branching if there is only a single child
            const childReference = oldRoot.children[0];
            const child = oldRoot.removeChild(0); // remove to prevent disposal when disposing of unwanted root
            child.dispose();
            oldRoot.dispose();

            this._root.addChild(
                /**
                 * the child node will have the same orientation as the new root since
                 * we are removing the inbetween node.
                 * the entire 'tree' must be flipped recursively to ensure that the orientation
                 * flips at each level
                 */
                flipNode(
                    childReference,
                    childReference.orthogonalSize,
                    childReference.size
                ),
                Sizing.Distribute,
                0
            );
        } else {
            this._root.addChild(oldRoot, Sizing.Distribute, 0);
        }

        this.element.appendChild(this._root.element);

        this.disposable.value = this._root.onDidChange((e) => {
            this._onDidChange.fire(e);
        });
    }

    public next(location: number[]): LeafNode {
        return this.progmaticSelect(location);
    }

    public previous(location: number[]): LeafNode {
        return this.progmaticSelect(location, true);
    }

    getView(): GridBranchNode<IGridView>;
    getView(location?: number[]): GridNode<IGridView>;
    getView(location?: number[]): GridNode<IGridView> {
        const node = location ? this.getNode(location)[1] : this.root;
        return this._getViews(node, this.orientation);
    }

    private _getViews(
        node: Node,
        orientation: Orientation,
        cachedVisibleSize?: number
    ): GridNode<IGridView> {
        const box = { height: node.height, width: node.width };

        if (node instanceof LeafNode) {
            return { box, view: node.view, cachedVisibleSize };
        }

        const children: GridNode<IGridView>[] = [];

        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            const nodeCachedVisibleSize = node.getChildCachedVisibleSize(i);

            children.push(
                this._getViews(
                    child,
                    orthogonal(orientation),
                    nodeCachedVisibleSize
                )
            );
        }

        return { box, children };
    }

    private progmaticSelect(location: number[], reverse = false): LeafNode {
        const [path, node] = this.getNode(location);

        if (!(node instanceof LeafNode)) {
            throw new Error('invalid location');
        }

        for (let i = path.length - 1; i > -1; i--) {
            const n = path[i];
            const l = location[i] || 0;
            const canProgressInCurrentLevel = reverse
                ? l - 1 > -1
                : l + 1 < n.children.length;
            if (canProgressInCurrentLevel) {
                return findLeaf(n.children[reverse ? l - 1 : l + 1], reverse);
            }
        }

        return findLeaf(this.root, reverse);
    }

    constructor(
        readonly proportionalLayout: boolean,
        readonly styles: ISplitviewStyles | undefined,
        orientation: Orientation
    ) {
        this.element = document.createElement('div');
        this.element.className = 'grid-view';
        this.root = new BranchNode(
            orientation,
            proportionalLayout,
            styles,
            0,
            0,
            this._locked
        );
    }

    isViewVisible(location: number[]): boolean {
        const [rest, index] = tail(location);
        const [, parent] = this.getNode(rest);

        if (!(parent instanceof BranchNode)) {
            throw new Error('Invalid from location');
        }

        return parent.isChildVisible(index);
    }

    setViewVisible(location: number[], visible: boolean): void {
        if (this.hasMaximizedView()) {
            this.exitMaximizedView();
        }

        const [rest, index] = tail(location);
        const [, parent] = this.getNode(rest);

        if (!(parent instanceof BranchNode)) {
            throw new Error('Invalid from location');
        }

        parent.setChildVisible(index, visible);
    }

    public moveView(parentLocation: number[], from: number, to: number): void {
        if (this.hasMaximizedView()) {
            this.exitMaximizedView();
        }

        const [, parent] = this.getNode(parentLocation);

        if (!(parent instanceof BranchNode)) {
            throw new Error('Invalid location');
        }

        parent.moveChild(from, to);
    }

    public addView(
        view: IGridView,
        size: number | Sizing,
        location: number[]
    ): void {
        if (this.hasMaximizedView()) {
            this.exitMaximizedView();
        }

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

            let newSiblingSize: number | Sizing = 0;

            const newSiblingCachedVisibleSize =
                grandParent.getChildCachedVisibleSize(parentIndex);
            if (typeof newSiblingCachedVisibleSize === 'number') {
                newSiblingSize = Sizing.Invisible(newSiblingCachedVisibleSize);
            }

            const child = grandParent.removeChild(parentIndex);
            child.dispose();

            const newParent = new BranchNode(
                parent.orientation,
                this.proportionalLayout,
                this.styles,
                parent.size,
                parent.orthogonalSize,
                this._locked
            );
            grandParent.addChild(newParent, parent.size, parentIndex);

            const newSibling = new LeafNode(
                parent.view,
                grandParent.orientation,
                parent.size
            );
            newParent.addChild(newSibling, newSiblingSize, 0);

            if (typeof size !== 'number' && size.type === 'split') {
                size = { type: 'split', index: 0 };
            }

            const node = new LeafNode(
                view,
                grandParent.orientation,
                parent.size
            );
            newParent.addChild(node, size, index);
        }
    }

    public remove(view: IGridView, sizing?: Sizing): IGridView {
        const location = getGridLocation(view.element);
        return this.removeView(location, sizing);
    }

    removeView(location: number[], sizing?: Sizing): IGridView {
        if (this.hasMaximizedView()) {
            this.exitMaximizedView();
        }

        const [rest, index] = tail(location);
        const [pathToParent, parent] = this.getNode(rest);

        if (!(parent instanceof BranchNode)) {
            throw new Error('Invalid location');
        }

        const nodeToRemove = parent.children[index];

        if (!(nodeToRemove instanceof LeafNode)) {
            throw new Error('Invalid location');
        }

        parent.removeChild(index, sizing);
        nodeToRemove.dispose();

        if (parent.children.length !== 1) {
            return nodeToRemove.view;
        }

        // if the parent has only one child and we know the parent is a BranchNode we can make the tree
        // more efficiently spaced by replacing the parent BranchNode with the child.
        // if that child is a LeafNode then we simply replace the BranchNode with the child otherwise if the child
        // is a BranchNode too we should spread it's children into the grandparent.

        // refer to the remaining child as the sibling
        const sibling = parent.children[0];

        if (pathToParent.length === 0) {
            // if the parent is root

            if (sibling instanceof LeafNode) {
                // if the sibling is a leaf node no action is required
                return nodeToRemove.view;
            }

            // otherwise the sibling is a branch node. since the parent is the root and the root has only one child
            // which is a branch node we can just set this branch node to be the new root node

            // for good housekeeping we'll removing the sibling from it's existing tree
            parent.removeChild(0, sizing);

            // and set that sibling node to be root
            this.root = sibling;

            return nodeToRemove.view;
        }

        // otherwise the parent is apart of a large sub-tree

        const [grandParent, ..._] = [...pathToParent].reverse();
        const [parentIndex, ...__] = [...rest].reverse();

        const isSiblingVisible = parent.isChildVisible(0);

        // either way we need to remove the sibling from it's existing tree
        parent.removeChild(0, sizing);

        // note the sizes of all of the grandparents children
        const sizes = grandParent.children.map((_size, i) =>
            grandParent.getChildSize(i)
        );

        // remove the parent from the grandparent since we are moving the sibling to take the parents place
        // this parent is no longer used and can be disposed of
        grandParent.removeChild(parentIndex, sizing).dispose();

        if (sibling instanceof BranchNode) {
            // replace the parent with the siblings children
            sizes.splice(
                parentIndex,
                1,
                ...sibling.children.map((c) => c.size)
            );

            // and add those siblings to the grandparent
            for (let i = 0; i < sibling.children.length; i++) {
                const child = sibling.children[i];
                grandParent.addChild(child, child.size, parentIndex + i);
            }

            /**
             * clean down the branch node since we need to dipose of it and
             * when .dispose() it called on a branch it will dispose of any
             * views it is holding onto.
             */
            while (sibling.children.length > 0) {
                sibling.removeChild(0);
            }
        } else {
            // otherwise create a new leaf node and add that to the grandparent

            const newSibling = new LeafNode(
                sibling.view,
                orthogonal(sibling.orientation),
                sibling.size
            );
            const siblingSizing = isSiblingVisible
                ? sibling.orthogonalSize
                : Sizing.Invisible(sibling.orthogonalSize);

            grandParent.addChild(newSibling, siblingSizing, parentIndex);
        }

        // the containing node of the sibling is no longer required and can be disposed of
        sibling.dispose();

        // resize everything
        for (let i = 0; i < sizes.length; i++) {
            grandParent.resizeChild(i, sizes[i]);
        }

        return nodeToRemove.view;
    }

    public layout(width: number, height: number): void {
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
            throw new Error('Invalid location');
        }

        const [index, ...rest] = location;

        if (index < 0 || index >= node.children.length) {
            throw new Error('Invalid location');
        }

        const child = node.children[index];
        path.push(node);

        return this.getNode(rest, child, path);
    }
}
