import * as React from 'react';
import { IPanelApi } from '../panel/api';
import { Orientation } from '../splitview/splitview';
import { ComponentPaneView, IComponentPaneView } from '../paneview/componentPaneView';

export interface PaneviewReadyEvent {
    api: IComponentPaneView;
}

export interface IPaneviewPanelProps {
    api: IPanelApi;
}

export interface IPaneviewComponentProps {
    orientation: Orientation;
    onReady?: (event: PaneviewReadyEvent) => void;
    components: {
        [index: string]: React.FunctionComponent<IPaneviewPanelProps>;
    };
}

export const SplitViewComponent = (props: IPaneviewComponentProps) => {
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
            // 
        });

        const { width, height } = domReference.current.getBoundingClientRect();
        const [size, orthogonalSize] =
            props.orientation === Orientation.HORIZONTAL
                ? [width, height]
                : [height, width];
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
