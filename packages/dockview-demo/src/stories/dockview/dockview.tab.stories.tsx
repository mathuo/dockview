import {
    DockviewApi,
    DockviewComponents,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    PanelCollection,
} from 'dockview';
import * as React from 'react';
import { Meta } from '@storybook/react';

const components: PanelCollection<IDockviewPanelProps> = {
    default: (props) => {
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
                        <span style={{ fontSize: '9px' }}>
                            {'(Custom tab component)'}
                        </span>
                        {!props.api.suppressClosable && (
                            <span onClick={close}>X</span>
                        )}
                    </div>
                </DockviewComponents.Tab>
                <DockviewComponents.Content>
                    <div style={{ padding: '10px', height: '100%' }}>
                        hello world
                    </div>
                </DockviewComponents.Content>
            </DockviewComponents.Panel>
        );
    },
};

export const Tab = (props: {
    theme: string;
    hideBorders: boolean;
    disableAutoResizing: boolean;
}) => {
    const api = React.useRef<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        api.current = event.api;

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
    title: 'Library/Dockview/Tab',
    component: Tab,
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
    },
} as Meta;
