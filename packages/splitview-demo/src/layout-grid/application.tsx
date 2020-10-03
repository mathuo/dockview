import * as React from 'react';
import {
    Orientation,
    GridviewComponent,
    LayoutPriority,
    GridviewReadyEvent,
    ComponentGridview,
    IGridviewPanelProps,
} from 'splitview';
import { ComponentDockview } from 'splitview/dist/esm';
import { Activitybar } from './activitybar';
import { Footer } from './footer';
import { Panel } from './panel';
import { TestGrid } from './reactgrid';
import { useLayoutRegistry } from './registry';
import { Sidebar } from './sidebar';

const rootcomponents: {
    [index: string]: React.FunctionComponent<IGridviewPanelProps>;
} = {
    sidebar: Sidebar,
    activitybar: Activitybar,
    editor: TestGrid,
    footer: Footer,
    panel: Panel,
};

export const Application = () => {
    const api = React.useRef<ComponentGridview>();
    const registry = useLayoutRegistry();

    const onReady = (event: GridviewReadyEvent) => {
        const layout = () =>
            (event.api as ComponentGridview).layout(
                window.innerWidth,
                window.innerHeight,
                true
            );
        layout();

        event.api.fromJSON(require('./application.layout.json'));
        // layout();
        api.current = event.api as ComponentGridview;

        registry.register('gridview', event.api);
        return;

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
            id: '2',
            component: 'editor',
            snap: true,
            location: [0, 1],
            priority: LayoutPriority.High,
        });

        event.api.addComponent({
            id: 'sidebar',
            component: 'sidebar',
            snap: true,
            position: { reference: '2', direction: 'left' },
            minimumWidth: 170,
            size: 171,
        });

        event.api.addComponent({
            id: '3',
            component: 'panel',
            position: { reference: '2', direction: 'below' },
            size: 200,
            snap: true,
        });

        setTimeout(() => {
            console.log(JSON.stringify(api.current.toJSON(), null, 4));
        }, 10000);
    };

    React.useEffect(() => {
        const callback = (ev: UIEvent) => {
            const height = window.innerHeight;
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
