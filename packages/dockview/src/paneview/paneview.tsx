import React from 'react';
import {
    PaneviewPanelApi,
    PaneviewComponent,
    IPaneviewComponent,
    PaneviewDndOverlayEvent,
    PaneviewApi,
    PaneviewDropEvent,
} from 'dockview-core';
import { usePortalsLifecycle } from '../react';
import { PanePanelSection } from './view';
import { PanelParameters } from '../types';

export interface PaneviewReadyEvent {
    api: PaneviewApi;
}

export interface IPaneviewPanelProps<T extends { [index: string]: any } = any>
    extends PanelParameters<T> {
    api: PaneviewPanelApi;
    containerApi: PaneviewApi;
    title: string;
}

export interface IPaneviewReactProps {
    onReady: (event: PaneviewReadyEvent) => void;
    components: Record<string, React.FunctionComponent<IPaneviewPanelProps>>;
    headerComponents?: Record<
        string,
        React.FunctionComponent<IPaneviewPanelProps>
    >;
    className?: string;
    disableAutoResizing?: boolean;
    disableDnd?: boolean;
    showDndOverlay?: (event: PaneviewDndOverlayEvent) => boolean;
    onDidDrop?(event: PaneviewDropEvent): void;
}

export const PaneviewReact = React.forwardRef(
    (props: IPaneviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const paneviewRef = React.useRef<IPaneviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            const createComponent = (
                id: string,
                _componentId: string,
                component: any
            ) =>
                new PanePanelSection(id, component, {
                    addPortal,
                });

            const paneview = new PaneviewComponent({
                parentElement: domRef.current!,
                disableAutoResizing: props.disableAutoResizing,
                frameworkComponents: props.components,
                components: {},
                headerComponents: {},
                disableDnd: props.disableDnd,
                headerframeworkComponents: props.headerComponents,
                frameworkWrapper: {
                    header: {
                        createComponent,
                    },
                    body: {
                        createComponent,
                    },
                },
                showDndOverlay: props.showDndOverlay,
            });

            const api = new PaneviewApi(paneview);

            const { clientWidth, clientHeight } = domRef.current!;
            paneview.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api });
            }

            paneviewRef.current = paneview;

            return () => {
                paneview.dispose();
            };
        }, []);

        React.useEffect(() => {
            if (!paneviewRef.current) {
                return;
            }
            paneviewRef.current.updateOptions({
                frameworkComponents: props.components,
            });
        }, [props.components]);

        React.useEffect(() => {
            if (!paneviewRef.current) {
                return;
            }
            paneviewRef.current.updateOptions({
                headerframeworkComponents: props.headerComponents,
            });
        }, [props.headerComponents]);

        React.useEffect(() => {
            if (!paneviewRef.current) {
                return () => {
                    //
                };
            }

            const paneview = paneviewRef.current;

            const disposable = paneview.onDidDrop((event) => {
                if (props.onDidDrop) {
                    props.onDidDrop({
                        ...event,
                        api: new PaneviewApi(paneview),
                    });
                }
            });

            return () => {
                disposable.dispose();
            };
        }, [props.onDidDrop]);

        React.useEffect(() => {
            if (!paneviewRef.current) {
                return;
            }
            paneviewRef.current.updateOptions({
                showDndOverlay: props.showDndOverlay,
            });
        }, [props.showDndOverlay]);

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
PaneviewReact.displayName = 'PaneviewComponent';
