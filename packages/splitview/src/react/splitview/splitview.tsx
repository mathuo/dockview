import * as React from 'react';
import { SplitviewApi } from '../../api/component.api';
import { ISplitviewPanelApi } from '../../api/splitviewPanelApi';
import {
    ISplitviewComponent,
    SplitviewComponent,
} from '../../splitview/splitviewComponent';
import { Orientation } from '../../splitview/core/splitview';
import { usePortalsLifecycle } from '../react';
import { PanelCollection } from '../types';
import { ReactPanelView } from './view';
import { watchElementResize } from '../../dom';

export interface SplitviewReadyEvent {
    api: SplitviewApi;
}

export interface ISplitviewPanelProps {
    api: ISplitviewPanelApi;
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
    disableAutoResizing?: boolean;
}

export const SplitviewReact: React.FunctionComponent<ISplitviewReactProps> = (
    props: ISplitviewReactProps
) => {
    const domRef = React.useRef<HTMLDivElement>(null);
    const splitviewRef = React.useRef<ISplitviewComponent>();
    const [portals, addPortal] = usePortalsLifecycle();

    React.useEffect(() => {
        if (props.disableAutoResizing) {
            return () => {
                //
            };
        }

        const watcher = watchElementResize(domRef.current!, (entry) => {
            const { width, height } = entry.contentRect;
            splitviewRef.current?.layout(width, height);
        });

        return () => {
            watcher.dispose();
        };
    }, [props.disableAutoResizing]);

    React.useEffect(() => {
        const splitview = new SplitviewComponent(domRef.current!, {
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
