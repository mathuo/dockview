import * as React from 'react';
import {
    GridviewComponent,
    IGridviewComponent,
    GridviewPanelApi,
    Orientation,
    GridviewApi,
} from 'dockview-core';
import { ReactGridPanelView } from './view';
import { usePortalsLifecycle } from '../react';
import { PanelCollection, PanelParameters } from '../types';

export interface GridviewReadyEvent {
    api: GridviewApi;
}

export interface IGridviewPanelProps<T extends { [index: string]: any } = any>
    extends PanelParameters<T> {
    api: GridviewPanelApi;
    containerApi: GridviewApi;
}

export interface IGridviewReactProps {
    orientation?: Orientation;
    onReady: (event: GridviewReadyEvent) => void;
    components: PanelCollection<IGridviewPanelProps>;
    hideBorders?: boolean;
    className?: string;
    proportionalLayout?: boolean;
    disableAutoResizing?: boolean;
}

export const GridviewReact = React.forwardRef(
    (props: IGridviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const gridviewRef = React.useRef<IGridviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            if (!domRef.current) {
                return () => {
                    // noop
                };
            }

            const gridview = new GridviewComponent({
                parentElement: domRef.current,
                proportionalLayout:
                    typeof props.proportionalLayout === 'boolean'
                        ? props.proportionalLayout
                        : true,
                orientation: props.orientation ?? Orientation.HORIZONTAL,
                frameworkComponents: props.components,
                frameworkComponentFactory: {
                    createComponent: (id: string, componentId, component) => {
                        return new ReactGridPanelView(
                            id,
                            componentId,
                            component,
                            {
                                addPortal,
                            }
                        );
                    },
                },
                styles: props.hideBorders
                    ? { separatorBorder: 'transparent' }
                    : undefined,
            });

            const { clientWidth, clientHeight } = domRef.current;
            gridview.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api: new GridviewApi(gridview) });
            }

            gridviewRef.current = gridview;

            return () => {
                gridview.dispose();
            };
        }, []);

        React.useEffect(() => {
            if (!gridviewRef.current) {
                return;
            }
            gridviewRef.current.updateOptions({
                frameworkComponents: props.components,
            });
        }, [props.components]);

        return (
            <div
                className={props.className}
                style={{ height: '100%', width: '100%' }}
                ref={domRef}
            >
                {portals}
            </div>
        );
    }
);
GridviewReact.displayName = 'GridviewComponent';
