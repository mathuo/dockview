import {
    CompositeDisposable,
    IDisposable,
    MutableDisposable,
} from '../lifecycle';
import {
    IView,
    EnhancedLayoutPriority,
    Orientation,
    Sizing,
    Splitview,
} from './splitview';
import { SplitviewComponentOptions } from './options';
import { BaseComponentOptions, Parameters } from '../panel/types';
import { Emitter, Event } from '../events';
import { SplitviewPanel, ISplitviewPanel } from './splitviewPanel';
import { createComponent } from '../panel/componentFactory';
import { Resizable } from '../resizable';

export interface SerializedSplitviewPanelData {
    id: string;
    component: string;
    minimumSize?: number;
    maximumSize?: number;
    params?: { [index: string]: any };
}

export interface SerializedSplitviewPanel {
    snap?: boolean;
    priority?: EnhancedLayoutPriority;
    data: SerializedSplitviewPanelData;
    size: number;
}

export interface SerializedSplitview {
    orientation: Orientation;
    size: number;
    activeView?: string;
    views: SerializedSplitviewPanel[];
}

export interface AddSplitviewComponentOptions<T extends Parameters = Parameters>
    extends BaseComponentOptions<T> {
    index?: number;
    minimumSize?: number;
    maximumSize?: number;
}

export type SplitviewComponentUpdateOptions = Pick<
    SplitviewComponentOptions,
    'orientation' | 'components' | 'frameworkComponents'
>;

export interface ISplitviewComponent extends IDisposable {
    readonly minimumSize: number;
    readonly maximumSize: number;
    readonly height: number;
    readonly width: number;
    readonly length: number;
    readonly orientation: Orientation;
    readonly onDidAddView: Event<IView>;
    readonly onDidRemoveView: Event<IView>;
    readonly onDidLayoutFromJSON: Event<void>;
    readonly panels: SplitviewPanel[];
    updateOptions(options: Partial<SplitviewComponentUpdateOptions>): void;
    addPanel<T extends object = Parameters>(
        options: AddSplitviewComponentOptions<T>
    ): ISplitviewPanel;
    layout(width: number, height: number): void;
    onDidLayoutChange: Event<void>;
    toJSON(): SerializedSplitview;
    fromJSON(serializedSplitview: SerializedSplitview): void;
    focus(): void;
    getPanel(id: string): ISplitviewPanel | undefined;
    removePanel(panel: ISplitviewPanel, sizing?: Sizing): void;
    setVisible(panel: ISplitviewPanel, visible: boolean): void;
    movePanel(from: number, to: number): void;
    clear(): void;
}

/**
 * A high-level implementation of splitview that works using 'panels'
 */
export class SplitviewComponent
    extends Resizable
    implements ISplitviewComponent
{
    private _splitviewChangeDisposable = new MutableDisposable();
    private _splitview!: Splitview;
    private _activePanel: SplitviewPanel | undefined;
    private _panels = new Map<string, IDisposable>();
    private _options: SplitviewComponentOptions;

    private readonly _onDidLayoutfromJSON = new Emitter<void>();
    readonly onDidLayoutFromJSON: Event<void> = this._onDidLayoutfromJSON.event;

    private readonly _onDidAddView = new Emitter<IView>();
    readonly onDidAddView = this._onDidAddView.event;

    private readonly _onDidRemoveView = new Emitter<IView>();
    readonly onDidRemoveView = this._onDidRemoveView.event;

    private readonly _onDidLayoutChange = new Emitter<void>();
    readonly onDidLayoutChange: Event<void> = this._onDidLayoutChange.event;

    get panels(): SplitviewPanel[] {
        return this.splitview.getViews();
    }

    get options(): SplitviewComponentOptions {
        return this._options;
    }

    get length(): number {
        return this._panels.size;
    }

    get orientation(): Orientation {
        return this.splitview.orientation;
    }

    get splitview(): Splitview {
        return this._splitview;
    }

    set splitview(value: Splitview) {
        this._splitview = value;

        this._splitviewChangeDisposable.value = new CompositeDisposable(
            this._splitview.onDidSashEnd(() => {
                this._onDidLayoutChange.fire(undefined);
            }),
            this._splitview.onDidAddView((e) => this._onDidAddView.fire(e)),
            this._splitview.onDidRemoveView((e) =>
                this._onDidRemoveView.fire(e)
            )
        );
    }

    get minimumSize(): number {
        return this.splitview.minimumSize;
    }

    get maximumSize(): number {
        return this.splitview.maximumSize;
    }

    get height(): number {
        return this.splitview.orientation === Orientation.HORIZONTAL
            ? this.splitview.orthogonalSize
            : this.splitview.size;
    }

    get width(): number {
        return this.splitview.orientation === Orientation.HORIZONTAL
            ? this.splitview.size
            : this.splitview.orthogonalSize;
    }

    constructor(options: SplitviewComponentOptions) {
        super(options.parentElement, options.disableAutoResizing);

        this._options = options;

        if (!options.components) {
            options.components = {};
        }
        if (!options.frameworkComponents) {
            options.frameworkComponents = {};
        }

        this.splitview = new Splitview(this.element, options);

        this.addDisposables(
            this._onDidAddView,
            this._onDidLayoutfromJSON,
            this._onDidRemoveView,
            this._onDidLayoutChange
        );
    }

    updateOptions(options: Partial<SplitviewComponentUpdateOptions>): void {
        const hasOrientationChanged =
            typeof options.orientation === 'string' &&
            this.options.orientation !== options.orientation;

        this._options = { ...this.options, ...options };

        if (hasOrientationChanged) {
            this.splitview.orientation = options.orientation!;
        }

        this.splitview.layout(
            this.splitview.size,
            this.splitview.orthogonalSize
        );
    }

    focus(): void {
        this._activePanel?.focus();
    }

    movePanel(from: number, to: number): void {
        this.splitview.moveView(from, to);
    }

    setVisible(panel: SplitviewPanel, visible: boolean): void {
        const index = this.panels.indexOf(panel);
        this.splitview.setViewVisible(index, visible);
    }

    setActive(panel: SplitviewPanel, skipFocus?: boolean): void {
        this._activePanel = panel;

        this.panels
            .filter((v) => v !== panel)
            .forEach((v) => {
                v.api._onDidActiveChange.fire({ isActive: false });
                if (!skipFocus) {
                    v.focus();
                }
            });
        panel.api._onDidActiveChange.fire({ isActive: true });
        if (!skipFocus) {
            panel.focus();
        }
    }

    removePanel(panel: SplitviewPanel, sizing?: Sizing): void {
        const item = this._panels.get(panel.id);

        if (!item) {
            throw new Error(`unknown splitview panel ${panel.id}`);
        }

        item.dispose();

        this._panels.delete(panel.id);

        const index = this.panels.findIndex((_) => _ === panel);
        const removedView = this.splitview.removeView(index, sizing);
        removedView.dispose();

        const panels = this.panels;
        if (panels.length > 0) {
            this.setActive(panels[panels.length - 1]);
        }
    }

    getPanel(id: string): SplitviewPanel | undefined {
        return this.panels.find((view) => view.id === id);
    }

    addPanel<T extends object = Parameters>(
        options: AddSplitviewComponentOptions<T>
    ): SplitviewPanel {
        if (this._panels.has(options.id)) {
            throw new Error(`panel ${options.id} already exists`);
        }

        const view = createComponent(
            options.id,
            options.component,
            this.options.components ?? {},
            this.options.frameworkComponents ?? {},
            this.options.frameworkWrapper
                ? {
                      createComponent:
                          this.options.frameworkWrapper.createComponent,
                  }
                : undefined
        );

        view.orientation = this.splitview.orientation;

        view.init({
            params: options.params ?? {},
            minimumSize: options.minimumSize,
            maximumSize: options.maximumSize,
            snap: options.snap,
            priority: options.priority,
            accessor: this,
        });

        const size: Sizing | number =
            typeof options.size === 'number' ? options.size : Sizing.Distribute;
        const index =
            typeof options.index === 'number' ? options.index : undefined;

        this.splitview.addView(view, size, index);

        this.doAddView(view);
        this.setActive(view);

        return view;
    }

    layout(width: number, height: number): void {
        const [size, orthogonalSize] =
            this.splitview.orientation === Orientation.HORIZONTAL
                ? [width, height]
                : [height, width];
        this.splitview.layout(size, orthogonalSize);
    }

    private doAddView(view: SplitviewPanel): void {
        const disposable = view.api.onDidFocusChange((event) => {
            if (!event.isFocused) {
                return;
            }
            this.setActive(view, true);
        });

        this._panels.set(view.id, disposable);
    }

    toJSON(): SerializedSplitview {
        const views: SerializedSplitviewPanel[] = this.splitview
            .getViews<SplitviewPanel>()
            .map((view, i) => {
                const size = this.splitview.getViewSize(i);
                return {
                    size,
                    data: view.toJSON(),
                    snap: !!view.snap,
                    priority: view.priority,
                };
            });

        return {
            views,
            activeView: this._activePanel?.id,
            size: this.splitview.size,
            orientation: this.splitview.orientation,
        };
    }

    fromJSON(serializedSplitview: SerializedSplitview): void {
        this.clear();

        const { views, orientation, size, activeView } = serializedSplitview;

        const queue: Function[] = [];

        // take note of the existing dimensions
        const width = this.width;
        const height = this.height;

        this.splitview = new Splitview(this.element, {
            orientation,
            proportionalLayout: this.options.proportionalLayout,
            descriptor: {
                size,
                views: views.map((view) => {
                    const data = view.data;

                    if (this._panels.has(data.id)) {
                        throw new Error(`panel ${data.id} already exists`);
                    }

                    const panel = createComponent(
                        data.id,
                        data.component,
                        this.options.components ?? {},
                        this.options.frameworkComponents ?? {},
                        this.options.frameworkWrapper
                            ? {
                                  createComponent:
                                      this.options.frameworkWrapper
                                          .createComponent,
                              }
                            : undefined
                    );

                    queue.push(() => {
                        panel.init({
                            params: data.params ?? {},
                            minimumSize: data.minimumSize,
                            maximumSize: data.maximumSize,
                            snap: view.snap,
                            priority: view.priority,
                            accessor: this,
                        });
                    });

                    panel.orientation = orientation;

                    this.doAddView(panel);
                    setTimeout(() => {
                        // the original onDidAddView events are missed since they are fired before we can subcribe to them
                        this._onDidAddView.fire(panel);
                    }, 0);

                    return { size: view.size, view: panel };
                }),
            },
        });

        this.layout(width, height);

        queue.forEach((f) => f());

        if (typeof activeView === 'string') {
            const panel = this.getPanel(activeView);
            if (panel) {
                this.setActive(panel);
            }
        }

        this._onDidLayoutfromJSON.fire();
    }

    clear(): void {
        for (const disposable of this._panels.values()) {
            disposable.dispose();
        }

        this._panels.clear();

        while (this.splitview.length > 0) {
            const view = this.splitview.removeView(0, Sizing.Distribute, true);
            view.dispose();
        }
    }

    dispose(): void {
        for (const disposable of this._panels.values()) {
            disposable.dispose();
        }

        this._panels.clear();

        const views = this.splitview.getViews();

        this._splitviewChangeDisposable.dispose();
        this.splitview.dispose();

        for (const view of views) {
            view.dispose();
        }

        super.dispose();
    }
}
