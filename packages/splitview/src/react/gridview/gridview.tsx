import * as React from 'react';
import {
    ComponentGridview,
    IComponentGridview,
} from '../../gridview/componentGridview';
import { IGridPanelApi } from '../../api/gridPanelApi';
import { Orientation } from '../../splitview/splitview';
import { ReactComponentGridView } from './reactComponentGridView';
import { usePortalsLifecycle } from '../react';

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
    const domRef = React.useRef<HTMLDivElement>();
    const gridviewRef = React.useRef<IComponentGridview>();
    const [portals, addPortal] = usePortalsLifecycle();

    React.useEffect(() => {
        const gridview = new ComponentGridview(domRef.current, {
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

        // gridview.resizeToFit();

        if (props.onReady) {
            props.onReady({ api: gridview });
        }

        gridviewRef.current = gridview;

        return () => {
            gridview.dispose();
        };
    }, []);

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
            }}
            ref={domRef}
        >
            {portals}
        </div>
    );
};
GridviewComponent.displayName = 'GridviewComponent';
