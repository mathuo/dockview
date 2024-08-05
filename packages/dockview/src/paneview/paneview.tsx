import React from 'react';
import {
    PaneviewPanelApi,
    PaneviewDndOverlayEvent,
    PaneviewApi,
    PaneviewDropEvent,
    createPaneview,
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
        const paneviewRef = React.useRef<PaneviewApi>();
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

            const api = createPaneview(domRef.current!, {
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

            const { clientWidth, clientHeight } = domRef.current!;
            api.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api });
            }

            paneviewRef.current = api;

            return () => {
                api.dispose();
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

            const api = paneviewRef.current;

            const disposable = api.onDidDrop((event) => {
                if (props.onDidDrop) {
                    props.onDidDrop({
                        ...event,
                        api,
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
