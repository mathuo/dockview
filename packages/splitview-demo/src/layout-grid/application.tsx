import * as React from 'react';
import {
    Orientation,
    GridviewComponent,
    LayoutPriority,
    GridviewReadyEvent,
    ComponentGridview,
    IGridviewPanelProps,
    GridviewApi,
} from 'dockview';
import { Activitybar } from './activitybar';
import { Footer } from './footer';
import { Panel } from './panel';
import { TestGrid } from './layoutGrid';
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
    const api = React.useRef<GridviewApi>();
    const registry = useLayoutRegistry();

    const onReady = (event: GridviewReadyEvent) => {
        // event.api.fromJSON(require('./application.layout.json'));
        api.current = event.api;

        registry.register('gridview', event.api);
        // return;

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
            size: 100,
        });

        event.api.addComponent({
            id: '3',
            component: 'panel',
            position: { reference: '2', direction: 'below' },
            size: 200,
            snap: true,
        });
    };

    React.useEffect(() => {
        const onresize = (ev: UIEvent) => {
            const { innerWidth: width, innerHeight: height } = window;
            api.current?.layout(width, height); // // fill the entire screen
        };
        window.addEventListener('resize', onresize);

        onresize(undefined); // initial render
        api.current.getGroup('sidebar').api.setSize({ width: 300 });

        return () => {
            window.removeEventListener('resize', onresize);
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
