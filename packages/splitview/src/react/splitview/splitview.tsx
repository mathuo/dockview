import * as React from 'react';
import { SplitviewApi } from '../../api/component.api';
import { IPanelApi } from '../../api/panelApi';
import {
    IComponentSplitview,
    ComponentSplitview,
} from '../../splitview/componentSplitview';
import { Orientation } from '../../splitview/core/splitview';
import { usePortalsLifecycle } from '../react';
import { ReactPanelView } from './view';

export interface SplitviewReadyEvent {
    api: SplitviewApi;
}

export interface ISplitviewPanelProps {
    api: IPanelApi;
}

export interface ISplitviewComponentProps {
    orientation: Orientation;
    onReady?: (event: SplitviewReadyEvent) => void;
    components: {
        [index: string]: React.FunctionComponent<ISplitviewPanelProps>;
    };
    proportionalLayout?: boolean;
}

export const SplitviewComponent: React.FunctionComponent<ISplitviewComponentProps> = (
    props: ISplitviewComponentProps
) => {
    const domRef = React.useRef<HTMLDivElement>();
    const splitviewRef = React.useRef<IComponentSplitview>();
    const [portals, addPortal] = usePortalsLifecycle();

    React.useEffect(() => {
        const splitview = new ComponentSplitview(domRef.current, {
            orientation: props.orientation,
            frameworkComponents: props.components,
            frameworkWrapper: {
                createComponent: (id: string, componentId, component: any) => {
                    return new ReactPanelView(id, componentId, component, {
                        addPortal,
                    });
                },
            },
            proportionalLayout: props.proportionalLayout,
        });

        splitview.resizeToFit();

        if (props.onReady) {
            props.onReady({ api: new SplitviewApi(splitview) });
        }

        splitviewRef.current = splitview;

        return () => {
            splitview.dispose();
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
SplitviewComponent.displayName = 'SplitviewComponent';
