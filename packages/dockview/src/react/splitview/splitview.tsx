import * as React from 'react';
import { SplitviewApi } from '../../api/component.api';
import { SplitviewPanelApi } from '../../api/splitviewPanelApi';
import {
    ISplitviewComponent,
    SplitviewComponent,
} from '../../splitview/splitviewComponent';
import { Orientation } from '../../splitview/core/splitview';
import { usePortalsLifecycle } from '../react';
import { PanelCollection, PanelParameters } from '../types';
import { ReactPanelView } from './view';
import { watchElementResize } from '../../dom';

export interface SplitviewReadyEvent {
    api: SplitviewApi;
}

export interface ISplitviewPanelProps<T extends { [index: string]: any } = any>
    extends PanelParameters<T> {
    api: SplitviewPanelApi;
    containerApi: SplitviewApi;
}

export interface ISplitviewReactProps {
    orientation: Orientation;
    onReady?: (event: SplitviewReadyEvent) => void;
    components: PanelCollection<ISplitviewPanelProps>;
    proportionalLayout?: boolean;
    hideBorders?: boolean;
    className?: string;
    disableAutoResizing?: boolean;
}

export const SplitviewReact = React.forwardRef(
    (props: ISplitviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const [splitview, setSplitview] = React.useState<ISplitviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            if (props.disableAutoResizing || !splitview) {
                return () => {
                    //
                };
            }

            const watcher = watchElementResize(domRef.current!, (entry) => {
                const { width, height } = entry.contentRect;
                splitview.layout(width, height);
            });

            return () => {
                watcher.dispose();
            };
        }, [splitview, props.disableAutoResizing]);

        React.useEffect(() => {
            const component = new SplitviewComponent(domRef.current!, {
                orientation: props.orientation,
                frameworkComponents: props.components,
                frameworkWrapper: {
                    createComponent: (
                        id: string,
                        componentId,
                        component: any
                    ) => {
                        return new ReactPanelView(id, componentId, component, {
                            addPortal,
                        });
                    },
                },
                proportionalLayout:
                    typeof props.proportionalLayout === 'boolean'
                        ? props.proportionalLayout
                        : true,
                styles: props.hideBorders
                    ? { separatorBorder: 'transparent' }
                    : undefined,
            });

            const { clientWidth, clientHeight } = domRef.current!;
            component.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api: new SplitviewApi(component) });
            }

            setSplitview(component);

            return () => {
                component.dispose();
            };
        }, []);

        React.useEffect(() => {
            if (!splitview) {
                return;
            }
            splitview.updateOptions({
                frameworkComponents: props.components,
            });
        }, [splitview, props.components]);

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
SplitviewReact.displayName = 'SplitviewComponent';
