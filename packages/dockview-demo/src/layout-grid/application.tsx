import * as React from 'react';
import {
    Orientation,
    GridviewReact,
    LayoutPriority,
    GridviewReadyEvent,
    IGridviewPanelProps,
    SerializedGridview,
    GridviewApi,
} from 'dockview';
import { Activitybar } from '../services/widgets';
import { Footer } from './footer';
import { Panel } from './panel';
import { TestGrid } from './layoutGrid';
import { useLayoutRegistry } from './registry';
import { Sidebar } from '../services/widgets';

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
        api.current = event.api;
        registry.register('gridview', event.api);

        let success = false;
        const state = localStorage.getItem('dockview-layout');

        if (state) {
            try {
                event.api.fromJSON(JSON.parse(state));
                success = true;
            } catch (err) {
                console.error('failed to load layout', err);
            }
        }

        if (!success) {
            event.api.addPanel({
                id: 'i',
                component: 'activitybar',
                minimumWidth: 48,
                maximumWidth: 48,
                location: [0],
            });

            event.api.addPanel({
                id: 'footer',
                component: 'footer',
                location: [1],
                maximumHeight: 22,
                minimumHeight: 22,
            });

            event.api.addPanel({
                id: 'editor',
                component: 'editor',
                snap: true,
                location: [0, 1],
                priority: LayoutPriority.High,
            });

            event.api.addPanel({
                id: 'sidebar',
                component: 'sidebar',
                snap: true,
                position: { reference: 'editor', direction: 'left' },
                minimumWidth: 170,
                size: 100,
            });

            event.api.addPanel({
                id: 'panel',
                component: 'panel',
                position: { reference: 'editor', direction: 'below' },
                size: 200,
                snap: true,
            });
        }

        event.api.onDidLayoutChange(() => {
            localStorage.setItem(
                'dockview-layout',
                JSON.stringify(event.api.toJSON())
            );
        });
    };

    return (
        <GridviewReact
            components={rootcomponents}
            onReady={onReady}
            orientation={Orientation.VERTICAL}
            hideBorders={true}
            proportionalLayout={true}
        />
    );
};
