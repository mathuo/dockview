import {
    ISplitviewPanelProps,
    Orientation,
    PanelCollection,
    SplitviewApi,
    SplitviewReact,
    SplitviewReadyEvent,
} from 'dockview';
import * as React from 'react';
import { Meta } from '@storybook/react';

const components: PanelCollection = {
    default: (props: ISplitviewPanelProps<{ color: string }>) => {
        const resize = () => {
            props.api.setSize({ size: 300 });
        };

        return (
            <div
                style={{
                    padding: '10px',
                    backgroundColor: props.params.color,
                    height: '100%',
                    boxSizing: 'border-box',
                }}
            >
                <div>hello world</div>
                <button onClick={resize}>Resize</button>
            </div>
        );
    },
};

export const Deserialization = (props: {
    orientation: Orientation;
    hideBorders: boolean;
    proportionalLayout: boolean;
    disableAutoResizing: boolean;
}) => {
    const api = React.useRef<SplitviewApi>();

    const onReady = (event: SplitviewReadyEvent) => {
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
    };

    return (
        <SplitviewReact
            onReady={onReady}
            orientation={props.orientation}
            components={components}
            disableAutoResizing={props.disableAutoResizing}
            hideBorders={props.hideBorders}
            proportionalLayout={props.proportionalLayout}
        />
    );
};

export default {
    title: 'Library/Splitview/Deserialization',
    component: Deserialization,
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
    args: {
        orientation: Orientation.VERTICAL,
        proportionalLayout: true,
        disableAutoResizing: false,
    },
    argTypes: {
        orientation: {
            control: {
                type: 'inline-radio',
                options: [Orientation.HORIZONTAL, Orientation.VERTICAL],
            },
        },
    },
} as Meta;
