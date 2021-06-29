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
import { DroptargetEvent } from '../../dnd/droptarget';

export interface PaneviewReadyEvent {
    api: PaneviewApi;
}

export interface IPaneviewPanelProps<T extends {} = Record<string, any>>
    extends PanelParameters<T> {
    api: PaneviewPanelApi;
    containerApi: PaneviewApi;
    title: string;
}

export interface PaneviewDropEvent {
    api: PaneviewApi;
    event: DroptargetEvent;
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

            const disposable = paneview.onDidDrop((event) => {
                if (props.onDidDrop) {
                    props.onDidDrop({ event, api });
                }
            });

            const { clientWidth, clientHeight } = domRef.current!;
            paneview.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api });
            }

            paneviewRef.current = paneview;

            return () => {
                disposable.dispose();
                paneview.dispose();
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
PaneviewReact.displayName = 'PaneviewComponent';
