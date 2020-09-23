import * as React from 'react';
import {
    ComponentGridview,
    IComponentGridview,
} from '../dockview/componentGridview';
import { IGridPanelApi } from '../panel/api';
import { Orientation } from '../splitview/splitview';
import { ReactComponentGridView } from './reactComponentGridView';

export interface GridviewReadyEvent {
    api: IComponentGridview;
}

export interface IGridviewPanelProps {
    api: IGridPanelApi;
}

export interface IGridviewComponentProps {
    orientation: Orientation;
    onReady?: (event: GridviewReadyEvent) => void;
    components: {
        [index: string]: React.FunctionComponent<IGridviewPanelProps>;
    };
}

export const GridviewComponent: React.FunctionComponent<IGridviewComponentProps> = (
    props: IGridviewComponentProps
) => {
    const domReference = React.useRef<HTMLDivElement>();
    const gridview = React.useRef<IComponentGridview>();
    const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);

    const addPortal = React.useCallback((p: React.ReactPortal) => {
        setPortals((portals) => [...portals, p]);
        return {
            dispose: () => {
                setPortals((portals) =>
                    portals.filter((portal) => portal !== p)
                );
            },
        };
    }, []);

    React.useEffect(() => {
        gridview.current = new ComponentGridview(domReference.current, {
            orientation: props.orientation,
            frameworkComponents: props.components,
            frameworkComponentFactory: {
                createComponent: (id: string, componentId, component) => {
                    return new ReactComponentGridView(
                        id,
                        componentId,
                        component,
                        {
                            addPortal,
                        }
                    );
                },
            },
        });

        if (props.onReady) {
            props.onReady({ api: gridview.current });
        }
    }, []);

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
    );
};
GridviewComponent.displayName = 'GridviewComponent';
