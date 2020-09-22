import * as React from 'react';
import {
    Orientation,
    GridviewComponent,
    LayoutPriority,
    GridviewReadyEvent,
    ComponentGridview,
    IGridviewPanelProps,
} from 'splitview';
import { Activitybar } from './activitybar';
import { Footer } from './footer';
import { TestGrid } from './reactgrid';
import { Sidebar } from './sidebar';

const rootcomponents: {
    [index: string]: React.FunctionComponent<IGridviewPanelProps>;
} = {
    sidebar: Sidebar,
    activitybar: Activitybar,
    editor: TestGrid,
    footer: Footer,
    panel: () => {
        return (
            <div style={{ backgroundColor: 'rgb(30,30,30)', height: '100%' }}>
                panel
            </div>
        );
    },
};

export const Application = () => {
    const api = React.useRef<ComponentGridview>();

    const onReady = (event: GridviewReadyEvent) => {
        // event.api.deserialize(rootLayout);
        event.api.addComponent({
            id: '0',
            component: 'activitybar',
            minimumWidth: 48,
            maximumWidth: 48,
            location: [0],
        });

        event.api.addComponent({
            id: '4',
            component: 'footer',
            location: [1],
            maximumHeight: 22,
            minimumHeight: 22,
        });

        event.api.addComponent({
            id: '1',
            component: 'sidebar',
            // position: { reference: '4', direction: 'above' },
            snap: true,
            location: [0, 1],
            minimumWidth: 170,
        });
        event.api.addComponent({
            id: '2',
            component: 'editor',
            snap: true,
            position: { reference: '1', direction: 'right' },
            priority: LayoutPriority.High,
        });
        event.api.addComponent({
            id: '3',
            component: 'panel',
            position: { reference: '2', direction: 'below' },
            size: 200,
            snap: true,
        });

        api.current = event.api as ComponentGridview;
    };

    React.useEffect(() => {
        const callback = (ev: UIEvent) => {
            const height = window.innerHeight - 20;
            const width = window.innerWidth;

            api.current?.layout(width, height);
        };
        window.addEventListener('resize', callback);
        callback(undefined);

        return () => {
            window.removeEventListener('resize', callback);
        };
    }, []);

    return (
        <GridviewComponent
            components={rootcomponents}
            onReady={onReady}
            orientation={Orientation.VERTICAL}
        />
    );
};
