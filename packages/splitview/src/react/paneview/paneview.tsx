import * as React from 'react';
import { IPanelApi } from '../../panel/api';
import {
    ComponentPaneView,
    IComponentPaneView,
} from '../../paneview/componentPaneView';
import { PaneReact } from './reactPane';

export interface PaneviewReadyEvent {
    api: IComponentPaneView;
}

export interface IPaneviewPanelProps {
    api: IPanelApi;
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
    const domReference = React.useRef<HTMLDivElement>();
    const splitpanel = React.useRef<IComponentPaneView>();
    const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);

    const addPortal = React.useCallback((p: React.ReactPortal) => {
        setPortals((portals) => [...portals, p]);
        return {
            dispose: () => {
                setPortals((portals) =>
                    portals.filter((portal) => portal !== p)
                );
            },
        };
    }, []);

    React.useEffect(() => {
        splitpanel.current = new ComponentPaneView(domReference.current, {
            frameworkComponents: props.components,
            components: {},
            frameworkWrapper: {
                createComponent: (id: string, componentId, component: any) => {
                    return new PaneReact(
                        id,
                        componentId,
                        component,
                        { addPortal },
                        {}
                    );
                },
            },
        });

        const { width, height } = domReference.current.getBoundingClientRect();
        const [size, orthogonalSize] = [height, width];
        splitpanel.current.layout(size, orthogonalSize);

        if (props.onReady) {
            props.onReady({ api: splitpanel.current });
        }

        return () => {
            splitpanel.current.dispose();
        };
    }, []);

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
            }}
            ref={domReference}
        >
            {portals}
        </div>
    );
};
PaneViewComponent.displayName = 'PaneviewComponent';
