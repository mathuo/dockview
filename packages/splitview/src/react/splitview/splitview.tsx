import * as React from 'react';
import { SplitviewApi } from '../../api/component.api';
import { IPanelApi } from '../../api/panelApi';
import {
    ISplitviewPanels,
    SplitviewComponent,
} from '../../splitview/splitviewComponent';
import { Orientation } from '../../splitview/core/splitview';
import { usePortalsLifecycle } from '../react';
import { PanelCollection } from '../types';
import { ReactPanelView } from './view';

export interface SplitviewReadyEvent {
    api: SplitviewApi;
}

export interface ISplitviewPanelProps {
    api: IPanelApi;
    containerApi: SplitviewApi;
    [key: string]: any;
}

export interface ISplitviewReactProps {
    orientation: Orientation;
    onReady?: (event: SplitviewReadyEvent) => void;
    components: PanelCollection<ISplitviewPanelProps>;
    proportionalLayout?: boolean;
    hideBorders?: boolean;
    className?: string;
}

export const SplitviewReact: React.FunctionComponent<ISplitviewReactProps> = (
    props: ISplitviewReactProps
) => {
    const domRef = React.useRef<HTMLDivElement>();
    const splitviewRef = React.useRef<ISplitviewPanels>();
    const [portals, addPortal] = usePortalsLifecycle();

    React.useEffect(() => {
        const splitview = new SplitviewComponent(domRef.current, {
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
            styles: props.hideBorders
                ? { separatorBorder: 'transparent' }
                : undefined,
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
            className={props.className}
            style={{ height: '100%', width: '100%' }}
            ref={domRef}
        >
            {portals}
        </div>
    );
};
SplitviewReact.displayName = 'SplitviewComponent';
