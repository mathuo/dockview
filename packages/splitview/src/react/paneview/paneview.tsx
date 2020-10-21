import * as React from 'react';
import { IPanePanelApi } from '../../api/panePanelApi';
import {
    ComponentPaneview,
    IComponentPaneview,
} from '../../paneview/componentPaneview';
import { usePortalsLifecycle } from '../react';
import { PaneviewApi } from '../../api/component.api';
import { PanelBody, PanelHeader } from './view';
import { PanelCollection } from '../types';

export interface PaneviewReadyEvent {
    api: PaneviewApi;
}

export interface IPaneviewPanelProps {
    api: IPanePanelApi;
    containerApi: PaneviewApi;
    title: string;
}

export interface IPaneviewComponentProps {
    onReady?: (event: PaneviewReadyEvent) => void;
    components?: PanelCollection<IPaneviewPanelProps>;
    headerComponents?: PanelCollection<IPaneviewPanelProps>;
    className?: string;
}

export const PaneviewComponent: React.FunctionComponent<IPaneviewComponentProps> = (
    props: IPaneviewComponentProps
) => {
    const domRef = React.useRef<HTMLDivElement>();
    const paneviewRef = React.useRef<IComponentPaneview>();
    const [portals, addPortal] = usePortalsLifecycle();

    React.useEffect(() => {
        const paneview = new ComponentPaneview(domRef.current, {
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

        const { width, height } = domRef.current.getBoundingClientRect();
        const [size, orthogonalSize] = [height, width];
        paneview.layout(size, orthogonalSize);

        if (props.onReady) {
            props.onReady({ api: new PaneviewApi(paneview) });
        }

        paneview.resizeToFit();

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
PaneviewComponent.displayName = 'PaneviewComponent';
