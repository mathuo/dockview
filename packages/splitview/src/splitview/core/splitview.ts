import {
    removeClasses,
    addClasses,
    toggleClass,
    getElementsByTagName,
} from '../../dom';
import { clamp } from '../../math';
import { Event, Emitter } from '../../events';
import { pushToStart, pushToEnd, range, firstIndex } from '../../array';
import { ViewItem } from './viewItem';

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
}
export enum LayoutPriority {
    Low = 'low',
    High = 'high',
    Normal = 'normal',
}

export interface IBaseView {
    minimumSize: number;
    maximumSize: number;
    snap?: boolean;
    priority?: LayoutPriority;
}

export interface IView extends IBaseView {
    readonly element: HTMLElement | DocumentFragment;
    readonly onDidChange: Event<number | undefined>;
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
    private views: ViewItem[] = [];
    private sashes: ISashItem[] = [];
    private readonly _orientation: Orientation;
    private _size = 0;
    private _orthogonalSize = 0;
    private contentSize = 0;
    private _proportions: number[] | undefined = undefined;
    private proportionalLayout: boolean;

    private _onDidSashEnd = new Emitter<void>();
    public onDidSashEnd = this._onDidSashEnd.event;

    get size() {
        return this._size;
    }

    set size(value: number) {
        this._size = value;
    }

    get orthogonalSize() {
        return this._orthogonalSize;
    }

    set orthogonalSize(value: number) {
        this._orthogonalSize = value;
    }

    public get length() {
        return this.views.length;
    }

    public get proportions() {
        return this._proportions ? [...this._proportions] : undefined;
    }

    get orientation() {
        return this._orientation;
    }

    get minimumSize(): number {
        return this.views.reduce((r, item) => r + item.minimumSize, 0);
    }

    get maximumSize(): number {
        return this.length === 0
            ? Number.POSITIVE_INFINITY
            : this.views.reduce((r, item) => r + item.maximumSize, 0);
    }

    private _startSnappingEnabled = true;
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

    private _endSnappingEnabled = true;
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

    constructor(
        private readonly container: HTMLElement,
        options: SplitViewOptions
    ) {
        this._orientation = options.orientation;
        this.element = this.createContainer();

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
            this.contentSize = this.views.reduce((r, i) => r + i.size, 0);
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
        if (index < 0 || index >= this.views.length) {
            throw new Error('Index out of bounds');
        }

        const viewItem = this.views[index];
        return viewItem.visible;
    }

    setViewVisible(index: number, visible: boolean): void {
        if (index < 0 || index >= this.views.length) {
            throw new Error('Index out of bounds');
        }

        toggleClass(this.container, 'visible', visible);

        const viewItem = this.views[index];

        toggleClass(this.container, 'visible', visible);

        viewItem.setVisible(visible, viewItem.size);

        this.distributeEmptySpace(index);
        this.layoutViews();
        this.saveProportions();
    }

    getViewSize(index: number): number {
        if (index < 0 || index >= this.views.length) {
            return -1;
        }

        return this.views[index].size;
    }

    resizeView(index: number, size: number): void {
        if (index < 0 || index >= this.views.length) {
            return;
        }

        const indexes = range(this.views.length).filter((i) => i !== index);
        const lowPriorityIndexes = [
            ...indexes.filter(
                (i) => this.views[i].priority === LayoutPriority.Low
            ),
            index,
        ];
        const highPriorityIndexes = indexes.filter(
            (i) => this.views[i].priority === LayoutPriority.High
        );

        const item = this.views[index];
        size = Math.round(size);
        size = clamp(
            size,
            item.minimumSize,
            Math.min(item.maximumSize, this._size)
        );

        item.size = size;
        this.relayout(lowPriorityIndexes, highPriorityIndexes);
    }

    public getViews<T extends IView>() {
        return this.views.map((x) => x.view as T);
    }

    private onDidChange(item: ViewItem, size: number | undefined): void {
        const index = this.views.indexOf(item);

        if (index < 0 || index >= this.views.length) {
            return;
        }

        size = typeof size === 'number' ? size : item.size;
        size = clamp(size, item.minimumSize, item.maximumSize);

        item.size = size;

        this.relayout([index], undefined);
    }

    public addView(
        view: IView,
        size: number | Sizing = { type: 'distribute' },
        index: number = this.views.length,
        skipLayout?: boolean
    ) {
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

        const disposable = view.onDidChange((size) =>
            this.onDidChange(viewItem, size)
        );

        const dispose = () => {
            disposable?.dispose();
            this.viewContainer.removeChild(container);
        };

        const viewItem = new ViewItem(container, view, viewSize, { dispose });

        if (index === this.views.length) {
            this.viewContainer.appendChild(container);
        } else {
            this.viewContainer.insertBefore(
                container,
                this.viewContainer.children.item(index)
            );
        }

        this.views.splice(index, 0, viewItem);

        if (this.views.length > 1) {
            //add sash
            const sash = document.createElement('div');
            sash.className = 'sash';

            const onStart = (event: MouseEvent) => {
                for (const item of this.views) {
                    item.enabled = false;
                }

                const iframes = [
                    ...getElementsByTagName('iframe'),
                    ...getElementsByTagName('webview'),
                ];

                for (const iframe of iframes) {
                    iframe.style.pointerEvents = 'none';
                }

                const start =
                    this._orientation === Orientation.HORIZONTAL
                        ? event.clientX
                        : event.clientY;

                const index = firstIndex(
                    this.sashes,
                    (s) => s.container === sash
                );

                //
                const sizes = this.views.map((x) => x.size);

                //
                let snapBefore: ISashDragSnapState | undefined;
                let snapAfter: ISashDragSnapState | undefined;
                const upIndexes = range(index, -1);
                const downIndexes = range(index + 1, this.views.length);
                const minDeltaUp = upIndexes.reduce(
                    (r, i) => r + (this.views[i].minimumSize - sizes[i]),
                    0
                );
                const maxDeltaUp = upIndexes.reduce(
                    (r, i) => r + (this.views[i].viewMaximumSize - sizes[i]),
                    0
                );
                const maxDeltaDown =
                    downIndexes.length === 0
                        ? Number.POSITIVE_INFINITY
                        : downIndexes.reduce(
                              (r, i) =>
                                  r + (sizes[i] - this.views[i].minimumSize),
                              0
                          );
                const minDeltaDown =
                    downIndexes.length === 0
                        ? Number.NEGATIVE_INFINITY
                        : downIndexes.reduce(
                              (r, i) =>
                                  r +
                                  (sizes[i] - this.views[i].viewMaximumSize),
                              0
                          );
                const minDelta = Math.max(minDeltaUp, minDeltaDown);
                const maxDelta = Math.min(maxDeltaDown, maxDeltaUp);
                const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                const snapAfterIndex = this.findFirstSnapIndex(downIndexes);
                if (typeof snapBeforeIndex === 'number') {
                    const viewItem = this.views[snapBeforeIndex];
                    const halfSize = Math.floor(viewItem.viewMinimumSize / 2);

                    snapBefore = {
                        index: snapBeforeIndex,
                        limitDelta: viewItem.visible
                            ? minDelta - halfSize
                            : minDelta + halfSize,
                        size: viewItem.size,
                    };
                }

                if (typeof snapAfterIndex === 'number') {
                    const viewItem = this.views[snapAfterIndex];
                    const halfSize = Math.floor(viewItem.viewMinimumSize / 2);

                    snapAfter = {
                        index: snapAfterIndex,
                        limitDelta: viewItem.visible
                            ? maxDelta + halfSize
                            : maxDelta - halfSize,
                        size: viewItem.size,
                    };
                }
                //

                const mousemove = (event: MouseEvent) => {
                    const current =
                        this._orientation === Orientation.HORIZONTAL
                            ? event.clientX
                            : event.clientY;
                    const delta = current - start;

                    this.resize(
                        index,
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
                    for (const item of this.views) {
                        item.enabled = true;
                    }

                    for (const iframe of iframes) {
                        iframe.style.pointerEvents = 'auto';
                    }

                    this.saveProportions();

                    document.removeEventListener('mousemove', mousemove);
                    document.removeEventListener('mouseup', end);
                    document.removeEventListener('mouseend', end);

                    this._onDidSashEnd.fire(undefined);
                };

                document.addEventListener('mousemove', mousemove);
                document.addEventListener('mouseup', end);
                document.addEventListener('mouseend', end);
            };

            sash.addEventListener('mousedown', onStart);

            const disposable = () => {
                sash.removeEventListener('mousedown', onStart);
                this.sashContainer.removeChild(sash);
            };

            const sashItem: ISashItem = { container: sash, disposable };

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
    }

    distributeViewSizes(): void {
        const flexibleViewItems: ViewItem[] = [];
        let flexibleSize = 0;

        for (const item of this.views) {
            if (item.maximumSize - item.minimumSize > 0) {
                flexibleViewItems.push(item);
                flexibleSize += item.size;
            }
        }

        const size = Math.floor(flexibleSize / flexibleViewItems.length);

        for (const item of flexibleViewItems) {
            item.size = clamp(size, item.minimumSize, item.maximumSize);
        }

        const indexes = range(this.views.length);
        const lowPriorityIndexes = indexes.filter(
            (i) => this.views[i].priority === LayoutPriority.Low
        );
        const highPriorityIndexes = indexes.filter(
            (i) => this.views[i].priority === LayoutPriority.High
        );

        this.relayout(lowPriorityIndexes, highPriorityIndexes);
    }

    public removeView(
        index: number,
        sizing?: Sizing,
        skipLayout = false
    ): IView {
        // Remove view
        const viewItem = this.views.splice(index, 1)[0];
        viewItem.dispose();

        // Remove sash
        if (this.views.length >= 1) {
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

        return viewItem.view;
    }

    getViewCachedVisibleSize(index: number): number | undefined {
        if (index < 0 || index >= this.views.length) {
            throw new Error('Index out of bounds');
        }

        const viewItem = this.views[index];
        return viewItem.cachedVisibleSize;
    }

    public moveView(from: number, to: number) {
        const cachedVisibleSize = this.getViewCachedVisibleSize(from);
        const sizing =
            typeof cachedVisibleSize === 'undefined'
                ? this.getViewSize(from)
                : Sizing.Invisible(cachedVisibleSize);
        const view = this.removeView(from, undefined, true);
        this.addView(view, sizing, to);
    }

    public layout(size: number, orthogonalSize: number) {
        const previousSize = Math.max(this.size, this.contentSize);
        this.size = size;
        this.orthogonalSize = orthogonalSize;

        if (!this.proportions) {
            const indexes = range(this.views.length);
            const lowPriorityIndexes = indexes.filter(
                (i) => this.views[i].priority === LayoutPriority.Low
            );
            const highPriorityIndexes = indexes.filter(
                (i) => this.views[i].priority === LayoutPriority.High
            );

            this.resize(
                this.views.length - 1,
                size - previousSize,
                undefined,
                lowPriorityIndexes,
                highPriorityIndexes
            );
        } else {
            for (let i = 0; i < this.views.length; i++) {
                const item = this.views[i];

                item.size = clamp(
                    Math.round(this.proportions[i] * size),
                    item.minimumSize,
                    item.maximumSize
                );
            }
        }

        this.distributeEmptySpace();
        this.layoutViews();
    }

    private relayout(
        lowPriorityIndexes?: number[],
        highPriorityIndexes?: number[]
    ) {
        const contentSize = this.views.reduce((r, i) => r + i.size, 0);

        this.resize(
            this.views.length - 1,
            this._size - contentSize,
            undefined,
            lowPriorityIndexes,
            highPriorityIndexes
        );
        this.distributeEmptySpace();
        this.layoutViews();
        this.saveProportions();
    }

    private distributeEmptySpace(lowPriorityIndex?: number) {
        const contentSize = this.views.reduce((r, i) => r + i.size, 0);
        let emptyDelta = this.size - contentSize;

        const indexes = range(this.views.length - 1, -1);
        const lowPriorityIndexes = indexes.filter(
            (i) => this.views[i].priority === LayoutPriority.Low
        );
        const highPriorityIndexes = indexes.filter(
            (i) => this.views[i].priority === LayoutPriority.High
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
            const item = this.views[indexes[i]];
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
        if (this.proportionalLayout && this.contentSize > 0) {
            this._proportions = this.views.map(
                (i) => i.size / this.contentSize
            );
        }
    }

    private layoutViews() {
        this.contentSize = this.views.reduce((r, i) => r + i.size, 0);
        let sum = 0;
        const x: number[] = [];

        this.updateSashEnablement();

        for (let i = 0; i < this.views.length - 1; i++) {
            sum += this.views[i].size;
            x.push(sum);

            const offset = Math.min(Math.max(0, sum - 2), this.size - 4);

            if (this._orientation === Orientation.HORIZONTAL) {
                this.sashes[i].container.style.left = `${offset}px`;
                this.sashes[i].container.style.top = `0px`;
            }
            if (this._orientation === Orientation.VERTICAL) {
                this.sashes[i].container.style.left = `0px`;
                this.sashes[i].container.style.top = `${offset}px`;
            }
        }
        this.views.forEach((view, i) => {
            if (this._orientation === Orientation.HORIZONTAL) {
                view.container.style.width = `${view.size}px`;
                view.container.style.left = i == 0 ? '0px' : `${x[i - 1]}px`;
                view.container.style.top = '';
                view.container.style.height = '';
            }
            if (this._orientation === Orientation.VERTICAL) {
                view.container.style.height = `${view.size}px`;
                view.container.style.top = i == 0 ? '0px' : `${x[i - 1]}px`;
                view.container.style.width = '';
                view.container.style.left = '';
            }

            view.view.layout(view.size, this._orthogonalSize);
        });
    }

    private findFirstSnapIndex(indexes: number[]): number | undefined {
        // visible views first
        for (const index of indexes) {
            const viewItem = this.views[index];

            if (!viewItem.visible) {
                continue;
            }

            if (viewItem.snap) {
                return index;
            }
        }

        // then, hidden views
        for (const index of indexes) {
            const viewItem = this.views[index];

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
        const collapsesDown = this.views.map(
            (i) => (previous = i.size - i.minimumSize > 0 || previous)
        );

        previous = false;
        const expandsDown = this.views.map(
            (i) => (previous = i.maximumSize - i.size > 0 || previous)
        );

        const reverseViews = [...this.views].reverse();
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
            const viewItem = this.views[index];
            position += viewItem.size;

            const min = !(collapsesDown[index] && expandsUp[index + 1]);
            const max = !(expandsDown[index] && collapsesUp[index + 1]);

            if (min && max) {
                const upIndexes = range(index, -1);
                const downIndexes = range(index + 1, this.views.length);
                const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                const snapAfterIndex = this.findFirstSnapIndex(downIndexes);

                const snappedBefore =
                    typeof snapBeforeIndex === 'number' &&
                    !this.views[snapBeforeIndex].visible;
                const snappedAfter =
                    typeof snapAfterIndex === 'number' &&
                    !this.views[snapAfterIndex].visible;

                if (
                    snappedBefore &&
                    collapsesUp[index] &&
                    (position > 0 || this.startSnappingEnabled)
                ) {
                    this.updateSash(sash, SashState.MINIMUM);
                    // sash.state = SashState.Minimum;
                } else if (
                    snappedAfter &&
                    collapsesDown[index] &&
                    (position < this.contentSize || this.endSnappingEnabled)
                ) {
                    // sash.state = SashState.Maximum;
                    this.updateSash(sash, SashState.MAXIMUM);
                } else {
                    // sash.state = SashState.Disabled;
                    this.updateSash(sash, SashState.DISABLED);
                }
            } else if (min && !max) {
                // sash.state = SashState.Minimum;
                this.updateSash(sash, SashState.MINIMUM);
            } else if (!min && max) {
                // sash.state = SashState.Maximum;

                this.updateSash(sash, SashState.MAXIMUM);
            } else {
                // sash.state = SashState.Enabled;
                this.updateSash(sash, SashState.ENABLED);
            }
        }
    }

    private updateSash(sash: ISashItem, state: SashState) {
        toggleClass(sash.container, 'disabled', state === SashState.DISABLED);
        toggleClass(sash.container, 'enabled', state === SashState.ENABLED);
        toggleClass(sash.container, 'maximum', state === SashState.MAXIMUM);
        toggleClass(sash.container, 'minimum', state === SashState.MINIMUM);
    }

    private resize = (
        index: number,
        delta: number,
        sizes: number[] = this.views.map((x) => x.size),
        lowPriorityIndexes?: number[],
        highPriorityIndexes?: number[],
        overloadMinDelta: number = Number.NEGATIVE_INFINITY,
        overloadMaxDelta: number = Number.POSITIVE_INFINITY,
        snapBefore?: ISashDragSnapState,
        snapAfter?: ISashDragSnapState
    ): number => {
        if (index < 0 || index > this.views.length) {
            return 0;
        }

        const upIndexes = range(index, -1);
        const downIndexes = range(index + 1, this.views.length);
        //
        if (highPriorityIndexes) {
            for (const index of highPriorityIndexes) {
                pushToStart(upIndexes, index);
                pushToStart(downIndexes, index);
            }
        }

        if (lowPriorityIndexes) {
            for (const index of lowPriorityIndexes) {
                pushToEnd(upIndexes, index);
                pushToEnd(downIndexes, index);
            }
        }
        //
        const upItems = upIndexes.map((i) => this.views[i]);
        const upSizes = upIndexes.map((i) => sizes[i]);
        //
        const downItems = downIndexes.map((i) => this.views[i]);
        const downSizes = downIndexes.map((i) => sizes[i]);
        //
        const minDeltaUp = upIndexes.reduce(
            (_, i) => _ + this.views[i].minimumSize - sizes[i],
            0
        );
        const maxDeltaUp = upIndexes.reduce(
            (_, i) => _ + this.views[i].maximumSize - sizes[i],
            0
        );
        //
        const maxDeltaDown =
            downIndexes.length === 0
                ? Number.POSITIVE_INFINITY
                : downIndexes.reduce(
                      (_, i) => _ + sizes[i] - this.views[i].minimumSize,

                      0
                  );
        const minDeltaDown =
            downIndexes.length === 0
                ? Number.NEGATIVE_INFINITY
                : downIndexes.reduce(
                      (_, i) => _ + sizes[i] - this.views[i].maximumSize,
                      0
                  );
        //
        const minDelta = Math.max(minDeltaUp, minDeltaDown);
        const maxDelta = Math.min(maxDeltaDown, maxDeltaUp);
        //
        let snapped = false;
        if (snapBefore) {
            const snapView = this.views[snapBefore.index];
            const visible = delta >= snapBefore.limitDelta;
            snapped = visible !== snapView.visible;
            snapView.setVisible(visible, snapBefore.size);
        }

        if (!snapped && snapAfter) {
            const snapView = this.views[snapAfter.index];
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

    private createViewContainer() {
        const element = document.createElement('div');
        element.className = 'view-container';
        return element;
    }

    private createSashContainer() {
        const element = document.createElement('div');
        element.className = 'sash-container';
        return element;
    }

    private createContainer() {
        const element = document.createElement('div');
        const orientationClassname =
            this._orientation === Orientation.HORIZONTAL
                ? 'horizontal'
                : 'vertical';
        element.className = `split-view-container ${orientationClassname}`;
        return element;
    }

    public dispose() {
        this.element.remove();
        for (let i = 0; i < this.element.children.length; i++) {
            if (this.element.children.item(i) === this.element) {
                this.element.removeChild(this.element);
                break;
            }
        }
    }
}
