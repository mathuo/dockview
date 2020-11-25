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
            <div style={{ backgroundColor: props.color, height: '100%' }}>
                hello world
            </div>
        );
    },
};

export const Vertical = () => {
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

    React.useEffect(() => {
        window.addEventListener('resize', () => {
            api.current?.layout(window.innerWidth, window.innerHeight);
        });
    }, []);

    return (
        <SplitviewReact
            onReady={onReady}
            orientation={Orientation.VERTICAL}
            components={components}
        />
    );
};

export default {
    title: 'Splitview',
    component: Vertical,
    decorators: [
        (Component) => {
            document.body.style.padding = '0px';
            return (
                <div style={{ height: '100vh' }}>
                    <Component />
                </div>
            );
        },
    ],
} as Meta;
