import { SplitView, IView, Orientation } from '../splitview/core/splitview';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Emitter, Event } from '../events';
import { addClasses, removeClasses } from '../dom';
import {
    IFrameworkPart,
    PanelInitParameters,
    PanelUpdateEvent,
} from '../panel/types';
import { PanePanelApi } from '../api/panePanelApi';

export interface PanePanelInitParameter extends PanelInitParameters {
    minimumBodySize?: number;
    maximumBodySize?: number;
    isExpanded?: boolean;
}

export interface IPaneview extends IView {
    onDidChangeExpansionState: Event<boolean>;
}

const MINIMUM_BODY_SIZE = 120;

export abstract class Pane extends CompositeDisposable implements IPaneview {
    private _element: HTMLElement;
    private _minimumBodySize: number = MINIMUM_BODY_SIZE;
    private _maximumBodySize: number = Number.POSITIVE_INFINITY;

    protected api: PanePanelApi;

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
    protected params: PanePanelInitParameter;
    protected header: HTMLElement;
    protected body: HTMLElement;

    private part: IFrameworkPart;
    private headerPart: IFrameworkPart;

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

    set orthogonalSize(size: number) {
        this._orthogonalSize = size;
    }

    set minimumBodySize(value: number) {
        this._minimumBodySize =
            typeof value === 'number' ? value : MINIMUM_BODY_SIZE;
    }

    set maximumBodySize(value: number) {
        this._maximumBodySize =
            typeof value === 'number' ? value : Number.POSITIVE_INFINITY;
    }

    constructor(
        public readonly id: string,
        private readonly component: string
    ) {
        super();

        this.api = new PanePanelApi(this);

        this.addDisposables(
            this.api,
            this._onDidChange,
            this._onDidChangeExpansionState,
            this.onDidChangeExpansionState((isExpanded) => {
                this.api._onDidExpansionChange.fire({ isExpanded });
            })
        );

        this._element = document.createElement('div');
        this._element.className = 'pane';

        this.render();
    }

    init(parameters: PanePanelInitParameter): void {
        this.params = parameters;

        if (typeof parameters.minimumBodySize === 'number') {
            this.minimumBodySize = parameters.minimumBodySize;
        }
        if (typeof parameters.maximumBodySize === 'number') {
            this.maximumBodySize = parameters.maximumBodySize;
        }
        if (typeof parameters.isExpanded === 'boolean') {
            this.setExpanded(parameters.isExpanded);
        }

        this.part = this.getComponent();
        this.headerPart = this.getHeaderComponent();
    }

    update(params: PanelUpdateEvent) {
        this.params = { ...this.params, params: params.params };
        this.part.update(params);
        this.headerPart.update(params);
    }

    toJSON(): object {
        return {
            id: this.id,
            component: this.component,
            props: this.params.params,
            state: this.api.getState(),
        };
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

    private render() {
        this.header = document.createElement('div');
        this.header.tabIndex = -1;

        this.header.className = 'pane-header';
        this.header.style.height = `${this.headerSize}px`;
        this.header.style.lineHeight = `${this.headerSize}px`;
        this.header.style.minHeight = `${this.headerSize}px`;
        this.header.style.maxHeight = `${this.headerSize}px`;

        this.element.appendChild(this.header);

        this.body = document.createElement('div');
        this.body.tabIndex = -1;

        this.body.className = 'pane-body';

        this.element.appendChild(this.body);
    }

    dispose() {
        super.dispose();

        this.part?.dispose();
        this.headerPart?.dispose();
    }

    protected abstract getComponent(): IFrameworkPart;
    protected abstract getHeaderComponent(): IFrameworkPart;
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

        container.appendChild(this.element);

        this.splitview = new SplitView(this.element, {
            orientation: this._orientation,
            proportionalLayout: false,
        });
    }

    public addPane(pane: Pane, size?: number, index = this.splitview.length) {
        const disposable = pane.onDidChangeExpansionState(() => {
            this.setupAnimation();
        });

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
            this.animationTimer = undefined;
        }

        addClasses(this.element, 'animated');

        this.animationTimer = setTimeout(() => {
            this.animationTimer = undefined;
            removeClasses(this.element, 'animated');
        }, 200);
    }

    public dispose() {
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = undefined;
        }

        this.paneItems.forEach((paneItem) => {
            paneItem.disposable.dispose();
        });
    }
}
