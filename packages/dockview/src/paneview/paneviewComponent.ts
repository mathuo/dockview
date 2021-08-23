import { PaneviewApi } from '../api/component.api';
import { PaneviewPanelApiImpl } from '../api/paneviewPanelApi';
import { createComponent } from '../panel/componentFactory';
import { addDisposableListener, Emitter, Event } from '../events';
import {
    CompositeDisposable,
    IDisposable,
    MutableDisposable,
} from '../lifecycle';
import { PanelUpdateEvent } from '../panel/types';
import {
    LayoutPriority,
    Orientation,
    Sizing,
} from '../splitview/core/splitview';
import { PaneviewComponentOptions } from './options';
import { Paneview } from './paneview';
import {
    IPaneBodyPart,
    IPaneHeaderPart,
    PaneviewPanel,
    PanePanelInitParameter,
    IPaneviewPanel,
} from './paneviewPanel';
import { DraggablePaneviewPanel } from './draggablePaneviewPanel';
import { DroptargetEvent } from '../dnd/droptarget';

export interface SerializedPaneviewPanel {
    snap?: boolean;
    priority?: LayoutPriority;
    minimumSize?: number;
    maximumSize?: number;
    data: {
        id: string;
        component: string;
        title: string;
        headerComponent?: string;
        params?: { [index: string]: any };
        state?: { [index: string]: any };
    };
    size: number;
    expanded?: boolean;
}

export interface SerializedPaneview {
    size: number;
    views: SerializedPaneviewPanel[];
}

class DefaultHeader extends CompositeDisposable implements IPaneHeaderPart {
    private _element: HTMLElement;
    private apiRef: { api: PaneviewPanelApiImpl | null } = { api: null };

    get element() {
        return this._element;
    }

    constructor() {
        super();
        this._element = document.createElement('div');

        this.addDisposables(
            addDisposableListener(this.element, 'click', () => {
                this.apiRef.api?.setExpanded(!this.apiRef.api.isExpanded);
            })
        );
    }

    init(params: PanePanelInitParameter & { api: PaneviewPanelApiImpl }) {
        this.apiRef.api = params.api;
        this._element.textContent = params.title;
    }

    update(params: PanelUpdateEvent) {
        //
    }
}

export class PaneFramework extends DraggablePaneviewPanel {
    constructor(
        private readonly options: {
            id: string;
            component: string;
            headerComponent: string | undefined;
            body: IPaneBodyPart;
            header: IPaneHeaderPart;
            orientation: Orientation;
            isExpanded: boolean;
            disableDnd: boolean;
        }
    ) {
        super(
            options.id,
            options.component,
            options.headerComponent,
            options.orientation,
            options.isExpanded,
            options.disableDnd
        );
    }

    getBodyComponent() {
        return this.options.body;
    }

    getHeaderComponent() {
        return this.options.header;
    }
}

export interface AddPaneviewCompponentOptions {
    id: string;
    component: string;
    headerComponent?: string;
    params?: {
        [key: string]: any;
    };
    minimumBodySize?: number;
    maximumBodySize?: number;
    isExpanded?: boolean;
    title: string;
    index?: number;
    size?: number;
}

export interface IPaneviewComponent extends IDisposable {
    readonly width: number;
    readonly height: number;
    readonly minimumSize: number;
    readonly maximumSize: number;
    readonly onDidDrop: Event<DroptargetEvent>;
    readonly onDidLayoutChange: Event<void>;
    addPanel(options: AddPaneviewCompponentOptions): IDisposable;
    layout(width: number, height: number): void;
    toJSON(): SerializedPaneview;
    fromJSON(
        serializedPaneview: SerializedPaneview,
        deferComponentLayout?: boolean
    ): void;
    resizeToFit(): void;
    focus(): void;
    getPanels(): IPaneviewPanel[];
    removePanel(panel: IPaneviewPanel): void;
    getPanel(id: string): IPaneviewPanel | undefined;
    movePanel(from: number, to: number): void;
    updateOptions(options: Partial<PaneviewComponentOptions>): void;
}

export class PaneviewComponent
    extends CompositeDisposable
    implements IPaneviewComponent
{
    private _disposable = new MutableDisposable();
    private _paneview!: Paneview;

    private readonly _onDidLayoutChange = new Emitter<void>();
    readonly onDidLayoutChange: Event<void> = this._onDidLayoutChange.event;

    private readonly _onDidDrop = new Emitter<DroptargetEvent>();
    readonly onDidDrop: Event<DroptargetEvent> = this._onDidDrop.event;

    get onDidAddView() {
        return this._paneview.onDidAddView;
    }

    get onDidRemoveView() {
        return this._paneview.onDidRemoveView;
    }

    set paneview(value: Paneview) {
        this._paneview = value;

        this._disposable.value = new CompositeDisposable(
            this.paneview.onDidChange(() => {
                this._onDidLayoutChange.fire(undefined);
            })
        );
    }

    get paneview() {
        return this._paneview;
    }

    get minimumSize() {
        return this.paneview.minimumSize;
    }

    get maximumSize() {
        return this.paneview.maximumSize;
    }

    get height() {
        return this.paneview.orientation === Orientation.HORIZONTAL
            ? this.paneview.orthogonalSize
            : this.paneview.size;
    }

    get width() {
        return this.paneview.orientation === Orientation.HORIZONTAL
            ? this.paneview.size
            : this.paneview.orthogonalSize;
    }

    private _options: PaneviewComponentOptions;

    get options() {
        return this._options;
    }

    constructor(
        private element: HTMLElement,
        options: PaneviewComponentOptions
    ) {
        super();

        this._options = options;

        if (!options.components) {
            options.components = {};
        }
        if (!options.frameworkComponents) {
            options.frameworkComponents = {};
        }

        this.paneview = new Paneview(this.element, {
            // only allow paneview in the vertical orientation for now
            orientation: Orientation.VERTICAL,
        });

        this.addDisposables(this._disposable);
    }

    focus() {
        //
    }

    updateOptions(options: Partial<PaneviewComponentOptions>): void {
        this._options = { ...this.options, ...options };
    }

    addPanel(options: AddPaneviewCompponentOptions): IDisposable {
        const body = createComponent(
            options.id,
            options.component,
            this.options.components || {},
            this.options.frameworkComponents || {},
            this.options.frameworkWrapper
                ? {
                      createComponent:
                          this.options.frameworkWrapper.body.createComponent,
                  }
                : undefined
        );

        let header: IPaneHeaderPart;

        if (options.headerComponent) {
            header = createComponent(
                options.id,
                options.headerComponent,
                this.options.headerComponents || {},
                this.options.headerframeworkComponents,
                this.options.frameworkWrapper
                    ? {
                          createComponent:
                              this.options.frameworkWrapper.header
                                  .createComponent,
                      }
                    : undefined
            );
        } else {
            header = new DefaultHeader();
        }

        const view = new PaneFramework({
            id: options.id,
            component: options.component,
            headerComponent: options.headerComponent,
            header,
            body,
            orientation: Orientation.VERTICAL,
            isExpanded: !!options.isExpanded,
            disableDnd: !!this.options.disableDnd,
        });

        const disposable = new CompositeDisposable(
            view.onDidDrop((event) => {
                this._onDidDrop.fire(event);
            })
        );

        const size: Sizing | number =
            typeof options.size === 'number' ? options.size : Sizing.Distribute;
        const index =
            typeof options.index === 'number' ? options.index : undefined;

        view.init({
            params: options.params || {},
            minimumBodySize: options.minimumBodySize,
            maximumBodySize: options.maximumBodySize,
            isExpanded: options.isExpanded,
            title: options.title,
            containerApi: new PaneviewApi(this),
        });

        this.paneview.addPane(view, size, index);

        view.orientation = this.paneview.orientation;

        return disposable;
    }

    getPanels(): PaneviewPanel[] {
        return this.paneview.getPanes();
    }

    removePanel(panel: PaneviewPanel) {
        const views = this.getPanels();
        const index = views.findIndex((_) => _ === panel);
        this.paneview.removePane(index);
    }

    movePanel(from: number, to: number): void {
        this.paneview.moveView(from, to);
    }

    getPanel(id: string): PaneviewPanel | undefined {
        return this.getPanels().find((view) => view.id === id);
    }

    layout(width: number, height: number): void {
        const [size, orthogonalSize] =
            this.paneview.orientation === Orientation.HORIZONTAL
                ? [width, height]
                : [height, width];
        this.paneview.layout(size, orthogonalSize);
    }

    /**
     * Resize the layout to fit the parent container
     */
    resizeToFit(): void {
        if (!this.element.parentElement) {
            return;
        }
        const { width, height } =
            this.element.parentElement.getBoundingClientRect();
        this.layout(width, height);
    }

    toJSON(): SerializedPaneview {
        const maximum = (value: number) =>
            value === Number.MAX_SAFE_INTEGER ||
            value === Number.POSITIVE_INFINITY
                ? undefined
                : value;
        const minimum = (value: number) => (value <= 0 ? undefined : value);

        const views: SerializedPaneviewPanel[] = this.paneview
            .getPanes()
            .map((view, i) => {
                const size = this.paneview.getViewSize(i);
                return {
                    size,
                    data: view.toJSON(),
                    minimumSize: minimum(view.minimumBodySize),
                    maximumSize: maximum(view.maximumBodySize),
                    expanded: view.isExpanded(),
                };
            });

        return {
            views,
            size: this.paneview.size,
        };
    }

    fromJSON(
        serializedPaneview: SerializedPaneview,
        deferComponentLayout?: boolean
    ): void {
        const { views, size } = serializedPaneview;

        const queue: Function[] = [];

        this.paneview.dispose();

        this.paneview = new Paneview(this.element, {
            orientation: Orientation.VERTICAL,
            descriptor: {
                size,
                views: views.map((view) => {
                    const data = view.data;

                    const body = createComponent(
                        data.id,
                        data.component,
                        this.options.components || {},
                        this.options.frameworkComponents || {},
                        this.options.frameworkWrapper
                            ? {
                                  createComponent:
                                      this.options.frameworkWrapper.body
                                          .createComponent,
                              }
                            : undefined
                    );

                    let header: IPaneHeaderPart;

                    if (data.headerComponent) {
                        header = createComponent(
                            data.id,
                            data.headerComponent,
                            this.options.headerComponents || {},
                            this.options.headerframeworkComponents || {},
                            this.options.frameworkWrapper
                                ? {
                                      createComponent:
                                          this.options.frameworkWrapper.header
                                              .createComponent,
                                  }
                                : undefined
                        );
                    } else {
                        header = new DefaultHeader();
                    }

                    const panel = new PaneFramework({
                        id: data.id,
                        component: data.component,
                        headerComponent: data.headerComponent,
                        header,
                        body,
                        orientation: Orientation.VERTICAL,
                        isExpanded: !!view.expanded,
                        disableDnd: !!this.options.disableDnd,
                    });

                    panel.onDidDrop((event) => {
                        this._onDidDrop.fire(event);
                    });

                    queue.push(() => {
                        panel.init({
                            params: data.params || {},
                            minimumBodySize: view.minimumSize,
                            maximumBodySize: view.maximumSize,
                            title: data.title,
                            isExpanded: !!view.expanded,
                            containerApi: new PaneviewApi(this),
                        });
                        panel.orientation = this.paneview.orientation;
                    });

                    return { size: view.size, view: panel };
                }),
            },
        });

        this.layout(this.width, this.height);

        if (deferComponentLayout) {
            setTimeout(() => {
                queue.forEach((f) => f());
            }, 0);
        } else {
            queue.forEach((f) => f());
        }
    }
}
