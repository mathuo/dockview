import {
    GridviewApi,
    GridviewReact,
    GridviewReadyEvent,
    IGridviewPanelProps,
    Orientation,
    PanelCollection,
} from 'dockview';
import * as React from 'react';
import { Meta } from '@storybook/react';

const components: PanelCollection<IGridviewPanelProps<any>> = {
    default: (props) => {
        return (
            <div style={{ padding: '10px', height: '100%' }}>hello world</div>
        );
    },
    ticker: (props: IGridviewPanelProps<{ ticker: number }>) => {
        return (
            <div style={{ padding: '10px', height: '100%' }}>
                {`The current ticker value is ${props.params.ticker}`}
            </div>
        );
    },
};

export const Params = (props: {
    theme: string;
    hideBorders: boolean;
    disableAutoResizing: boolean;
}) => {
    const api = React.useRef<GridviewApi>();

    React.useEffect(() => {
        if (!api.current) {
            return () => {
                // noop
            };
        }

        const gridApi = api.current;

        const interval = setInterval(() => {
            const panel1 = gridApi.getPanel('panel1');

            panel1.update({ params: { ticker: Date.now() } });
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, [api]);

    const onReady = (event: GridviewReadyEvent) => {
        api.current = event.api;

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
        });
    };

    return (
        <GridviewReact
            orientation={Orientation.HORIZONTAL}
            className={props.theme}
            onReady={onReady}
            components={components}
            hideBorders={props.hideBorders}
            disableAutoResizing={props.disableAutoResizing}
        />
    );
};

export default {
    title: 'Library/Gridview/Params',
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
    },
} as Meta;
