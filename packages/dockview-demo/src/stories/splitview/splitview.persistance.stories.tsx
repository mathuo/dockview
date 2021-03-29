import {
    ISplitviewPanelProps,
    Orientation,
    PanelCollection,
    SerializedSplitview,
    SplitviewApi,
    SplitviewReact,
    SplitviewReadyEvent,
} from 'dockview';
import * as React from 'react';
import { Story, Meta } from '@storybook/react';

const components: PanelCollection<ISplitviewPanelProps> = {
    default: (props) => {
        const resize = () => {
            props.api.setSize({ size: 300 });
        };

        return (
            <div
                style={{
                    padding: '10px',
                    backgroundColor: props.color,
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

export const Persistance = (props: {
    orientation: Orientation;
    hideBorders: boolean;
    proportionalLayout: boolean;
    disableAutoResizing: boolean;
}) => {
    const api = React.useRef<SplitviewApi>();

    const onReady = (event: SplitviewReadyEvent) => {
        api.current = event.api;

        event.api.onDidLayoutChange(() => {
            const state = event.api.toJSON();
            localStorage.setItem(
                'splitview.test.layout',
                JSON.stringify(state)
            );
            console.log(JSON.stringify(state, null, 4));
        });

        const state = localStorage.getItem('splitview.test.layout');
        if (state) {
            event.api.fromJSON(JSON.parse(state) as SerializedSplitview);
            return;
        }

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
    title: 'Library/Splitview/Persistance',
    component: Persistance,
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
