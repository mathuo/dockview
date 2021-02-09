import * as React from 'react';
import { IPanePanelApi } from '../../api/panePanelApi';
import {
    PaneviewComponent,
    IPaneviewComponent,
} from '../../paneview/paneviewComponent';
import { usePortalsLifecycle } from '../react';
import { PaneviewApi } from '../../api/component.api';
import { PanelBody, PanelHeader } from './view';
import { PanelCollection } from '../types';
import { watchElementResize } from '../../dom';

export interface PaneviewReadyEvent {
    api: PaneviewApi;
}

export interface IPaneviewPanelProps {
    api: IPanePanelApi;
    containerApi: PaneviewApi;
    title: string;
    [key: string]: any;
}

export interface IPaneviewReactProps {
    onReady?: (event: PaneviewReadyEvent) => void;
    components?: PanelCollection<IPaneviewPanelProps>;
    headerComponents?: PanelCollection<IPaneviewPanelProps>;
    className?: string;
    disableAutoResizing?: boolean;
}

export const PaneviewReact: React.FunctionComponent<IPaneviewReactProps> = (
    props: IPaneviewReactProps
) => {
    const domRef = React.useRef<HTMLDivElement>(null);
    const paneviewRef = React.useRef<IPaneviewComponent>();
    const [portals, addPortal] = usePortalsLifecycle();

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
        const paneview = new PaneviewComponent(domRef.current!, {
            frameworkComponents: props.components,
            components: {},
            headerComponents: {},
            headerframeworkComponents: props.headerComponents,
            frameworkWrapper: {
                header: {
                    createComponent: (
                        id: string,
                        componentId,
                        component: any
                    ) => {
                        return new PanelHeader(id, component, { addPortal });
                    },
                },
                body: {
                    createComponent: (
                        id: string,
                        componentId,
                        component: any
                    ) => {
                        return new PanelBody(id, component, { addPortal });
                    },
                },
            },
        });

        if (props.onReady) {
            props.onReady({ api: new PaneviewApi(paneview) });
        }

        paneviewRef.current = paneview;

        return () => {
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
};
PaneviewReact.displayName = 'PaneviewComponent';
