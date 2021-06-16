import {
    CompositeDisposable,
    DockviewApi,
    DockviewComponents,
    DockviewReact,
    DockviewReadyEvent,
    GroupChangeKind,
    IDockviewPanelProps,
    IWatermarkPanelProps,
    PanelCollection,
} from 'dockview';
import * as React from 'react';
import { Meta } from '@storybook/react';

const components: PanelCollection<IDockviewPanelProps<any>> = {
    default: (props) => {
        return (
            <div style={{ padding: '10px', height: '100%' }}>hello world</div>
        );
    },
    ticker: (props: IDockviewPanelProps<{ ticker: number }>) => {
        const close = () => props.api.close();
        return (
            <DockviewComponents.Panel>
                <DockviewComponents.Tab>
                    <div
                        style={{
                            border: '1px solid pink',
                            height: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0px 8px',
                            width: '200px',
                        }}
                    >
                        <span>{props.api.title}</span>
                        <span
                            style={{ fontSize: '9px' }}
                        >{`(${props.params.ticker})`}</span>
                        {!props.api.suppressClosable && (
                            <span onClick={close}>X</span>
                        )}
                    </div>
                </DockviewComponents.Tab>
                <DockviewComponents.Body>
                    <div style={{ padding: '10px', height: '100%' }}>
                        {`The current ticker value is ${props.params.ticker}`}
                    </div>
                </DockviewComponents.Body>
            </DockviewComponents.Panel>
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

export const Params = (props: {
    onEvent: (name: string) => void;
    theme: string;
    hideBorders: boolean;
    disableAutoResizing: boolean;
}) => {
    const api = React.useRef<DockviewApi>();

    React.useEffect(() => {
        if (!api.current) {
            return () => {
                // noop
            };
        }

        const gridApi = api.current;

        const interval = setInterval(() => {
            const panel1 = gridApi.getPanel('panel1');
            const panel2 = gridApi.getPanel('panel2');

            panel1.update({ params: { params: { ticker: Date.now() } } });

            panel2.api.setTitle(`Panel2 ${Date.now()}`);
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, [api]);

    const onReady = (event: DockviewReadyEvent) => {
        api.current = event.api;

        event.api.onGridEvent((e) => props.onEvent(e.kind));

        event.api.addPanel({
            id: 'panel1',
            component: 'ticker',
            params: {
                ticker: 0,
            },
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
    title: 'Library/Dockview/Params',
    component: Params,
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
