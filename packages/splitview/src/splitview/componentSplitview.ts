import { CompositeDisposable, IDisposable } from '../lifecycle';
import {
    LayoutPriority,
    Orientation,
    Sizing,
    Splitview,
} from './core/splitview';
import {
    createComponent,
    ISerializableView,
    SplitPanelOptions,
} from './core/options';
import { BaseComponentOptions } from '../panel/types';
import { Emitter, Event } from '../events';
import { SplitviewApi } from '../api/component.api';
import { SplitviewPanel } from './splitviewPanel';

interface SerializedSplitview {
    orientation: Orientation;
    size: number;
    activeView: string;
    views: Array<{
        snap?: boolean;
        priority?: LayoutPriority;
        minimumSize?: number;
        maximumSize?: number;
        data: {
            id: string;
            component: string;
            props: { [index: string]: any };
        };
        size: number;
    }>;
}

export interface AddSplitviewComponentOptions extends BaseComponentOptions {
    size?: number;
    index?: number;
    minimumSize?: number;
    maximumSize?: number;
}

export interface IComponentSplitview extends IDisposable {
    readonly minimumSize: number;
    readonly maximumSize: number;
    addFromComponent(options: AddSplitviewComponentOptions): void;
    layout(width: number, height: number): void;
    onDidLayoutChange: Event<void>;
    toJSON(): object;
    fromJSON(data: any): void;
    resizeToFit(): void;
    focus(): void;
    getPanel(id: string): SplitviewPanel | undefined;
    setActive(view: SplitviewPanel, skipFocus?: boolean): void;
    removePanel(panel: SplitviewPanel, sizing?: Sizing): void;
    getPanels(): SplitviewPanel[];
    setVisible(panel: SplitviewPanel, visible: boolean): void;
}

/**
 * A high-level implementation of splitview that works using 'panels'
 */
export class ComponentSplitview
    extends CompositeDisposable
    implements IComponentSplitview {
    private splitview: Splitview;
    private _activePanel: SplitviewPanel;

    private readonly _onDidLayoutChange = new Emitter<void>();
    readonly onDidLayoutChange: Event<void> = this._onDidLayoutChange.event;

    get minimumSize() {
        return this.splitview.minimumSize;
    }

    get maximumSize() {
        return this.splitview.maximumSize;
    }

    constructor(
        private readonly element: HTMLElement,
        private readonly options: SplitPanelOptions
    ) {
        super();

        if (!options.components) {
            options.components = {};
        }
        if (!options.frameworkComponents) {
            options.frameworkComponents = {};
        }

        this.splitview = new Splitview(this.element, options);

        this.addDisposables(
            this.splitview.onDidSashEnd(() => {
                this._onDidLayoutChange.fire(undefined);
            }),
            this.splitview
        );
    }

    focus() {
        this._activePanel?.focus();
    }

    setVisible(panel: SplitviewPanel, visible: boolean) {
        const index = this.getPanels().indexOf(panel);
        this.splitview.setViewVisible(index, visible);
    }

    setActive(view: SplitviewPanel, skipFocus?: boolean) {
        this._activePanel = view;

        this.getPanels()
            .filter((v) => v !== view)
            .forEach((v) => v.setActive(false, skipFocus));
        view.setActive(true, skipFocus);
    }

    getPanels(): SplitviewPanel[] {
        return this.splitview.getViews() as SplitviewPanel[];
    }

    removePanel(panel: SplitviewPanel, sizing?: Sizing) {
        const index = this.getPanels().findIndex((_) => _ === panel);
        this.splitview.removeView(index, sizing);
    }

    getPanel(id: string): SplitviewPanel | undefined {
        return this.getPanels().find((view) => view.id === id);
    }

    addFromComponent(options: AddSplitviewComponentOptions): void {
        const view = createComponent(
            options.id,
            options.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkWrapper?.createComponent
        );

        const size: Sizing | number =
            typeof options.size === 'number' ? options.size : Sizing.Distribute;
        const index =
            typeof options.index === 'number' ? options.index : undefined;

        view.init({
            params: options.params,
            minimumSize: options.minimumSize,
            maximumSize: options.maximumSize,
            snap: options.snap,
            priority: options.priority,
            containerApi: new SplitviewApi(this),
        });

        this.splitview.addView(view, size, index);

        this.doAddView(view);
        this.setActive(view);
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
        } = this.element.parentElement?.getBoundingClientRect();
        this.layout(width, height);
    }

    layout(width: number, height: number): void {
        const [size, orthogonalSize] =
            this.splitview.orientation === Orientation.HORIZONTAL
                ? [width, height]
                : [height, width];
        this.splitview.layout(size, orthogonalSize);
    }

    doAddView(view: SplitviewPanel) {
        // TODO: manage disposable
        const disposable = view.api.onDidFocusChange((event) => {
            if (!event.isFocused) {
                return;
            }
            this.setActive(view, true);
        });
    }

    toJSON(): object {
        const views = (this.splitview.getViews() as ISerializableView[]).map(
            (view, i) => {
                const size = this.splitview.getViewSize(i);
                return {
                    size,
                    data: view.toJSON ? view.toJSON() : {},
                    minimumSize: view.minimumSize,
                    maximumSize: view.maximumSize,
                    snap: !!view.snap,
                };
            }
        );

        return {
            views,
            activeView: this._activePanel?.id,
            size: this.splitview.size,
            orientation: this.splitview.orientation,
        };
    }

    fromJSON(data: any): void {
        const {
            views,
            orientation,
            size,
            activeView,
        } = data as SerializedSplitview;

        this.splitview.dispose();
        this.splitview = new Splitview(this.element, {
            orientation,
            proportionalLayout: this.options.proportionalLayout,
            descriptor: {
                size,
                views: views.map((view) => {
                    const data = view.data;

                    const panel = createComponent(
                        data.id,
                        data.component,
                        this.options.components,
                        this.options.frameworkComponents,
                        this.options.frameworkWrapper?.createComponent
                    );

                    panel.init({
                        params: data.props,
                        minimumSize: view.minimumSize,
                        maximumSize: view.maximumSize,
                        snap: view.snap,
                        priority: view.priority,
                        containerApi: new SplitviewApi(this),
                    });

                    this.doAddView(panel);

                    return { size: view.size, view: panel };
                }),
            },
        });

        if (typeof activeView === 'string') {
            this.getPanel(activeView)?.setActive(true);
        }
    }
}
