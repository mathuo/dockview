import { IDisposable } from '../lifecycle'
import { LayoutPriority, Orientation, SplitView } from './splitview'
import {
    createComponent,
    ISerializableView,
    SplitPanelOptions,
} from './options'

export interface IComponentSplitview extends IDisposable {
    addFromComponent(options: {
        id: string
        component: string
        params?: {
            [index: string]: any
        }
        priority?: LayoutPriority
    }): IDisposable
    layout(width: number, height: number): void
    onChange(cb: (event: { proportions: number[] }) => void): IDisposable
    toJSON(): object
    deserialize(data: any): void
    minimumSize: number
}

/**
 * A high-level implementation of splitview that works using 'panels'
 */
export class ComponentSplitview implements IComponentSplitview {
    private splitview: SplitView

    constructor(
        private readonly element: HTMLElement,
        private readonly options: SplitPanelOptions
    ) {
        if (!options.components) {
            options.components = {}
        }
        if (!options.frameworkComponents) {
            options.frameworkComponents = {}
        }

        this.splitview = new SplitView(this.element, options)
    }

    get minimumSize() {
        return this.splitview.minimumSize
    }

    addFromComponent(options: {
        id: string
        component: string
        params?: {
            [index: string]: any
        }
        priority?: LayoutPriority
    }): IDisposable {
        const view = createComponent(
            options.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkWrapper.createComponent
        )

        this.registerView(view)

        this.splitview.addView(view, { type: 'distribute' })
        view.init({ params: options.params })
        view.priority = options.priority

        return {
            dispose: () => {
                //
            },
        }
    }

    private registerView(view: ISerializableView) {
        //
    }

    layout(width: number, height: number): void {
        const [size, orthogonalSize] =
            this.splitview.orientation === Orientation.HORIZONTAL
                ? [width, height]
                : [height, width]
        this.splitview.layout(size, orthogonalSize)
    }

    onChange(cb: (event: { proportions: number[] }) => void): IDisposable {
        return this.splitview.onDidSashEnd(() => {
            cb({ proportions: this.splitview.proportions })
        })
    }
    toJSON(): object {
        const views = this.splitview
            .getViews()
            .map((v: ISerializableView, i) => {
                const size = this.splitview.getViewSize(i)
                return {
                    size,
                    data: v.toJSON ? v.toJSON() : {},
                    minimumSize: v.minimumSize,
                    maximumSize: v.maximumSize,
                    snapSize: v.snapSize,
                }
            })

        return {
            views,
            size: this.splitview.size,
            orientation: this.splitview.orientation,
        }
    }
    deserialize(data: any): void {
        const { views, orientation, size } = data

        this.splitview.dispose()
        this.splitview = new SplitView(this.element, {
            orientation,
            proportionalLayout: false,
            descriptor: {
                size,
                views: views.map((v) => {
                    const data = v.data

                    const view = createComponent(
                        data.component,
                        this.options.components,
                        this.options.frameworkComponents,
                        this.options.frameworkWrapper.createComponent
                    )

                    if (typeof v.minimumSize === 'number') {
                        view.minimumSize = v.minimumSize
                    }
                    if (typeof v.maximumSize === 'number') {
                        view.maximumSize = v.maximumSize
                    }
                    if (typeof v.snapSize === 'number') {
                        view.snapSize = v.snapSize
                    }

                    view.init({ params: v.props })

                    view.priority = v.priority

                    return { size: v.size, view }
                }),
            },
        })

        this.splitview.orientation = orientation
    }

    public dispose() {
        this.splitview.dispose()
    }
}
