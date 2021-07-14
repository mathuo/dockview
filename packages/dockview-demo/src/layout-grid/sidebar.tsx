import * as React from 'react';
import {
    IGridviewPanelProps,
    PaneviewReact,
    PaneviewReadyEvent,
    IPaneviewPanelProps,
    CompositeDisposable,
    PaneviewApi,
    PaneviewDropEvent,
} from 'dockview';
import { ControlCenter } from './controlCenter';
import { toggleClass } from '../dom';
import './sidebar.scss';

const DefaultHeader = (props: IPaneviewPanelProps) => {
    const ref = React.useRef<HTMLDivElement>();
    const mouseover = React.useRef<boolean>();

    const [url, setUrl] = React.useState<string>(
        props.api.isExpanded
            ? 'https://fonts.gstatic.com/s/i/materialicons/expand_more/v6/24px.svg'
            : 'https://fonts.gstatic.com/s/i/materialicons/chevron_right/v7/24px.svg'
    );

    const toggle = () => {
        toggleClass(
            ref.current,
            'within',
            props.api.isExpanded && mouseover.current
        );
    };

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidExpansionChange((event) => {
                setUrl(
                    event.isExpanded
                        ? 'https://fonts.gstatic.com/s/i/materialicons/expand_more/v6/24px.svg'
                        : 'https://fonts.gstatic.com/s/i/materialicons/chevron_right/v7/24px.svg'
                );
                toggle();
            }),
            props.api.onMouseEnter((ev) => {
                mouseover.current = true;
                toggle();
            }),
            props.api.onMouseLeave((ev) => {
                mouseover.current = false;
                toggle();
            })
        );

        return () => {
            disposable.dispose();
        };
    });

    const onClick = (event: React.MouseEvent) => {
        if (event.defaultPrevented) {
            return;
        }
        props.api.setExpanded(!props.api.isExpanded);
    };

    const onClickAction = (event: React.MouseEvent) => {
        event.preventDefault();
    };

    return (
        <div
            className="my-header"
            ref={ref}
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
            <span style={{ flexGrow: 1 }} />
            <div className="actions">
                <div
                    onClick={onClickAction}
                    style={{
                        height: '100%',
                        width: '20px',
                    }}
                >
                    <a
                        title="Example action"
                        style={{
                            WebkitMask: `url(https://fonts.gstatic.com/s/i/materialicons/help_outline/v6/24px.svg) 50% 50% / 80% 80% no-repeat`,
                            height: '100%',
                            display: 'block',
                            backgroundColor: 'lightgray',
                        }}
                    />
                </div>
            </div>
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

        console.log(props.api.width, props.api.height);

        event.api.fromJSON(require('./sidebar.layout.json'));

        return;

        event.api.addPanel({
            id: '1',
            component: 'default',
            headerComponent: 'default',
            title: 'Control Center',
        });
        event.api.addPanel({
            id: '2',
            component: 'default',
            headerComponent: 'default',
            title: 'Panel 1',
        });
        event.api.addPanel({
            id: '3',
            component: 'default',
            headerComponent: 'default',
            title: 'Panel 2',
        });
        event.api.addPanel({
            id: '4',
            component: 'default',
            headerComponent: 'default',
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
                headerComponents={headerComponents}
                components={components}
                onReady={onReady}
                onDidDrop={onDidDrop}
            />
        </div>
    );
};
