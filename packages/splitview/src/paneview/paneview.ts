import { SplitView, IView, Orientation } from '../splitview/splitview';
import { IDisposable } from '../lifecycle';
import { Emitter, Event } from '../events';
import { addClasses, removeClasses } from '../dom';

export interface IPaneOptions {
    minimumBodySize?: number;
    maximumBodySize?: number;
    isExpanded?: boolean;
}

export interface IPaneview extends IView {
    onDidChangeExpansionState: Event<boolean>;
}

export abstract class Pane implements IPaneview {
    private _element: HTMLElement;
    private _minimumBodySize: number;
    private _maximumBodySize: number;
    private _minimumSize: number;
    private _maximumSize: number;
    private _isExpanded: boolean;
    private _orthogonalSize: number;
    private animationTimer: NodeJS.Timeout;
    private expandedSize: number;
    private headerSize = 22;
    private _onDidChangeExpansionState: Emitter<boolean> = new Emitter<
        boolean
    >();
    private _onDidChange: Emitter<number | undefined> = new Emitter<
        number | undefined
    >();
    //
    protected header: HTMLElement;
    protected body: HTMLElement;

    get onDidChange() {
        return this._onDidChange.event;
    }

    get onDidChangeExpansionState() {
        return this._onDidChangeExpansionState.event;
    }

    get element() {
        return this._element;
    }

    get minimumSize(): number {
        const headerSize = this.headerSize;
        const expanded = this.isExpanded();
        const minimumBodySize = expanded ? this._minimumBodySize : 0;

        return headerSize + minimumBodySize;
    }

    get maximumSize(): number {
        const headerSize = this.headerSize;
        const expanded = this.isExpanded();
        const maximumBodySize = expanded ? this._maximumBodySize : 0;

        return headerSize + maximumBodySize;
    }

    get orthogonalSize() {
        return this._orthogonalSize;
    }

    set minimumSize(size: number) {
        this._minimumSize = size;
        this._onDidChange.fire(undefined);
    }

    set maximumSize(size: number) {
        this._maximumSize = size;
        this._onDidChange.fire(undefined);
    }

    set orthogonalSize(size: number) {
        this._orthogonalSize = size;
    }

    constructor(options: IPaneOptions) {
        this._element = document.createElement('div');
        this._element.className = 'pane';

        this._minimumBodySize =
            typeof options.minimumBodySize === 'number'
                ? options.minimumBodySize
                : 120;
        this._maximumBodySize =
            typeof options.maximumBodySize === 'number'
                ? options.maximumBodySize
                : Number.POSITIVE_INFINITY;

        this._isExpanded = options.isExpanded;
    }

    public isExpanded() {
        return this._isExpanded;
    }

    public setExpanded(expanded: boolean) {
        this._isExpanded = expanded;

        if (expanded) {
            if (this.animationTimer) {
                clearTimeout(this.animationTimer);
            }
            this.element.appendChild(this.body);
        } else {
            this.animationTimer = setTimeout(() => {
                this.body.remove();
            }, 200);
        }

        this._onDidChangeExpansionState.fire(expanded);
        this._onDidChange.fire(expanded ? this.expandedSize : undefined);
    }

    public layout(size: number, orthogonalSize: number) {
        if (this.isExpanded()) {
            this.expandedSize = size;
        }
    }

    public render() {
        this.header = document.createElement('div');
        this.header.tabIndex = -1;

        this.header.className = 'pane-header';
        this.header.style.height = `${this.headerSize}px`;
        this.header.style.lineHeight = `${this.headerSize}px`;
        this.header.style.minHeight = `${this.headerSize}px`;
        this.header.style.maxHeight = `${this.headerSize}px`;

        this.header.addEventListener('click', () => [
            this.setExpanded(!this.isExpanded()),
        ]);

        this.element.appendChild(this.header);
        this.renderHeader(this.header);

        this.body = document.createElement('div');
        this.body.tabIndex = -1;

        this.body.className = 'pane-body';

        this.element.appendChild(this.body);
        this.renderBody(this.body);
    }

    protected abstract renderHeader(container: HTMLElement): void;
    protected abstract renderBody(container: HTMLElement): void;
}

interface PaneItem {
    pane: Pane;
    disposable: IDisposable;
}

export class PaneView implements IDisposable {
    private element: HTMLElement;
    private splitview: SplitView;
    private paneItems: PaneItem[] = [];
    private _orientation: Orientation;
    private animationTimer: NodeJS.Timeout;
    private orthogonalSize: number;
    private size: number;

    get minimumSize() {
        return this.splitview.minimumSize;
    }

    get maximumSize() {
        return this.splitview.maximumSize;
    }

    get orientation() {
        return this.splitview.orientation;
    }

    constructor(container: HTMLElement, options: { orientation: Orientation }) {
        this._orientation = options.orientation ?? Orientation.VERTICAL;

        this.element = document.createElement('div');
        this.element.className = 'pane-container';

        this.setupAnimation = this.setupAnimation.bind(this);

        container.appendChild(this.element);
        this.splitview = new SplitView(this.element, {
            orientation: this._orientation,
            proportionalLayout: false,
        });
    }

    public setOrientation(orientation: Orientation) {
        this._orientation = orientation;
    }

    public addPane(pane: Pane, size?: number, index = this.splitview.length) {
        const disposable = pane.onDidChangeExpansionState(this.setupAnimation);

        const paneItem: PaneItem = {
            pane,
            disposable: {
                dispose: () => {
                    disposable.dispose();
                },
            },
        };

        this.paneItems.splice(index, 0, paneItem);
        pane.orthogonalSize = this.orthogonalSize;
        this.splitview.addView(pane, size, index);
    }

    public getPanes() {
        return this.splitview.getViews() as Pane[];
    }

    public removePane(index: number) {
        this.splitview.removeView(index);
        const paneItem = this.paneItems.splice(index, 1)[0];
        paneItem.disposable.dispose();
        return paneItem;
    }

    public moveView(from: number, to: number) {
        const view = this.removePane(from);
        this.addPane(view.pane, to);
    }

    public layout(size: number, orthogonalSize: number): void {
        this.orthogonalSize = orthogonalSize;
        this.size = size;

        for (const paneItem of this.paneItems) {
            paneItem.pane.orthogonalSize = this.orthogonalSize;
        }

        this.splitview.layout(this.size, this.orthogonalSize);
    }

    private setupAnimation() {
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
        }

        addClasses(this.element, 'animated');

        this.animationTimer = setTimeout(() => {
            this.animationTimer = undefined;
            removeClasses(this.element, 'animated');
        }, 200);
    }

    public dispose() {
        this.paneItems.forEach((paneItem) => {
            paneItem.disposable.dispose();
        });
    }
}
