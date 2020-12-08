import {
    ISplitviewPanelProps,
    Orientation,
    PanelCollection,
    SplitviewApi,
    SplitviewReact,
    SplitviewReadyEvent,
} from 'dockview';
import * as React from 'react';
import { Story, Meta } from '@storybook/react';
import 'dockview/dist/styles.css';

const components: PanelCollection<ISplitviewPanelProps> = {
    default: (props) => {
        return (
            <div
                style={{
                    padding: '10px',
                    backgroundColor: props.color,
                    height: '100%',
                }}
            >
                hello world
            </div>
        );
    },
};

export const Simple = (props: {
    orientation: Orientation;
    hideBorders: boolean;
    proportionalLayout: boolean;
}) => {
    const api = React.useRef<SplitviewApi>();

    const onReady = (event: SplitviewReadyEvent) => {
        event.api.layout(window.innerWidth, window.innerHeight);
        api.current = event.api;
        event.api.addPanel({
            id: 'panel1',
            component: 'default',
            params: { color: 'red' },
            minimumSize: 50,
        });
        event.api.addPanel({
            id: 'panel2',
            component: 'default',
            params: { color: 'green' },
            minimumSize: 50,
        });
        event.api.addPanel({
            id: 'panel3',
            component: 'default',
            params: { color: 'purple' },
            minimumSize: 50,
        });
    };

    React.useEffect(() => {
        window.addEventListener('resize', () => {
            api.current?.layout(window.innerWidth, window.innerHeight);
        });
    }, []);

    return (
        <SplitviewReact
            onReady={onReady}
            orientation={props.orientation}
            components={components}
            hideBorders={props.hideBorders}
            proportionalLayout={props.proportionalLayout}
        />
    );
};

export const SnappablePanel = (props: {
    orientation: Orientation;
    hideBorders: boolean;
    proportionalLayout: boolean;
}) => {
    const api = React.useRef<SplitviewApi>();

    const onReady = (event: SplitviewReadyEvent) => {
        event.api.layout(window.innerWidth, window.innerHeight);
        api.current = event.api;
        event.api.addPanel({
            id: 'panel1',
            component: 'default',
            params: { color: 'red' },
            minimumSize: 50,
            snap: true,
        });
        event.api.addPanel({
            id: 'panel2',
            component: 'default',
            params: { color: 'green' },
            minimumSize: 50,
        });
        event.api.addPanel({
            id: 'panel3',
            component: 'default',
            params: { color: 'purple' },
            minimumSize: 50,
            snap: true,
        });
    };

    React.useEffect(() => {
        window.addEventListener('resize', () => {
            api.current?.layout(window.innerWidth, window.innerHeight);
        });
    }, []);

    return (
        <SplitviewReact
            onReady={onReady}
            orientation={props.orientation}
            components={components}
            hideBorders={props.hideBorders}
            proportionalLayout={props.proportionalLayout}
        />
    );
};

export const Deserialization = (props: { orientation: Orientation }) => {
    const api = React.useRef<SplitviewApi>();

    const onReady = (event: SplitviewReadyEvent) => {
        event.api.layout(window.innerWidth, window.innerHeight);
        api.current = event.api;

        event.api.fromJSON({
            size: 100,
            views: [
                {
                    size: 20,
                    data: {
                        id: 'panel1',
                        component: 'default',
                        params: {
                            color: 'red',
                        },
                    },
                },
                {
                    size: 40,
                    data: {
                        id: 'panel2',
                        component: 'default',
                        params: {
                            color: 'green',
                        },
                    },
                },
                {
                    size: 60,
                    data: {
                        id: 'panel3',
                        component: 'default',
                        params: {
                            color: 'purple',
                        },
                    },
                },
            ],
            orientation: props.orientation,
            activeView: 'panel1',
        });

        event.api.layout(window.innerWidth, window.innerHeight);
    };

    React.useEffect(() => {
        window.addEventListener('resize', () => {
            api.current?.layout(window.innerWidth, window.innerHeight);
        });
    }, []);

    return (
        <SplitviewReact
            onReady={onReady}
            orientation={props.orientation}
            components={components}
        />
    );
};

export default {
    title: 'Splitview',
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
    args: { orientation: Orientation.VERTICAL, proportionalLayout: true },
    argTypes: {
        orientation: {
            control: {
                type: 'inline-radio',
                options: [Orientation.HORIZONTAL, Orientation.VERTICAL],
            },
        },
    },
} as Meta;
