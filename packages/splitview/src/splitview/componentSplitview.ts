import { IDisposable } from '../lifecycle';
import {
    LayoutPriority,
    Orientation,
    Sizing,
    SplitView,
} from './core/splitview';
import {
    createComponent,
    ISerializableView,
    SplitPanelOptions,
} from './core/options';
import { Parameters } from '../panel/types';

export interface AddSplitviewComponentOptions {
    id: string;
    component: string;
    params?: Parameters;
    //
    size?: number;
    index?: number;
    minimumSize?: number;
    maximumSize?: number;
    snap?: boolean;
    //
    priority?: LayoutPriority;
}

export interface IComponentSplitview extends IDisposable {
    readonly minimumSize: number;
    readonly maximumSize: number;
    addFromComponent(options: AddSplitviewComponentOptions): IDisposable;
    layout(width: number, height: number): void;
    onChange(cb: (event: { proportions: number[] }) => void): IDisposable;
    toJSON(): object;
    fromJSON(data: any): void;
    resizeToFit(): void;
}

/**
 * A high-level implementation of splitview that works using 'panels'
 */
export class ComponentSplitview implements IComponentSplitview {
    private splitview: SplitView;

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
        if (!options.components) {
            options.components = {};
        }
        if (!options.frameworkComponents) {
            options.frameworkComponents = {};
        }

        this.splitview = new SplitView(this.element, options);
    }

    addFromComponent(options: AddSplitviewComponentOptions): IDisposable {
        const view = createComponent(
            options.id,
            options.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkWrapper.createComponent
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
        });

        this.splitview.addView(view, size, index);

        return {
            dispose: () => {
                //
            },
        };
    }

    /**
     * Resize the layout to fit the parent container
     */
    resizeToFit(): void {
        const {
            width,
            height,
        } = this.element.parentElement.getBoundingClientRect();
        this.layout(width, height);
    }

    layout(width: number, height: number): void {
        const [size, orthogonalSize] =
            this.splitview.orientation === Orientation.HORIZONTAL
                ? [width, height]
                : [height, width];
        this.splitview.layout(size, orthogonalSize);
    }

    onChange(cb: (event: { proportions: number[] }) => void): IDisposable {
        return this.splitview.onDidSashEnd(() => {
            cb({ proportions: this.splitview.proportions });
        });
    }

    toJSON(): object {
        const views = this.splitview
            .getViews()
            .map((view: ISerializableView, i) => {
                const size = this.splitview.getViewSize(i);
                return {
                    size,
                    data: view.toJSON ? view.toJSON() : {},
                    minimumSize: view.minimumSize,
                    maximumSize: view.maximumSize,
                    snap: view.snap,
                };
            });

        return {
            views,
            size: this.splitview.size,
            orientation: this.splitview.orientation,
        };
    }

    fromJSON(data: any): void {
        const { views, orientation, size } = data;

        this.splitview.dispose();
        this.splitview = new SplitView(this.element, {
            orientation,
            proportionalLayout: false,
            descriptor: {
                size,
                views: views.map((v) => {
                    const data = v.data;

                    const view = createComponent(
                        data.id,
                        data.component,
                        this.options.components,
                        this.options.frameworkComponents,
                        this.options.frameworkWrapper.createComponent
                    );

                    view.init({
                        params: v.props,
                        minimumSize: v.minimumSize,
                        maximumSize: v.maximumSize,
                        snap: v.snap,
                        priority: v.priority,
                    });

                    return { size: v.size, view };
                }),
            },
        });
    }

    dispose() {
        this.splitview.dispose();
    }
}
