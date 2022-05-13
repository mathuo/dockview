import * as React from 'react';
import {
    IGridviewPanelProps,
    PaneviewReact,
    PaneviewReadyEvent,
    IPaneviewPanelProps,
    PaneviewApi,
    PaneviewDropEvent,
} from 'dockview';
import { ControlCenter } from './controlCenter';
import './sidebar.scss';
import { CompositeDisposable } from '../lifecycle';

const components = {
    default: (props: IPaneviewPanelProps) => {
        return <div style={{ height: '100%' }}>This is an example panel</div>;
    },
    controlCenter: ControlCenter,
};

export const Sidebar = (props: IGridviewPanelProps) => {
    const api = React.useRef<PaneviewApi>();

    const onReady = (event: PaneviewReadyEvent) => {
        api.current = event.api;

        console.log(props.api.width, props.api.height);

        event.api.fromJSON(require('./sidebar.layout.json'));

        return;

        event.api.addPanel({
            id: '1',
            component: 'controlCenter',
            title: 'Control Center',
        });
        event.api.addPanel({
            id: '2',
            component: 'default',
            title: 'Panel 1',
        });
        event.api.addPanel({
            id: '3',
            component: 'default',
            title: 'Panel 2',
        });
        event.api.addPanel({
            id: '4',
            component: 'default',
            title: 'Panel 3',
        });

        setTimeout(() => {
            console.log(JSON.stringify(event.api.toJSON(), null, 4));
        }, 10000);
    };

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidDimensionsChange((ev) => {
                api.current.layout(ev.width, ev.height);
            }),
            props.api.onDidVisibilityChange((event) => {
                console.log(event);
            }),
            props.api.onDidFocusChange(({ isFocused }) => {
                if (isFocused) {
                    api.current.focus();
                }
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    const onDidDrop = React.useCallback((event: PaneviewDropEvent) => {
        console.log('drop', event);
    }, []);

    return (
        <div
            style={{
                backgroundColor: 'rgb(37,37,38)',
                height: '100%',
            }}
        >
            <PaneviewReact
                components={components}
                onReady={onReady}
                onDidDrop={onDidDrop}
            />
        </div>
    );
};
