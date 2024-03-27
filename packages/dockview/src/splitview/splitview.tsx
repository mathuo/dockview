import React from 'react';
import {
    SplitviewApi,
    SplitviewPanelApi,
    ISplitviewComponent,
    SplitviewComponent,
    Orientation,
} from 'dockview-core';
import { usePortalsLifecycle } from '../react';
import { PanelParameters } from '../types';
import { ReactPanelView } from './view';

export interface SplitviewReadyEvent {
    api: SplitviewApi;
}

export interface ISplitviewPanelProps<T extends { [index: string]: any } = any>
    extends PanelParameters<T> {
    api: SplitviewPanelApi;
    containerApi: SplitviewApi;
}

export interface ISplitviewReactProps {
    orientation?: Orientation;
    onReady: (event: SplitviewReadyEvent) => void;
    components: Record<string, React.FunctionComponent<ISplitviewPanelProps>>;
    proportionalLayout?: boolean;
    hideBorders?: boolean;
    className?: string;
    disableAutoResizing?: boolean;
}

export const SplitviewReact = React.forwardRef(
    (props: ISplitviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const splitviewRef = React.useRef<ISplitviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            const splitview = new SplitviewComponent({
                parentElement: domRef.current!,
                disableAutoResizing: props.disableAutoResizing,
                orientation: props.orientation ?? Orientation.HORIZONTAL,
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
            splitview.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api: new SplitviewApi(splitview) });
            }

            splitviewRef.current = splitview;

            return () => {
                splitview.dispose();
            };
        }, []);

        React.useEffect(() => {
            if (!splitviewRef.current) {
                return;
            }
            splitviewRef.current.updateOptions({
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
SplitviewReact.displayName = 'SplitviewComponent';
