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

const components: PanelCollection<ISplitviewPanelProps<any>> = {
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

export const Simple = (props: {
    orientation: Orientation;
    hideBorders: boolean;
    proportionalLayout: boolean;
    disableAutoResizing: boolean;
}) => {
    const api = React.useRef<SplitviewApi>();

    const onReady = (event: SplitviewReadyEvent) => {
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

    return (
        <SplitviewReact
            onReady={onReady}
            orientation={props.orientation}
            components={components}
            hideBorders={props.hideBorders}
            proportionalLayout={props.proportionalLayout}
            disableAutoResizing={props.disableAutoResizing}
        />
    );
};

export default {
    title: 'Library/Splitview/Simple',
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
