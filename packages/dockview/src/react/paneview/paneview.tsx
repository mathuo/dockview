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

export interface IPaneviewPanelProps<T extends { [index: string]: any } = any>
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
        const [paneview, setPaneview] = React.useState<IPaneviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            if (props.disableAutoResizing || !paneview) {
                return () => {
                    //
                };
            }

            const watcher = watchElementResize(domRef.current!, (entry) => {
                const { width, height } = entry.contentRect;
                paneview.layout(width, height);
            });

            return () => {
                watcher.dispose();
            };
        }, [paneview, props.disableAutoResizing]);

        React.useEffect(() => {
            const createComponent = (
                id: string,
                componentId: string,
                component: any
            ) =>
                new PanePanelSection(id, component, {
                    addPortal,
                });

            const component = new PaneviewComponent(domRef.current!, {
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

            const api = new PaneviewApi(component);

            const { clientWidth, clientHeight } = domRef.current!;
            component.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api });
            }

            setPaneview(component);

            return () => {
                component.dispose();
            };
        }, []);

        React.useEffect(() => {
            if (!paneview) {
                return;
            }
            paneview.updateOptions({
                frameworkComponents: props.components,
            });
        }, [paneview, props.components]);

        React.useEffect(() => {
            if (!paneview) {
                return;
            }
            paneview.updateOptions({
                headerframeworkComponents: props.headerComponents,
            });
        }, [paneview, props.headerComponents]);

        React.useEffect(() => {
            if (!paneview) {
                return () => {
                    //
                };
            }

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
        }, [paneview, props.onDidDrop]);

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
