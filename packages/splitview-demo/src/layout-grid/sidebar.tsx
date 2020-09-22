import * as React from 'react';
import {
    IGridviewPanelProps,
    PaneViewComponent,
    PaneviewReadyEvent,
    IPaneviewPanelProps,
    IComponentPaneView,
} from 'splitview';

const components = {
    default: (props: IPaneviewPanelProps) => {
        return (
            <div style={{ height: '100%', backgroundColor: 'lightgreen' }}>
                This is an example panel
            </div>
        );
    },
};

export const Sidebar = (props: IGridviewPanelProps) => {
    const api = React.useRef<IComponentPaneView>();

    const onReady = (event: PaneviewReadyEvent) => {
        event.api.addFromComponent({
            id: '1',
            componentName: 'default',
            params: {},
            tabComponentName: 'default1',
        });
        event.api.addFromComponent({
            id: '2',
            componentName: 'default',
            params: {},
            tabComponentName: 'default1',
        });

        api.current = event.api;
    };

    React.useEffect(() => {
        const disposable = props.api.onDidDimensionsChange((ev) => {
            api.current.layout(ev.width, ev.height);
        });

        return () => {
            disposable.dispose();
        };
    });

    return <PaneViewComponent components={components} onReady={onReady} />;
};
