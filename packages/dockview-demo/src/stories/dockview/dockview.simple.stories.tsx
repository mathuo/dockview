import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    IWatermarkPanelProps,
    PanelCollection,
} from 'dockview';
import * as React from 'react';
import { Meta } from '@storybook/react';

const components: PanelCollection<IDockviewPanelProps> = {
    default: (props) => {
        return (
            <div style={{ padding: '10px', height: '100%' }}>hello world</div>
        );
    },
    iframe: (props) => {
        return (
            <div style={{ height: '100%', width: '100%' }}>
                <iframe src="./" style={{ height: '100%', width: '100%' }}>
                    Hello world
                </iframe>
            </div>
        );
    },
};

export const Simple = (props: {
    onEvent: (name: string) => void;
    theme: string;
    hideBorders: boolean;
    disableAutoResizing: boolean;
}) => {
    const api = React.useRef<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        api.current = event.api;

        event.api.onGridEvent((e) => props.onEvent(e.kind));

        event.api.addPanel({
            id: 'panel1',
            component: 'default',
        });
        event.api.addPanel({
            id: 'panel2',
            component: 'default',
        });
        event.api.addPanel({
            id: 'panel3',
            component: 'default',
            position: { referencePanel: 'panel1', direction: 'right' },
        });
        event.api.addPanel({
            id: 'panel4',
            component: 'default',
            position: { referencePanel: 'panel3', direction: 'below' },
        });

        // event.api.getPanel('panel1').api;
    };

    return (
        <DockviewReact
            className={props.theme}
            onReady={onReady}
            components={components}
            hideBorders={props.hideBorders}
            disableAutoResizing={props.disableAutoResizing}
        />
    );
};

export default {
    title: 'Library/Dockview/Simple',
    component: Simple,
    decorators: [
        (Component) => {
            document.body.style.padding = '0px';
            return (
                <div style={{ height: '100vh', fontFamily: 'Arial' }}>
                    <Component />
                </div>
            );
        },
    ],
    args: { theme: 'dockview-theme-light' },
    argTypes: {
        theme: {
            control: {
                type: 'select',
                options: ['dockview-theme-dark', 'dockview-theme-light'],
            },
        },
        onEvent: { action: 'onEvent' },
    },
} as Meta;
