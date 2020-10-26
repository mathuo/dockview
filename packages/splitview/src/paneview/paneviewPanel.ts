import { PaneviewApi } from '../api/component.api';
import { PanePanelApi } from '../api/panePanelApi';
import { Emitter, Event } from '../events';
import { BasePanelView, BasePanelViewState } from '../gridview/basePanelView';
import { IDisposable } from '../lifecycle';
import {
    IFrameworkPart,
    PanelInitParameters,
    PanelUpdateEvent,
    Parameters,
} from '../panel/types';
import { IView } from '../splitview/core/splitview';

export interface PanePanelViewState extends BasePanelViewState {
    headerComponent?: string;
    title: string;
}

export interface PanePanelInitParameter extends PanelInitParameters {
    minimumBodySize?: number;
    maximumBodySize?: number;
    isExpanded?: boolean;
    title: string;
    containerApi: PaneviewApi;
}

export interface PanePanelComponentInitParameter
    extends PanePanelInitParameter {
    api: PanePanelApi;
}

export interface IPaneBodyPart extends IDisposable {
    readonly element: HTMLElement;
    update(params: PanelUpdateEvent): void;
    init(parameters: PanePanelComponentInitParameter): void;
}

export interface IPaneHeaderPart extends IDisposable {
    readonly element: HTMLElement;
    update(params: PanelUpdateEvent): void;
    init(parameters: PanePanelComponentInitParameter): void;
}

export interface IPaneview extends IView {
    onDidChangeExpansionState: Event<boolean>;
}

export abstract class PaneviewPanel
    extends BasePanelView<PanePanelApi>
    implements IPaneview {
    private _onDidChangeExpansionState: Emitter<boolean> = new Emitter<
        boolean
    >();
    onDidChangeExpansionState = this._onDidChangeExpansionState.event;
    private readonly _onDidChange = new Emitter<number | undefined>();
    readonly onDidChange: Event<number | undefined> = this._onDidChange.event;

    private headerSize = 22;
    private _orthogonalSize = 0;
    private _minimumBodySize: number = 0;
    private _maximumBodySize: number = Number.POSITIVE_INFINITY;
    private _isExpanded = false;
    protected header: HTMLElement;
    protected body: HTMLElement;
    private bodyPart?: IPaneHeaderPart;
    private headerPart?: IPaneBodyPart;
    private expandedSize: number;
    private animationTimer: any | undefined;

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
        this._minimumBodySize = typeof value === 'number' ? value : 0;
    }

    set maximumBodySize(value: number) {
        this._maximumBodySize =
            typeof value === 'number' ? value : Number.POSITIVE_INFINITY;
    }

    constructor(
        id: string,
        component: string,
        private readonly headerComponent: string
    ) {
        super(id, component, new PanePanelApi(null));
        this.api.pane = this; // TODO cannot use 'this' before 'super'

        this.element.classList.add('pane');

        this.addDisposables(
            this._onDidChangeExpansionState,
            this.onDidChangeExpansionState((isExpanded) => {
                this.api._onDidExpansionChange.fire({ isExpanded });
            })
        );

        this.render();
    }

    isExpanded() {
        return this._isExpanded;
    }

    setExpanded(expanded: boolean) {
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

    layout(size: number, orthogonalSize: number) {
        if (this.isExpanded()) {
            this.expandedSize = size;
        }
        super.layout(size, orthogonalSize);
    }

    init(parameters: PanePanelInitParameter): void {
        super.init(parameters);

        if (typeof parameters.minimumBodySize === 'number') {
            this.minimumBodySize = parameters.minimumBodySize;
        }
        if (typeof parameters.maximumBodySize === 'number') {
            this.maximumBodySize = parameters.maximumBodySize;
        }
        if (typeof parameters.isExpanded === 'boolean') {
            this.setExpanded(parameters.isExpanded);
        }

        this.bodyPart = this.getBodyComponent();
        this.headerPart = this.getHeaderComponent();

        this.bodyPart.init({ ...parameters, api: this.api });
        this.headerPart.init({ ...parameters, api: this.api });

        this.body.append(this.bodyPart.element);
        this.header.append(this.headerPart.element);
    }

    toJSON(): PanePanelViewState {
        const params = this.params as PanePanelInitParameter;
        return {
            ...super.toJSON(),
            headerComponent: this.headerComponent,
            title: params.title,
        };
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

    // TODO slightly hacky by-pass of the component to create a body and header component
    getComponent(): IFrameworkPart {
        return {
            update: (params: Parameters) => {
                this.bodyPart?.update({ params });
                this.headerPart?.update({ params });
            },
            dispose: () => {
                this.bodyPart?.dispose();
                this.headerPart?.dispose();
            },
        };
    }

    protected abstract getBodyComponent(): IPaneBodyPart;
    protected abstract getHeaderComponent(): IPaneHeaderPart;
}
