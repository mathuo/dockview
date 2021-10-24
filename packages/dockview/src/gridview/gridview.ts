/*---------------------------------------------------------------------------------------------
 * Accreditation: This file is largly based upon the MIT licenced VSCode sourcecode found at:
 * https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/grid
 *--------------------------------------------------------------------------------------------*/

import {
    ISplitviewStyles,
    LayoutPriority,
    Orientation,
    Sizing,
} from '../splitview/core/splitview';
import { Position } from '../dnd/droptarget';
import { tail } from '../array';
import { LeafNode } from './leafNode';
import { BranchNode } from './branchNode';
import { Node } from './types';
import { Emitter, Event } from '../events';
import { IDisposable, MutableDisposable } from '../lifecycle';

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
            orthogonalSize
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
            (node as LeafNode).view,
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

        if (direction === Position.Right || direction === Position.Bottom) {
            index += 1;
        }

        return [...rest, index];
    } else {
        const index =
            direction === Position.Right || direction === Position.Bottom
                ? 1
                : 0;
        return [...location, index];
    }
}

export function getDirectionOrientation(direction: Position): Orientation {
    return direction === Position.Top || direction === Position.Bottom
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
    priority?: LayoutPriority;
    layout(
        width: number,
        height: number
        // top: number, left: number
    ): void;
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

export interface ISerializedLeafNode {
    type: 'leaf';
    data: any;
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
export class Gridview implements IDisposable {
    private _root: BranchNode | undefined;
    public readonly element: HTMLElement;
    private disposable: MutableDisposable = new MutableDisposable();

    private readonly _onDidChange = new Emitter<number | undefined>();
    readonly onDidChange: Event<number | undefined> = this._onDidChange.event;

    public serialize() {
        const root = serializeBranchNode(this.getView(), this.orientation);

        return {
            root,
            width: this.width,
            height: this.height,
            orientation: this.orientation,
        };
    }

    public dispose() {
        this.disposable.dispose();
        this._onDidChange.dispose();
        this.root.dispose();
    }

    public clear() {
        const orientation = this.root.orientation;
        this.root = new BranchNode(
            orientation,
            this.proportionalLayout,
            this.styles,
            this.root.size,
            this.root.orthogonalSize
        );
    }

    public deserialize(json: any, deserializer: IViewDeserializer) {
        const orientation = json.orientation;
        const height = json.height;
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
                node.size,
                orthogonalSize,
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

    public get orientation() {
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

    private get root(): BranchNode {
        return this._root!;
    }

    private set root(root: BranchNode) {
        const oldRoot = this._root;

        if (oldRoot) {
            oldRoot.dispose();
            this.element.removeChild(oldRoot.element);
        }

        this._root = root;
        this.element.appendChild(this._root.element);
        this.disposable.value = this._root.onDidChange((e) => {
            this._onDidChange.fire(e);
        });
    }

    public next(location: number[]) {
        return this.progmaticSelect(location);
    }

    public previous(location: number[]) {
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

    private progmaticSelect(location: number[], reverse = false) {
        const [path, node] = this.getNode(location);

        if (!(node instanceof LeafNode)) {
            throw new Error('invalid location');
        }

        const findLeaf = (candiateNode: Node, last: boolean): LeafNode => {
            if (candiateNode instanceof LeafNode) {
                return candiateNode;
            }
            if (candiateNode instanceof BranchNode) {
                return findLeaf(
                    candiateNode.children[
                        last ? candiateNode.children.length - 1 : 0
                    ],
                    last
                );
            }
            throw new Error('invalid node');
        };

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
            0
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
        const [rest, index] = tail(location);
        const [, parent] = this.getNode(rest);

        if (!(parent instanceof BranchNode)) {
            throw new Error('Invalid from location');
        }

        parent.setChildVisible(index, visible);
    }

    public moveView(parentLocation: number[], from: number, to: number): void {
        const [, parent] = this.getNode(parentLocation);

        if (!(parent instanceof BranchNode)) {
            throw new Error('Invalid location');
        }

        parent.moveChild(from, to);
    }

    public addView(view: IGridView, size: number | Sizing, location: number[]) {
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

            grandParent.removeChild(parentIndex);

            const newParent = new BranchNode(
                parent.orientation,
                this.proportionalLayout,
                this.styles,
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

    public remove(view: IGridView, sizing?: Sizing) {
        const location = getGridLocation(view.element);
        return this.removeView(location, sizing);
    }

    removeView(location: number[], sizing?: Sizing): IGridView {
        const [rest, index] = tail(location);
        const [pathToParent, parent] = this.getNode(rest);

        if (!(parent instanceof BranchNode)) {
            throw new Error('Invalid location');
        }

        const node = parent.children[index];

        if (!(node instanceof LeafNode)) {
            throw new Error('Invalid location');
        }

        parent.removeChild(index, sizing);

        if (parent.children.length === 0) {
            // throw new Error('Invalid grid state');
            return node.view;
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
            parent.removeChild(0, sizing);
            this.root = sibling;
            return node.view;
        }

        const [grandParent, ..._] = [...pathToParent].reverse();
        const [parentIndex, ...__] = [...rest].reverse();

        const sibling = parent.children[0];
        const isSiblingVisible = parent.isChildVisible(0);
        parent.removeChild(0, sizing);

        const sizes = grandParent.children.map((size, i) =>
            grandParent.getChildSize(i)
        );
        grandParent.removeChild(parentIndex, sizing);

        if (sibling instanceof BranchNode) {
            sizes.splice(
                parentIndex,
                1,
                ...sibling.children.map((c) => c.size)
            );

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
            const siblingSizing = isSiblingVisible
                ? sibling.orthogonalSize
                : Sizing.Invisible(sibling.orthogonalSize);
            grandParent.addChild(newSibling, siblingSizing, parentIndex);
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
