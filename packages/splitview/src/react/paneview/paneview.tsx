import * as React from 'react';
import { IPanePanelApi } from '../../api/panePanelApi';
import {
    ComponentPaneView,
    IComponentPaneView,
} from '../../paneview/componentPaneView';
import { PaneReact } from './view';
import { usePortalsLifecycle } from '../react';
import { PaneviewApi } from '../../api/component.api';

export interface PaneviewReadyEvent {
    api: PaneviewApi;
}

export interface IPaneviewPanelProps {
    api: IPanePanelApi;
    title: string;
}

export interface IPaneviewComponentProps {
    onReady?: (event: PaneviewReadyEvent) => void;
    components: {
        [index: string]: React.FunctionComponent<IPaneviewPanelProps>;
    };
}

export const PaneViewComponent: React.FunctionComponent<IPaneviewComponentProps> = (
    props: IPaneviewComponentProps
) => {
    const domRef = React.useRef<HTMLDivElement>();
    const paneviewRef = React.useRef<IComponentPaneView>();
    const [portals, addPortal] = usePortalsLifecycle();

    React.useEffect(() => {
        const paneview = new ComponentPaneView(domRef.current, {
            frameworkComponents: props.components,
            components: {},
            frameworkWrapper: {
                createComponent: (id: string, componentId, component: any) => {
                    return new PaneReact(id, componentId, component, {
                        addPortal,
                    });
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
            style={{
                height: '100%',
                width: '100%',
            }}
            ref={domRef}
        >
            {portals}
        </div>
    );
};
PaneViewComponent.displayName = 'PaneviewComponent';
