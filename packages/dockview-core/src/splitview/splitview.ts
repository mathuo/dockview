/*---------------------------------------------------------------------------------------------
 * Accreditation: This file is largly based upon the MIT licenced VSCode sourcecode found at:
 * https://github.com/microsoft/vscode/tree/main/src/vs/base/browser/ui/splitview
 *--------------------------------------------------------------------------------------------*/

import {
    removeClasses,
    addClasses,
    toggleClass,
    getElementsByTagName,
    disableIframePointEvents,
} from '../dom';
import { Event, Emitter } from '../events';
import { pushToStart, pushToEnd, firstIndex } from '../array';
import { range, clamp } from '../math';
import { ViewItem } from './viewItem';
import { IDisposable } from '../lifecycle';

export enum Orientation {
    HORIZONTAL = 'HORIZONTAL',
    VERTICAL = 'VERTICAL',
}

export enum SashState {
    MAXIMUM,
    MINIMUM,
    DISABLED,
    ENABLED,
}

export interface ISplitviewStyles {
    separatorBorder: string;
}

export interface SplitViewOptions {
    readonly orientation: Orientation;
    readonly descriptor?: ISplitViewDescriptor;
    readonly proportionalLayout?: boolean;
    readonly styles?: ISplitviewStyles;
    readonly margin?: number;
}

export enum LayoutPriority {
    Low = 'low', // view is offered space last
    High = 'high', // view is offered space first
    Normal = 'normal', // view is offered space in view order
}

export interface IBaseView extends IDisposable {
    minimumSize: number;
    maximumSize: number;
    snap?: boolean;
    priority?: LayoutPriority;
}

export interface IView extends IBaseView {
    readonly element: HTMLElement | DocumentFragment;
    readonly onDidChange: Event<{ size?: number; orthogonalSize?: number }>;
    layout(size: number, orthogonalSize: number): void;
    setVisible(visible: boolean): void;
}

interface ISashItem {
    container: HTMLElement;
    disposable: () => void;
}

interface ISashDragSnapState {
    readonly index: number;
    readonly limitDelta: number;
    readonly size: number;
}

type ViewItemSize = number | { cachedVisibleSize: number };

export type DistributeSizing = { type: 'distribute' };
export type SplitSizing = { type: 'split'; index: number };
export type InvisibleSizing = { type: 'invisible'; cachedVisibleSize: number };
export type Sizing = DistributeSizing | SplitSizing | InvisibleSizing;

export namespace Sizing {
    export const Distribute: DistributeSizing = { type: 'distribute' };
    export function Split(index: number): SplitSizing {
        return { type: 'split', index };
    }
    export function Invisible(cachedVisibleSize: number): InvisibleSizing {
        return { type: 'invisible', cachedVisibleSize };
    }
}

export interface ISplitViewDescriptor {
    size: number;
    views: {
        visible?: boolean;
        size: number;
        view: IView;
    }[];
}

export class Splitview {
    private element: HTMLElement;
    private viewContainer: HTMLElement;
    private sashContainer: HTMLElement;
    private viewItems: ViewItem[] = [];
    private sashes: ISashItem[] = [];
    private _orientation: Orientation;
    private _size = 0;
    private _orthogonalSize = 0;
    private _contentSize = 0;
    private _proportions: (number | undefined)[] | undefined = undefined;
    private proportionalLayout: boolean;
    private _startSnappingEnabled = true;
    private _endSnappingEnabled = true;
    private _disabled = false;
    private _margin = 0;

    private readonly _onDidSashEnd = new Emitter<void>();
    readonly onDidSashEnd = this._onDidSashEnd.event;
    private readonly _onDidAddView = new Emitter<IView>();
    readonly onDidAddView = this._onDidAddView.event;
    private readonly _onDidRemoveView = new Emitter<IView>();
    readonly onDidRemoveView = this._onDidRemoveView.event;

    get contentSize(): number {
        return this._contentSize;
    }

    get size(): number {
        return this._size;
    }

    set size(value: number) {
        this._size = value;
    }

    get orthogonalSize(): number {
        return this._orthogonalSize;
    }

    set orthogonalSize(value: number) {
        this._orthogonalSize = value;
    }

    public get length(): number {
        return this.viewItems.length;
    }

    public get proportions(): (number | undefined)[] | undefined {
        return this._proportions ? [...this._proportions] : undefined;
    }

    get orientation(): Orientation {
        return this._orientation;
    }

    set orientation(value: Orientation) {
        this._orientation = value;

        const tmp = this.size;
        this.size = this.orthogonalSize;
        this.orthogonalSize = tmp;

        removeClasses(this.element, 'horizontal', 'vertical');
        this.element.classList.add(
            this.orientation == Orientation.HORIZONTAL
                ? 'horizontal'
                : 'vertical'
        );
    }

    get minimumSize(): number {
        return this.viewItems.reduce((r, item) => r + item.minimumSize, 0);
    }

    get maximumSize(): number {
        return this.length === 0
            ? Number.POSITIVE_INFINITY
            : this.viewItems.reduce((r, item) => r + item.maximumSize, 0);
    }

    get startSnappingEnabled(): boolean {
        return this._startSnappingEnabled;
    }

    set startSnappingEnabled(startSnappingEnabled: boolean) {
        if (this._startSnappingEnabled === startSnappingEnabled) {
            return;
        }

        this._startSnappingEnabled = startSnappingEnabled;
        this.updateSashEnablement();
    }

    get endSnappingEnabled(): boolean {
        return this._endSnappingEnabled;
    }

    set endSnappingEnabled(endSnappingEnabled: boolean) {
        if (this._endSnappingEnabled === endSnappingEnabled) {
            return;
        }

        this._endSnappingEnabled = endSnappingEnabled;
        this.updateSashEnablement();
    }

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._disabled = value;

        toggleClass(this.element, 'dv-splitview-disabled', value);
    }

    get margin(): number {
        return this._margin;
    }

    set margin(value: number) {
        this._margin = value;
    }

    constructor(
        private readonly container: HTMLElement,
        options: SplitViewOptions
    ) {
        this._orientation = options.orientation;
        this.element = this.createContainer();

        this.margin = options.margin ?? 0;

        this.proportionalLayout =
            options.proportionalLayout === undefined
                ? true
                : !!options.proportionalLayout;

        this.viewContainer = this.createViewContainer();
        this.sashContainer = this.createSashContainer();

        this.element.appendChild(this.sashContainer);
        this.element.appendChild(this.viewContainer);

        this.container.appendChild(this.element);

        this.style(options.styles);

        // We have an existing set of view, add them now
        if (options.descriptor) {
            this._size = options.descriptor.size;
            options.descriptor.views.forEach((viewDescriptor, index) => {
                const sizing =
                    viewDescriptor.visible === undefined ||
                    viewDescriptor.visible
                        ? viewDescriptor.size
                        : ({
                              type: 'invisible',
                              cachedVisibleSize: viewDescriptor.size,
                          } as InvisibleSizing);

                const view = viewDescriptor.view;
                this.addView(
                    view,
                    sizing,
                    index,
                    true
                    // true skip layout
                );
            });

            // Initialize content size and proportions for first layout
            this._contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
            this.saveProportions();
        }
    }

    style(styles?: ISplitviewStyles): void {
        if (styles?.separatorBorder === 'transparent') {
            removeClasses(this.element, 'separator-border');
            this.element.style.removeProperty('--dv-separator-border');
        } else {
            addClasses(this.element, 'separator-border');
            if (styles?.separatorBorder) {
                this.element.style.setProperty(
                    '--dv-separator-border',
                    styles.separatorBorder
                );
            }
        }
    }

    isViewVisible(index: number): boolean {
        if (index < 0 || index >= this.viewItems.length) {
            throw new Error('Index out of bounds');
        }

        const viewItem = this.viewItems[index];
        return viewItem.visible;
    }

    setViewVisible(index: number, visible: boolean): void {
        if (index < 0 || index >= this.viewItems.length) {
            throw new Error('Index out of bounds');
        }

        const viewItem = this.viewItems[index];

        viewItem.setVisible(visible, viewItem.size);

        this.distributeEmptySpace(index);
        this.layoutViews();
        this.saveProportions();
    }

    getViewSize(index: number): number {
        if (index < 0 || index >= this.viewItems.length) {
            return -1;
        }

        return this.viewItems[index].size;
    }

    resizeView(index: number, size: number): void {
        if (index < 0 || index >= this.viewItems.length) {
            return;
        }

        const indexes = range(this.viewItems.length).filter((i) => i !== index);
        const lowPriorityIndexes = [
            ...indexes.filter(
                (i) => this.viewItems[i].priority === LayoutPriority.Low
            ),
            index,
        ];
        const highPriorityIndexes = indexes.filter(
            (i) => this.viewItems[i].priority === LayoutPriority.High
        );

        const item = this.viewItems[index];
        size = Math.round(size);
        size = clamp(
            size,
            item.minimumSize,
            Math.min(item.maximumSize, this._size)
        );

        item.size = size;
        this.relayout(lowPriorityIndexes, highPriorityIndexes);
    }

    public getViews<T extends IView>(): T[] {
        return this.viewItems.map((x) => x.view as T);
    }

    private onDidChange(item: ViewItem, size: number | undefined): void {
        const index = this.viewItems.indexOf(item);

        if (index < 0 || index >= this.viewItems.length) {
            return;
        }

        size = typeof size === 'number' ? size : item.size;
        size = clamp(size, item.minimumSize, item.maximumSize);

        item.size = size;

        const indexes = range(this.viewItems.length).filter((i) => i !== index);
        const lowPriorityIndexes = [
            ...indexes.filter(
                (i) => this.viewItems[i].priority === LayoutPriority.Low
            ),
            index,
        ];
        const highPriorityIndexes = indexes.filter(
            (i) => this.viewItems[i].priority === LayoutPriority.High
        );

        /**
         * add this view we are changing to the low-index list since we have determined the size
         * here and don't want it changed
         */
        this.relayout([...lowPriorityIndexes, index], highPriorityIndexes);
    }

    public addView(
        view: IView,
        size: number | Sizing = { type: 'distribute' },
        index: number = this.viewItems.length,
        skipLayout?: boolean
    ): void {
        const container = document.createElement('div');
        container.className = 'view';

        container.appendChild(view.element);

        let viewSize: ViewItemSize;

        if (typeof size === 'number') {
            viewSize = size;
        } else if (size.type === 'split') {
            viewSize = this.getViewSize(size.index) / 2;
        } else if (size.type === 'invisible') {
            viewSize = { cachedVisibleSize: size.cachedVisibleSize };
        } else {
            viewSize = view.minimumSize;
        }

        const disposable = view.onDidChange((newSize) =>
            this.onDidChange(viewItem, newSize.size)
        );

        const viewItem = new ViewItem(container, view, viewSize, {
            dispose: () => {
                disposable.dispose();
                this.viewContainer.removeChild(container);
            },
        });

        if (index === this.viewItems.length) {
            this.viewContainer.appendChild(container);
        } else {
            this.viewContainer.insertBefore(
                container,
                this.viewContainer.children.item(index)
            );
        }

        this.viewItems.splice(index, 0, viewItem);

        if (this.viewItems.length > 1) {
            //add sash
            const sash = document.createElement('div');
            sash.className = 'sash';

            const onPointerStart = (event: PointerEvent) => {
                for (const item of this.viewItems) {
                    item.enabled = false;
                }

                const iframes = disableIframePointEvents();

                const start =
                    this._orientation === Orientation.HORIZONTAL
                        ? event.clientX
                        : event.clientY;

                const sashIndex = firstIndex(
                    this.sashes,
                    (s) => s.container === sash
                );

                //
                const sizes = this.viewItems.map((x) => x.size);

                //
                let snapBefore: ISashDragSnapState | undefined;
                let snapAfter: ISashDragSnapState | undefined;
                const upIndexes = range(sashIndex, -1);
                const downIndexes = range(sashIndex + 1, this.viewItems.length);
                const minDeltaUp = upIndexes.reduce(
                    (r, i) => r + (this.viewItems[i].minimumSize - sizes[i]),
                    0
                );
                const maxDeltaUp = upIndexes.reduce(
                    (r, i) =>
                        r + (this.viewItems[i].viewMaximumSize - sizes[i]),
                    0
                );
                const maxDeltaDown =
                    downIndexes.length === 0
                        ? Number.POSITIVE_INFINITY
                        : downIndexes.reduce(
                              (r, i) =>
                                  r +
                                  (sizes[i] - this.viewItems[i].minimumSize),
                              0
                          );
                const minDeltaDown =
                    downIndexes.length === 0
                        ? Number.NEGATIVE_INFINITY
                        : downIndexes.reduce(
                              (r, i) =>
                                  r +
                                  (sizes[i] -
                                      this.viewItems[i].viewMaximumSize),
                              0
                          );
                const minDelta = Math.max(minDeltaUp, minDeltaDown);
                const maxDelta = Math.min(maxDeltaDown, maxDeltaUp);
                const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                const snapAfterIndex = this.findFirstSnapIndex(downIndexes);
                if (typeof snapBeforeIndex === 'number') {
                    const snappedViewItem = this.viewItems[snapBeforeIndex];
                    const halfSize = Math.floor(
                        snappedViewItem.viewMinimumSize / 2
                    );

                    snapBefore = {
                        index: snapBeforeIndex,
                        limitDelta: snappedViewItem.visible
                            ? minDelta - halfSize
                            : minDelta + halfSize,
                        size: snappedViewItem.size,
                    };
                }

                if (typeof snapAfterIndex === 'number') {
                    const snappedViewItem = this.viewItems[snapAfterIndex];
                    const halfSize = Math.floor(
                        snappedViewItem.viewMinimumSize / 2
                    );

                    snapAfter = {
                        index: snapAfterIndex,
                        limitDelta: snappedViewItem.visible
                            ? maxDelta + halfSize
                            : maxDelta - halfSize,
                        size: snappedViewItem.size,
                    };
                }

                const onPointerMove = (event: PointerEvent) => {
                    const current =
                        this._orientation === Orientation.HORIZONTAL
                            ? event.clientX
                            : event.clientY;
                    const delta = current - start;

                    this.resize(
                        sashIndex,
                        delta,
                        sizes,
                        undefined,
                        undefined,
                        minDelta,
                        maxDelta,
                        snapBefore,
                        snapAfter
                    );
                    this.distributeEmptySpace();
                    this.layoutViews();
                };

                const end = () => {
                    for (const item of this.viewItems) {
                        item.enabled = true;
                    }

                    iframes.release();

                    this.saveProportions();

                    document.removeEventListener('pointermove', onPointerMove);
                    document.removeEventListener('pointerup', end);
                    document.removeEventListener('pointercancel', end);

                    this._onDidSashEnd.fire(undefined);
                };

                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', end);
                document.addEventListener('pointercancel', end);
            };

            sash.addEventListener('pointerdown', onPointerStart);

            const sashItem: ISashItem = {
                container: sash,
                disposable: () => {
                    sash.removeEventListener('pointerdown', onPointerStart);
                    this.sashContainer.removeChild(sash);
                },
            };

            this.sashContainer.appendChild(sash);
            this.sashes.push(sashItem);
        }

        if (!skipLayout) {
            this.relayout([index]);
        }

        if (
            !skipLayout &&
            typeof size !== 'number' &&
            size.type === 'distribute'
        ) {
            this.distributeViewSizes();
        }

        this._onDidAddView.fire(view);
    }

    distributeViewSizes(): void {
        const flexibleViewItems: ViewItem[] = [];
        let flexibleSize = 0;

        for (const item of this.viewItems) {
            if (item.maximumSize - item.minimumSize > 0) {
                flexibleViewItems.push(item);
                flexibleSize += item.size;
            }
        }

        const size = Math.floor(flexibleSize / flexibleViewItems.length);

        for (const item of flexibleViewItems) {
            item.size = clamp(size, item.minimumSize, item.maximumSize);
        }

        const indexes = range(this.viewItems.length);
        const lowPriorityIndexes = indexes.filter(
            (i) => this.viewItems[i].priority === LayoutPriority.Low
        );
        const highPriorityIndexes = indexes.filter(
            (i) => this.viewItems[i].priority === LayoutPriority.High
        );

        this.relayout(lowPriorityIndexes, highPriorityIndexes);
    }

    public removeView(
        index: number,
        sizing?: Sizing,
        skipLayout = false
    ): IView {
        // Remove view
        const viewItem = this.viewItems.splice(index, 1)[0];
        viewItem.dispose();

        // Remove sash
        if (this.viewItems.length >= 1) {
            const sashIndex = Math.max(index - 1, 0);
            const sashItem = this.sashes.splice(sashIndex, 1)[0];
            sashItem.disposable();
        }

        if (!skipLayout) {
            this.relayout();
        }

        if (sizing && sizing.type === 'distribute') {
            this.distributeViewSizes();
        }

        this._onDidRemoveView.fire(viewItem.view);

        return viewItem.view;
    }

    getViewCachedVisibleSize(index: number): number | undefined {
        if (index < 0 || index >= this.viewItems.length) {
            throw new Error('Index out of bounds');
        }

        const viewItem = this.viewItems[index];
        return viewItem.cachedVisibleSize;
    }

    public moveView(from: number, to: number): void {
        const cachedVisibleSize = this.getViewCachedVisibleSize(from);
        const sizing =
            typeof cachedVisibleSize === 'undefined'
                ? this.getViewSize(from)
                : Sizing.Invisible(cachedVisibleSize);
        const view = this.removeView(from, undefined, true);
        this.addView(view, sizing, to);
    }

    public layout(size: number, orthogonalSize: number): void {
        const previousSize = Math.max(this.size, this._contentSize);
        this.size = size;
        this.orthogonalSize = orthogonalSize;

        if (!this.proportions) {
            const indexes = range(this.viewItems.length);
            const lowPriorityIndexes = indexes.filter(
                (i) => this.viewItems[i].priority === LayoutPriority.Low
            );
            const highPriorityIndexes = indexes.filter(
                (i) => this.viewItems[i].priority === LayoutPriority.High
            );

            this.resize(
                this.viewItems.length - 1,
                size - previousSize,
                undefined,
                lowPriorityIndexes,
                highPriorityIndexes
            );
        } else {
            let total = 0;

            for (let i = 0; i < this.viewItems.length; i++) {
                const item = this.viewItems[i];
                const proportion = this.proportions[i];

                if (typeof proportion === 'number') {
                    total += proportion;
                } else {
                    size -= item.size;
                }
            }

            for (let i = 0; i < this.viewItems.length; i++) {
                const item = this.viewItems[i];
                const proportion = this.proportions[i];

                if (typeof proportion === 'number' && total > 0) {
                    item.size = clamp(
                        Math.round((proportion * size) / total),
                        item.minimumSize,
                        item.maximumSize
                    );
                }
            }
        }

        this.distributeEmptySpace();
        this.layoutViews();
    }

    private relayout(
        lowPriorityIndexes?: number[],
        highPriorityIndexes?: number[]
    ): void {
        const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);

        this.resize(
            this.viewItems.length - 1,
            this._size - contentSize,
            undefined,
            lowPriorityIndexes,
            highPriorityIndexes
        );
        this.distributeEmptySpace();
        this.layoutViews();
        this.saveProportions();
    }

    private distributeEmptySpace(lowPriorityIndex?: number): void {
        const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
        let emptyDelta = this.size - contentSize;

        const indexes = range(this.viewItems.length - 1, -1);
        const lowPriorityIndexes = indexes.filter(
            (i) => this.viewItems[i].priority === LayoutPriority.Low
        );
        const highPriorityIndexes = indexes.filter(
            (i) => this.viewItems[i].priority === LayoutPriority.High
        );

        for (const index of highPriorityIndexes) {
            pushToStart(indexes, index);
        }

        for (const index of lowPriorityIndexes) {
            pushToEnd(indexes, index);
        }

        if (typeof lowPriorityIndex === 'number') {
            pushToEnd(indexes, lowPriorityIndex);
        }

        for (let i = 0; emptyDelta !== 0 && i < indexes.length; i++) {
            const item = this.viewItems[indexes[i]];
            const size = clamp(
                item.size + emptyDelta,
                item.minimumSize,
                item.maximumSize
            );
            const viewDelta = size - item.size;

            emptyDelta -= viewDelta;
            item.size = size;
        }
    }

    private saveProportions(): void {
        if (this.proportionalLayout && this._contentSize > 0) {
            this._proportions = this.viewItems.map((i) =>
                i.visible ? i.size / this._contentSize : undefined
            );
        }
    }

    /**
     * Margin explain:
     *
     * For `n` views in a splitview there will be `n-1` margins `m`.
     *
     * To fit the margins each view must reduce in size by `(m * (n - 1)) / n`.
     *
     * For each view `i` the offet must be adjusted by `m * i/(n - 1)`.
     */
    private layoutViews(): void {
        this._contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);

        this.updateSashEnablement();

        if (this.viewItems.length === 0) {
            return;
        }

        const visibleViewItems = this.viewItems.filter((i) => i.visible);

        const sashCount = Math.max(0, visibleViewItems.length - 1);
        const marginReducedSize =
            (this.margin * sashCount) / Math.max(1, visibleViewItems.length);

        let totalLeftOffset = 0;
        const viewLeftOffsets: number[] = [];

        const sashWidth = 4; // hardcoded in css

        const runningVisiblePanelCount = this.viewItems.reduce(
            (arr, viewItem, i) => {
                const flag = viewItem.visible ? 1 : 0;
                if (i === 0) {
                    arr.push(flag);
                } else {
                    arr.push(arr[i - 1] + flag);
                }

                return arr;
            },
            [] as number[]
        );

        // calculate both view and cash positions
        this.viewItems.forEach((view, i) => {
            totalLeftOffset += this.viewItems[i].size;
            viewLeftOffsets.push(totalLeftOffset);

            const size = view.visible ? view.size - marginReducedSize : 0;

            const visiblePanelsBeforeThisView = Math.max(0, runningVisiblePanelCount[i] - 1);

            const offset =
                i === 0 || visiblePanelsBeforeThisView === 0
                    ? 0
                    : viewLeftOffsets[i - 1] +
                      (visiblePanelsBeforeThisView / sashCount) * marginReducedSize;

            if (i < this.viewItems.length - 1) {
                // calculate sash position
                const newSize = view.visible
                    ? offset + size - sashWidth / 2 + this.margin / 2
                    : offset;

                if (this._orientation === Orientation.HORIZONTAL) {
                    this.sashes[i].container.style.left = `${newSize}px`;
                    this.sashes[i].container.style.top = `0px`;
                }
                if (this._orientation === Orientation.VERTICAL) {
                    this.sashes[i].container.style.left = `0px`;
                    this.sashes[i].container.style.top = `${newSize}px`;
                }
            }

            // calculate view position

            if (this._orientation === Orientation.HORIZONTAL) {
                view.container.style.width = `${size}px`;
                view.container.style.left = `${offset}px`;
                view.container.style.top = '';

                view.container.style.height = '';
            }
            if (this._orientation === Orientation.VERTICAL) {
                view.container.style.height = `${size}px`;
                view.container.style.top = `${offset}px`;
                view.container.style.width = '';
                view.container.style.left = '';
            }

            view.view.layout(
                view.size - marginReducedSize,
                this._orthogonalSize
            );
        });
    }

    private findFirstSnapIndex(indexes: number[]): number | undefined {
        // visible views first
        for (const index of indexes) {
            const viewItem = this.viewItems[index];

            if (!viewItem.visible) {
                continue;
            }

            if (viewItem.snap) {
                return index;
            }
        }

        // then, hidden views
        for (const index of indexes) {
            const viewItem = this.viewItems[index];

            if (
                viewItem.visible &&
                viewItem.maximumSize - viewItem.minimumSize > 0
            ) {
                return undefined;
            }

            if (!viewItem.visible && viewItem.snap) {
                return index;
            }
        }

        return undefined;
    }

    private updateSashEnablement(): void {
        let previous = false;
        const collapsesDown = this.viewItems.map(
            (i) => (previous = i.size - i.minimumSize > 0 || previous)
        );

        previous = false;
        const expandsDown = this.viewItems.map(
            (i) => (previous = i.maximumSize - i.size > 0 || previous)
        );

        const reverseViews = [...this.viewItems].reverse();
        previous = false;
        const collapsesUp = reverseViews
            .map((i) => (previous = i.size - i.minimumSize > 0 || previous))
            .reverse();

        previous = false;
        const expandsUp = reverseViews
            .map((i) => (previous = i.maximumSize - i.size > 0 || previous))
            .reverse();

        let position = 0;
        for (let index = 0; index < this.sashes.length; index++) {
            const sash = this.sashes[index];
            const viewItem = this.viewItems[index];
            position += viewItem.size;

            const min = !(collapsesDown[index] && expandsUp[index + 1]);
            const max = !(expandsDown[index] && collapsesUp[index + 1]);

            if (min && max) {
                const upIndexes = range(index, -1);
                const downIndexes = range(index + 1, this.viewItems.length);
                const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                const snapAfterIndex = this.findFirstSnapIndex(downIndexes);

                const snappedBefore =
                    typeof snapBeforeIndex === 'number' &&
                    !this.viewItems[snapBeforeIndex].visible;
                const snappedAfter =
                    typeof snapAfterIndex === 'number' &&
                    !this.viewItems[snapAfterIndex].visible;

                if (
                    snappedBefore &&
                    collapsesUp[index] &&
                    (position > 0 || this.startSnappingEnabled)
                ) {
                    this.updateSash(sash, SashState.MINIMUM);
                } else if (
                    snappedAfter &&
                    collapsesDown[index] &&
                    (position < this._contentSize || this.endSnappingEnabled)
                ) {
                    this.updateSash(sash, SashState.MAXIMUM);
                } else {
                    this.updateSash(sash, SashState.DISABLED);
                }
            } else if (min && !max) {
                this.updateSash(sash, SashState.MINIMUM);
            } else if (!min && max) {
                this.updateSash(sash, SashState.MAXIMUM);
            } else {
                this.updateSash(sash, SashState.ENABLED);
            }
        }
    }

    private updateSash(sash: ISashItem, state: SashState): void {
        toggleClass(sash.container, 'disabled', state === SashState.DISABLED);
        toggleClass(sash.container, 'enabled', state === SashState.ENABLED);
        toggleClass(sash.container, 'maximum', state === SashState.MAXIMUM);
        toggleClass(sash.container, 'minimum', state === SashState.MINIMUM);
    }

    private resize = (
        index: number,
        delta: number,
        sizes: number[] = this.viewItems.map((x) => x.size),
        lowPriorityIndexes?: number[],
        highPriorityIndexes?: number[],
        overloadMinDelta: number = Number.NEGATIVE_INFINITY,
        overloadMaxDelta: number = Number.POSITIVE_INFINITY,
        snapBefore?: ISashDragSnapState,
        snapAfter?: ISashDragSnapState
    ): number => {
        if (index < 0 || index > this.viewItems.length) {
            return 0;
        }

        const upIndexes = range(index, -1);
        const downIndexes = range(index + 1, this.viewItems.length);
        //
        if (highPriorityIndexes) {
            for (const i of highPriorityIndexes) {
                pushToStart(upIndexes, i);
                pushToStart(downIndexes, i);
            }
        }

        if (lowPriorityIndexes) {
            for (const i of lowPriorityIndexes) {
                pushToEnd(upIndexes, i);
                pushToEnd(downIndexes, i);
            }
        }
        //
        const upItems = upIndexes.map((i) => this.viewItems[i]);
        const upSizes = upIndexes.map((i) => sizes[i]);
        //
        const downItems = downIndexes.map((i) => this.viewItems[i]);
        const downSizes = downIndexes.map((i) => sizes[i]);
        //
        const minDeltaUp = upIndexes.reduce(
            (_, i) => _ + this.viewItems[i].minimumSize - sizes[i],
            0
        );
        const maxDeltaUp = upIndexes.reduce(
            (_, i) => _ + this.viewItems[i].maximumSize - sizes[i],
            0
        );
        //
        const maxDeltaDown =
            downIndexes.length === 0
                ? Number.POSITIVE_INFINITY
                : downIndexes.reduce(
                      (_, i) => _ + sizes[i] - this.viewItems[i].minimumSize,

                      0
                  );
        const minDeltaDown =
            downIndexes.length === 0
                ? Number.NEGATIVE_INFINITY
                : downIndexes.reduce(
                      (_, i) => _ + sizes[i] - this.viewItems[i].maximumSize,
                      0
                  );
        //
        const minDelta = Math.max(minDeltaUp, minDeltaDown);
        const maxDelta = Math.min(maxDeltaDown, maxDeltaUp);
        //
        let snapped = false;
        if (snapBefore) {
            const snapView = this.viewItems[snapBefore.index];
            const visible = delta >= snapBefore.limitDelta;
            snapped = visible !== snapView.visible;
            snapView.setVisible(visible, snapBefore.size);
        }

        if (!snapped && snapAfter) {
            const snapView = this.viewItems[snapAfter.index];
            const visible = delta < snapAfter.limitDelta;
            snapped = visible !== snapView.visible;
            snapView.setVisible(visible, snapAfter.size);
        }

        if (snapped) {
            return this.resize(
                index,
                delta,
                sizes,
                lowPriorityIndexes,
                highPriorityIndexes,
                overloadMinDelta,
                overloadMaxDelta
            );
        }
        //
        const tentativeDelta = clamp(delta, minDelta, maxDelta);
        let actualDelta = 0;
        //
        let deltaUp = tentativeDelta;

        for (let i = 0; i < upItems.length; i++) {
            const item = upItems[i];
            const size = clamp(
                upSizes[i] + deltaUp,
                item.minimumSize,
                item.maximumSize
            );
            const viewDelta = size - upSizes[i];

            actualDelta += viewDelta;
            deltaUp -= viewDelta;
            item.size = size;
        }
        //
        let deltaDown = actualDelta;
        for (let i = 0; i < downItems.length; i++) {
            const item = downItems[i];
            const size = clamp(
                downSizes[i] - deltaDown,
                item.minimumSize,
                item.maximumSize
            );
            const viewDelta = size - downSizes[i];

            deltaDown += viewDelta;
            item.size = size;
        }
        //
        return delta;
    };

    private createViewContainer(): HTMLElement {
        const element = document.createElement('div');
        element.className = 'view-container';
        return element;
    }

    private createSashContainer(): HTMLElement {
        const element = document.createElement('div');
        element.className = 'sash-container';
        return element;
    }

    private createContainer(): HTMLElement {
        const element = document.createElement('div');
        const orientationClassname =
            this._orientation === Orientation.HORIZONTAL
                ? 'horizontal'
                : 'vertical';
        element.className = `split-view-container ${orientationClassname}`;
        return element;
    }

    public dispose(): void {
        this._onDidSashEnd.dispose();
        this._onDidAddView.dispose();
        this._onDidRemoveView.dispose();

        for (let i = 0; i < this.element.children.length; i++) {
            if (this.element.children.item(i) === this.element) {
                this.element.removeChild(this.element);
                break;
            }
        }

        for (const viewItem of this.viewItems) {
            viewItem.dispose();
        }

        this.element.remove();
    }
}
