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
import { PanelCollection, PanelParameters } from '../types';
import { watchElementResize } from '../../dom';

export interface GridviewReadyEvent {
    api: GridviewApi;
}

export interface IGridviewPanelProps<T extends { [index: string]: any } = any>
    extends PanelParameters<T> {
    api: GridviewPanelApi;
    containerApi: GridviewApi;
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
        const [gridview, setGridview] = React.useState<IGridviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            if (props.disableAutoResizing || !gridview) {
                return () => {
                    //
                };
            }

            const watcher = watchElementResize(domRef.current!, (entry) => {
                const { width, height } = entry.contentRect;
                gridview.layout(width, height);
            });

            return () => {
                watcher.dispose();
            };
        }, [gridview, props.disableAutoResizing]);

        React.useEffect(() => {
            const element = document.createElement('div');

            const component = new GridviewComponent(element, {
                proportionalLayout:
                    typeof props.proportionalLayout === 'boolean'
                        ? props.proportionalLayout
                        : true,
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

            domRef.current!.appendChild(component.element);

            const { clientWidth, clientHeight } = domRef.current!;
            component.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api: new GridviewApi(component) });
            }

            setGridview(component);

            return () => {
                component.dispose();
                element.remove();
            };
        }, []);

        React.useEffect(() => {
            if (!gridview) {
                return;
            }
            gridview.updateOptions({
                frameworkComponents: props.components,
            });
        }, [gridview, props.components]);

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
