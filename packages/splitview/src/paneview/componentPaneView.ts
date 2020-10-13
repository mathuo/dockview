import { PaneviewApi } from '../api/component.api';
import { PanePanelApi } from '../api/panePanelApi';
import { addDisposableListener, Emitter, Event } from '../events';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { PanelUpdateEvent } from '../panel/types';
import { createComponent } from '../splitview/core/options';
import { LayoutPriority, Orientation } from '../splitview/core/splitview';
import { PaneviewComponentOptions } from './options';
import { PaneView } from './paneview';
import {
    IPaneBodyPart,
    IPaneHeaderPart,
    PaneviewPanel,
    PanePanelInitParameter,
} from './paneviewPanel';

class DefaultHeader extends CompositeDisposable implements IPaneHeaderPart {
    private _element: HTMLElement;
    private apiRef: { api: PanePanelApi } = { api: null };

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

    init(params: PanePanelInitParameter & { api: PanePanelApi }) {
        this.apiRef.api = params.api;
        this._element.textContent = params.title;
    }

    update(params: PanelUpdateEvent) {
        //
    }
}

export class PaneFramework extends PaneviewPanel {
    constructor(
        private readonly options: {
            id: string;
            component: string;
            headerComponent: string;
            body: IPaneBodyPart;
            header: IPaneHeaderPart;
        }
    ) {
        super(options.id, options.component, options.headerComponent);
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
    params: {
        [key: string]: any;
    };
    minimumBodySize?: number;
    maximumBodySize?: number;
    isExpanded?: boolean;
    title: string;
}

export interface IComponentPaneView extends IDisposable {
    readonly minimumSize: number;
    readonly maximumSize: number;
    addFromComponent(options: AddPaneviewCompponentOptions): IDisposable;
    layout(width: number, height: number): void;
    onDidLayoutChange: Event<void>;
    toJSON(): object;
    fromJSON(data: any): void;
    resizeToFit(): void;
    focus(): void;
}

export class ComponentPaneView
    extends CompositeDisposable
    implements IComponentPaneView {
    private paneview: PaneView;

    private readonly _onDidLayoutChange = new Emitter<void>();
    readonly onDidLayoutChange: Event<void> = this._onDidLayoutChange.event;

    get minimumSize() {
        return this.paneview.minimumSize;
    }

    get maximumSize() {
        return this.paneview.maximumSize;
    }

    constructor(
        private element: HTMLElement,
        private readonly options: PaneviewComponentOptions
    ) {
        super();

        this.paneview = new PaneView(this.element, {
            // only allow paneview in the vertical orientation for now
            orientation: Orientation.VERTICAL,
        });

        this.addDisposables(
            this.paneview.onDidChange(() => {
                this._onDidLayoutChange.fire(undefined);
            }),
            this.paneview
        );
    }

    focus() {
        //
    }

    addFromComponent(options: AddPaneviewCompponentOptions): IDisposable {
        const body = createComponent(
            options.id,
            options.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkWrapper.body.createComponent
        );

        let header: IPaneHeaderPart;

        if (options.headerComponent) {
            header = createComponent(
                options.id,
                options.headerComponent,
                this.options.headerComponents,
                this.options.headerframeworkComponents,
                this.options.frameworkWrapper.header.createComponent
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
        });

        this.paneview.addPane(view);

        view.init({
            params: options.params,
            minimumBodySize: options.minimumBodySize,
            maximumBodySize: options.maximumBodySize,
            isExpanded: options.isExpanded,
            title: options.title,
            containerApi: new PaneviewApi(this),
        });

        return {
            dispose: () => {
                //
            },
        };
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
        const {
            width,
            height,
        } = this.element.parentElement.getBoundingClientRect();
        this.layout(width, height);
    }

    toJSON(): object {
        const views = this.paneview.getPanes().map((view: PaneviewPanel, i) => {
            const size = this.paneview.getViewSize(i);
            return {
                size,
                data: view.toJSON ? view.toJSON() : {},
                minimumSize: view.minimumBodySize,
                maximumSize: view.maximumBodySize,
                expanded: view.isExpanded(),
            };
        });

        return {
            views,
            size: this.paneview.size,
            orientation: this.paneview.orientation,
        };
    }

    fromJSON(data: any): void {
        const { views, orientation, size } = data as {
            orientation: Orientation;
            size: number;
            expanded?: boolean;
            views: Array<{
                snap?: boolean;
                priority?: LayoutPriority;
                minimumSize?: number;
                maximumSize?: number;
                data: {
                    id: string;
                    component: string;
                    title: string;
                    headerComponent?: string;
                    props: { [index: string]: any };
                };
                size: number;
                expanded?: boolean;
            }>;
        };

        this.paneview.dispose();
        this.paneview = new PaneView(this.element, {
            orientation,
            descriptor: {
                size,
                views: views.map((view) => {
                    const data = view.data;

                    const body = createComponent(
                        data.id,
                        data.component,
                        this.options.components,
                        this.options.frameworkComponents,
                        this.options.frameworkWrapper?.body.createComponent
                    );

                    let header: IPaneHeaderPart;

                    if (data.headerComponent) {
                        header = createComponent(
                            data.id,
                            data.headerComponent,
                            this.options.headerComponents,
                            this.options.headerframeworkComponents,
                            this.options.frameworkWrapper?.header
                                .createComponent
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
                    });

                    panel.init({
                        params: data.props,
                        minimumBodySize: view.minimumSize,
                        maximumBodySize: view.maximumSize,
                        title: data.title,
                        isExpanded: !!view.expanded,
                        containerApi: new PaneviewApi(this),
                    });

                    return { size: view.size, view: panel };
                }),
            },
        });
    }
}
