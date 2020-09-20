import * as React from 'react'
import { SplitView, Orientation, IBaseView } from 'splitview'
import { ReactRenderView } from './panel/view'
import { ViewComponent } from './bridge/view'

export interface IViewWithReactComponent extends IBaseView {
    id: string
    props?: {}
    component: ViewComponent
}

export interface OnReadyEvent {
    api: SplitviewApi
}

export interface SerializedConfig {
    views: Array<Omit<IViewWithReactComponent, 'component'> & { size?: number }>
}

export interface SplitviewApi {
    add: (
        options: Omit<IViewWithReactComponent, 'component'> & {
            size?: number
            index?: number
        }
    ) => void
    moveView: (from: number, to: number) => void
    toJSON: () => {}
}

export interface ISplitViewReactProps {
    orientation: Orientation
    size: number
    orthogonalSize: number
    onReady?: (event: OnReadyEvent) => void
    components?: { [index: string]: ViewComponent }
    initialLayout?: SerializedConfig
}

export interface ISplitViewComponentRef {
    layout: (size: number, orthogonalSize: number) => void
}

export const SplitViewComponent = React.forwardRef(
    (props: ISplitViewReactProps, ref: React.Ref<ISplitViewComponentRef>) => {
        const containerRef = React.useRef<HTMLDivElement>()
        const splitview = React.useRef<SplitView>()
        const [portals, setPortals] = React.useState<React.ReactPortal[]>([])

        const hydrate = React.useCallback(() => {
            if (!props.initialLayout || !splitview.current) {
                return
            }

            const serializedConfig = props.initialLayout

            serializedConfig.views.forEach((view) => {
                const component = props.components[view.id]
                splitview.current.addView(
                    createView({ ...view, component }),
                    view.size
                )
            })
            splitview.current.layout(props.size, props.orthogonalSize)
        }, [props.initialLayout])

        React.useEffect(() => {
            splitview.current?.setOrientation(props.orientation)
            splitview.current?.layout(props.size, props.orthogonalSize)
        }, [props.orientation])

        React.useImperativeHandle(
            ref,
            () => ({
                layout: (size, orthogonalSize) => {
                    splitview.current?.layout(size, orthogonalSize)
                },
            }),
            [splitview]
        )

        React.useEffect(() => {
            splitview.current = new SplitView(containerRef.current, {
                orientation: props.orientation,
            })

            hydrate()

            if (props.onReady) {
                props.onReady({
                    api: {
                        add: (
                            options: Omit<
                                IViewWithReactComponent,
                                'component'
                            > & {
                                props?: {}
                                size?: number
                                index?: number
                            }
                        ) => {
                            const component = props.components[options.id]
                            splitview.current.addView(
                                createView({ ...options, component }),
                                options.size,
                                options.index
                            )
                            splitview.current.layout(
                                props.size,
                                props.orthogonalSize
                            )
                        },
                        moveView: (from: number, to: number) => {
                            splitview.current.moveView(from, to)
                        },
                        toJSON: () => {
                            return {
                                views: (splitview.current.getViews() as ReactRenderView[]).map(
                                    (v) =>
                                        Object.entries({
                                            size: v.size,
                                            id: v.id,
                                            snapSize: v.snapSize,
                                            minimumSize: v.minimumSize,
                                            maximumSize: v.maximumSize,
                                            props: v.props,
                                        }).reduce(
                                            (x, y) =>
                                                y[1] !== undefined || x !== null
                                                    ? { ...x, [y[0]]: y[1] }
                                                    : x,
                                            {}
                                        )
                                ),
                            }
                        },
                    },
                })
            }

            splitview.current.layout(props.size, props.orthogonalSize)

            return () => {
                splitview.current.dispose()
            }
        }, [])

        const createView = React.useCallback(
            (view: IViewWithReactComponent) =>
                new ReactRenderView(view, (portal) => {
                    setPortals((portals) => [...portals, portal])
                    return {
                        dispose: () =>
                            void setPortals((portals) =>
                                portals.filter((_) => _ !== portal)
                            ),
                    }
                }),
            []
        )

        return (
            <div ref={containerRef} className="split-view-container-react">
                {portals}
            </div>
        )
    }
)
