import * as React from 'react';
import {
    IGridviewPanelProps,
    PaneviewComponent,
    PaneviewReadyEvent,
    IPaneviewPanelProps,
    CompositeDisposable,
    PaneviewApi,
} from 'splitview';
import { ControlCenter } from './controlCenter';

const DefaultHeader = (props: IPaneviewPanelProps) => {
    const [url, setUrl] = React.useState<string>(
        props.api.isExpanded
            ? 'https://fonts.gstatic.com/s/i/materialicons/expand_more/v6/24px.svg'
            : 'https://fonts.gstatic.com/s/i/materialicons/chevron_right/v7/24px.svg'
    );
    const onClick = () => {
        props.api.setExpanded(!props.api.isExpanded);
    };

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidExpansionChange((event) => {
                setUrl(
                    event.isExpanded
                        ? 'https://fonts.gstatic.com/s/i/materialicons/expand_more/v6/24px.svg'
                        : 'https://fonts.gstatic.com/s/i/materialicons/chevron_right/v7/24px.svg'
                );
            })
        );

        return () => {
            disposable.dispose();
        };
    });

    return (
        <div
            style={{
                display: 'flex',
                fontSize: '11px',
                textTransform: 'uppercase',
                cursor: 'pointer',
            }}
            onClick={onClick}
        >
            <div style={{ width: '20px' }}>
                <a
                    style={{
                        WebkitMask: `url(${url}) 50% 50% / 100% 100% no-repeat`,
                        height: '100%',
                        display: 'block',
                        backgroundColor: 'lightgray',
                    }}
                />
            </div>
            <span>{props.title}</span>
        </div>
    );
};

const components = {
    default: (props: IPaneviewPanelProps) => {
        return <div style={{ height: '100%' }}>This is an example panel</div>;
    },
    controlCenter: ControlCenter,
};

const headerComponents = {
    default: DefaultHeader,
};

export const Sidebar = (props: IGridviewPanelProps) => {
    const api = React.useRef<PaneviewApi>();

    const onReady = (event: PaneviewReadyEvent) => {
        api.current = event.api;

        event.api.fromJSON(require('./sidebar.layout.json'));

        return;

        event.api.addFromComponent({
            id: '1',
            component: 'controlCenter',
            params: {},
            headerComponent: 'default1',
            title: 'Control Center',
        });
        event.api.addFromComponent({
            id: '2',
            component: 'default',
            params: {},
            headerComponent: 'default1',
            title: 'Panel 1',
        });
        event.api.addFromComponent({
            id: '3',
            component: 'default',
            params: {},
            headerComponent: 'default1',
            title: 'Panel 2',
        });
        event.api.addFromComponent({
            id: '4',
            component: 'default',
            params: {},
            headerComponent: 'default1',
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
            props.api.onFocusEvent(() => {
                api.current.focus();
            })
        );

        return () => {
            disposable.dispose();
        };
    });

    return (
        <div
            style={{
                backgroundColor: 'rgb(37,37,38)',
            }}
        >
            <PaneviewComponent
                headerComponents={headerComponents}
                components={components}
                onReady={onReady}
            />
        </div>
    );
};
