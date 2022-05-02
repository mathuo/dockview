import { PaneviewApi } from '../api/component.api';
import { createComponent } from '../panel/componentFactory';
import { Emitter, Event } from '../events';
import {
    CompositeDisposable,
    IDisposable,
    MutableDisposable,
} from '../lifecycle';
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
    IPaneviewPanel,
} from './paneviewPanel';
import {
    DraggablePaneviewPanel,
    PaneviewDropEvent2,
} from './draggablePaneviewPanel';
import { DefaultHeader } from './defaultPaneviewHeader';

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
    };
    size: number;
    expanded?: boolean;
}

export interface SerializedPaneview {
    size: number;
    views: SerializedPaneviewPanel[];
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

export interface AddPaneviewComponentOptions {
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
    readonly panels: IPaneviewPanel[];
    readonly onDidAddView: Event<PaneviewPanel>;
    readonly onDidRemoveView: Event<PaneviewPanel>;
    readonly onDidDrop: Event<PaneviewDropEvent2>;
    readonly onDidLayoutChange: Event<void>;
    readonly onDidLayoutFromJSON: Event<void>;
    addPanel(options: AddPaneviewComponentOptions): IPaneviewPanel;
    layout(width: number, height: number): void;
    toJSON(): SerializedPaneview;
    fromJSON(serializedPaneview: SerializedPaneview): void;
    focus(): void;
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
    private _viewDisposables = new Map<string, IDisposable>();
    private _paneview!: Paneview;

    private readonly _onDidLayoutfromJSON = new Emitter<void>();
    readonly onDidLayoutFromJSON: Event<void> = this._onDidLayoutfromJSON.event;

    private readonly _onDidLayoutChange = new Emitter<void>();
    readonly onDidLayoutChange: Event<void> = this._onDidLayoutChange.event;

    private readonly _onDidDrop = new Emitter<PaneviewDropEvent2>();
    readonly onDidDrop: Event<PaneviewDropEvent2> = this._onDidDrop.event;

    private readonly _onDidAddView = new Emitter<PaneviewPanel>();
    readonly onDidAddView = this._onDidAddView.event;

    private readonly _onDidRemoveView = new Emitter<PaneviewPanel>();
    readonly onDidRemoveView = this._onDidRemoveView.event;

    get panels(): PaneviewPanel[] {
        return this.paneview.getPanes();
    }

    set paneview(value: Paneview) {
        this._paneview = value;

        this._disposable.value = new CompositeDisposable(
            this._paneview.onDidChange(() => {
                this._onDidLayoutChange.fire(undefined);
            }),
            this._paneview.onDidAddView((e) => this._onDidAddView.fire(e)),
            this._paneview.onDidRemoveView((e) => this._onDidRemoveView.fire(e))
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

        this.addDisposables(
            this._onDidLayoutChange,
            this._onDidLayoutfromJSON,
            this._onDidDrop,
            this._onDidAddView,
            this._onDidRemoveView
        );

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

    addPanel(options: AddPaneviewComponentOptions): IPaneviewPanel {
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

        this.doAddPanel(view);

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

        return view;
    }

    removePanel(panel: PaneviewPanel) {
        const views = this.panels;
        const index = views.findIndex((_) => _ === panel);
        this.paneview.removePane(index);

        this.doRemovePanel(panel);
    }

    movePanel(from: number, to: number): void {
        this.paneview.moveView(from, to);
    }

    getPanel(id: string): PaneviewPanel | undefined {
        return this.panels.find((view) => view.id === id);
    }

    layout(width: number, height: number): void {
        const [size, orthogonalSize] =
            this.paneview.orientation === Orientation.HORIZONTAL
                ? [width, height]
                : [height, width];
        this.paneview.layout(size, orthogonalSize);
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

    fromJSON(serializedPaneview: SerializedPaneview): void {
        const { views, size } = serializedPaneview;

        const queue: Function[] = [];

        for (const [_, value] of this._viewDisposables.entries()) {
            value.dispose();
        }
        this._viewDisposables.clear();

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

                    this.doAddPanel(panel);

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

                    setTimeout(() => {
                        // the original onDidAddView events are missed since they are fired before we can subcribe to them
                        this._onDidAddView.fire(panel);
                    }, 0);

                    return { size: view.size, view: panel };
                }),
            },
        });

        this.layout(this.width, this.height);

        queue.forEach((f) => f());

        this._onDidLayoutfromJSON.fire();
    }

    private doAddPanel(panel: PaneFramework) {
        const disposable = panel.onDidDrop((event) => {
            this._onDidDrop.fire(event);
        });

        this._viewDisposables.set(panel.id, disposable);
    }

    private doRemovePanel(panel: PaneviewPanel) {
        const disposable = this._viewDisposables.get(panel.id);

        if (disposable) {
            disposable.dispose();
            this._viewDisposables.delete(panel.id);
        }
    }

    public dispose(): void {
        super.dispose();

        for (const [_, value] of this._viewDisposables.entries()) {
            value.dispose();
        }
        this._viewDisposables.clear();

        this.paneview.dispose();
    }
}
