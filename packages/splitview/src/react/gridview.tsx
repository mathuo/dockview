import * as React from 'react'
import {
    ComponentGridview,
    IComponentGridviewLayout,
} from '../layout/componentGridview'
import { IGridApi } from '../panel/api'
import { Orientation } from '../splitview/splitview'
import { ReactComponentGridView } from './reactComponentGridView'

export interface GridviewReadyEvent {
    api: IComponentGridviewLayout
}

export interface IGridviewPanelProps {
    api: IGridApi
}

export interface IGridviewComponentProps {
    orientation: Orientation
    onReady?: (event: GridviewReadyEvent) => void
    components: {
        [index: string]: React.FunctionComponent<IGridviewPanelProps>
    }
}

export const GridviewComponent = (props: IGridviewComponentProps) => {
    const domReference = React.useRef<HTMLDivElement>()
    const gridview = React.useRef<IComponentGridviewLayout>()
    const [portals, setPortals] = React.useState<React.ReactPortal[]>([])

    const addPortal = React.useCallback((p: React.ReactPortal) => {
        setPortals((portals) => [...portals, p])
        return {
            dispose: () => {
                setPortals((portals) =>
                    portals.filter((portal) => portal !== p)
                )
            },
        }
    }, [])

    React.useEffect(() => {
        gridview.current = new ComponentGridview(domReference.current, {
            orientation: props.orientation,
            frameworkComponents: props.components,
            frameworkComponentFactory: {
                createComponent: (id: string, component: any) => {
                    return new ReactComponentGridView(id, id, component, {
                        addPortal,
                    })
                },
            },
        })

        if (props.onReady) {
            props.onReady({ api: gridview.current })
        }
    }, [])

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
            }}
            ref={domReference}
        >
            {portals}
        </div>
    )
}
