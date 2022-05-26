import {
    GridviewApi,
    GridviewReact,
    GridviewReadyEvent,
    IGridviewPanelProps,
    Orientation,
    orthogonal,
    PanelCollection,
} from 'dockview';
import * as React from 'react';
import { Meta } from '@storybook/react';

const components: PanelCollection<IGridviewPanelProps<any>> = {
    default: (props: IGridviewPanelProps<{ color: string }>) => {
        const transpose = () => {
            props.containerApi.orientation = orthogonal(
                props.containerApi.orientation
            );
        };

        const resizeWidth = () => {
            props.api.setSize({ width: 300 });
        };

        const resizeHeight = () => {
            props.api.setSize({ height: 300 });
        };

        return (
            <div
                style={{
                    padding: '10px',
                    backgroundColor: props.params.color,
                    height: '100%',
                }}
            >
                <div>{'hello world'}</div>
                <button onClick={transpose}>Transpose</button>
                <button onClick={resizeWidth}>Resize width</button>
                <button onClick={resizeHeight}>Resize height</button>
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
    const api = React.useRef<GridviewApi>();

    const onReady = (event: GridviewReadyEvent) => {
        api.current = event.api;

        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: { color: 'red' },
            minimumHeight: 50,
            minimumWidth: 50,
            location: [0],
        });
        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: { color: 'green' },
            minimumHeight: 50,
            minimumWidth: 50,
            location: [0, 0],
        });
        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: { color: 'purple' },
            minimumHeight: 50,
            minimumWidth: 50,
            location: [0, 0, 0],
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            params: { color: 'yellow' },
            minimumHeight: 50,
            minimumWidth: 50,
            location: [0, 0, 0, 0],
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            params: { color: 'dodgerblue' },
            minimumHeight: 50,
            minimumWidth: 50,
            location: [0, 0, 0, 0, 0],
        });
    };

    return (
        <GridviewReact
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
    title: 'Library/Gridview/Simple',
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
