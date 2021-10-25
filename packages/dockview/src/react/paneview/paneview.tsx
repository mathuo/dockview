import * as React from 'react';
import { PaneviewPanelApi } from '../../api/paneviewPanelApi';
import {
    PaneviewComponent,
    IPaneviewComponent,
} from '../../paneview/paneviewComponent';
import { usePortalsLifecycle } from '../react';
import { PaneviewApi } from '../../api/component.api';
import { PanePanelSection } from './view';
import { PanelCollection, PanelParameters } from '../types';
import { watchElementResize } from '../../dom';
import { PaneviewDropEvent2 } from '../../paneview/draggablePaneviewPanel';

export interface PaneviewReadyEvent {
    api: PaneviewApi;
}

export interface IPaneviewPanelProps<T extends {} = Record<string, any>>
    extends PanelParameters<T> {
    api: PaneviewPanelApi;
    containerApi: PaneviewApi;
    title: string;
}

export interface PaneviewDropEvent extends PaneviewDropEvent2 {
    api: PaneviewApi;
}

export interface IPaneviewReactProps {
    onReady?: (event: PaneviewReadyEvent) => void;
    components?: PanelCollection<IPaneviewPanelProps>;
    headerComponents?: PanelCollection<IPaneviewPanelProps>;
    className?: string;
    disableAutoResizing?: boolean;
    disableDnd?: boolean;
    onDidDrop?(event: PaneviewDropEvent): void;
}

export const PaneviewReact = React.forwardRef(
    (props: IPaneviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const paneviewRef = React.useRef<IPaneviewComponent>();
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
                paneviewRef.current?.layout(width, height);
            });

            return () => {
                watcher.dispose();
            };
        }, [props.disableAutoResizing]);

        React.useEffect(() => {
            const createComponent = (
                id: string,
                componentId: string,
                component: any
            ) =>
                new PanePanelSection(id, component, {
                    addPortal,
                });

            const paneview = new PaneviewComponent(domRef.current!, {
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
            paneviewRef.current?.updateOptions({
                frameworkComponents: props.components,
            });
        }, [props.components]);

        React.useEffect(() => {
            paneviewRef.current?.updateOptions({
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
