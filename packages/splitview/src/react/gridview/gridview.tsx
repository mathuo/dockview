import * as React from 'react';
import {
    GridviewComponent,
    IGridviewComponent,
} from '../../gridview/gridviewComponent';
import { IGridPanelApi } from '../../api/gridPanelApi';
import { Orientation } from '../../splitview/core/splitview';
import { ReactGridPanelView } from './view';
import { usePortalsLifecycle } from '../react';
import { GridviewApi } from '../../api/component.api';
import { PanelCollection } from '../types';

export interface GridviewReadyEvent {
    api: GridviewApi;
}

export interface IGridviewPanelProps {
    api: IGridPanelApi;
    containerApi: GridviewApi;
    [key: string]: any;
}

export interface IGridviewReactProps {
    orientation: Orientation;
    onReady?: (event: GridviewReadyEvent) => void;
    components: PanelCollection<IGridviewPanelProps>;
    hideBorders?: boolean;
    className?: string;
    proportionalLayout?: boolean;
}

export const GridviewReact: React.FunctionComponent<IGridviewReactProps> = (
    props: IGridviewReactProps
) => {
    const domRef = React.useRef<HTMLDivElement>(null);
    const gridviewRef = React.useRef<IGridviewComponent>();
    const [portals, addPortal] = usePortalsLifecycle();

    React.useEffect(() => {
        const gridview = new GridviewComponent(domRef.current!, {
            proportionalLayout: !!props.proportionalLayout,
            orientation: props.orientation,
            frameworkComponents: props.components,
            frameworkComponentFactory: {
                createComponent: (id: string, componentId, component) => {
                    return new ReactGridPanelView(id, componentId, component, {
                        addPortal,
                    });
                },
            },
            styles: props.hideBorders
                ? { separatorBorder: 'transparent' }
                : undefined,
        });

        if (props.onReady) {
            props.onReady({ api: new GridviewApi(gridview) });
        }

        gridviewRef.current = gridview;

        return () => {
            gridview.dispose();
        };
    }, []);

    return (
        <div
            className={props.className}
            style={{ height: '100%', width: '100%' }}
            ref={domRef}
        >
            {portals}
        </div>
    );
};
GridviewReact.displayName = 'GridviewComponent';
