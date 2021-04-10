import * as React from 'react';
import {
    GridviewComponent,
    IGridviewComponent,
} from '../../gridview/gridviewComponent';
import { GridviewPanelApi } from '../../api/gridviewPanelApi';
import { Orientation } from '../../splitview/core/splitview';
import { ReactGridPanelView } from './view';
import { usePortalsLifecycle } from '../react';
import { GridviewApi } from '../../api/component.api';
import { PanelCollection } from '../types';
import { watchElementResize } from '../../dom';

export interface GridviewReadyEvent {
    api: GridviewApi;
}

export interface IGridviewPanelProps {
    api: GridviewPanelApi;
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
    disableAutoResizing?: boolean;
}

export const GridviewReact = React.forwardRef(
    (props: IGridviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const gridviewRef = React.useRef<IGridviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            if (props.disableAutoResizing) {
                return () => {
                    //
                };
            }

            const watcher = watchElementResize(domRef.current!, (entry) => {
                const { width, height } = entry.contentRect;
                gridviewRef.current?.layout(width, height);
            });

            return () => {
                watcher.dispose();
            };
        }, [props.disableAutoResizing]);

        React.useEffect(() => {
            const element = document.createElement('div');

            const gridview = new GridviewComponent(element, {
                proportionalLayout: !!props.proportionalLayout,
                orientation: props.orientation,
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

            domRef.current?.appendChild(gridview.element);

            const { clientWidth, clientHeight } = domRef.current!;
            gridview.layout(clientWidth, clientHeight);

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
    }
);
GridviewReact.displayName = 'GridviewComponent';
