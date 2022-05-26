import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    IWatermarkPanelProps,
    PanelCollection,
} from 'dockview';
import { CompositeDisposable } from '../../lifecycle';
import * as React from 'react';
import { Meta } from '@storybook/react';

const components: PanelCollection<IDockviewPanelProps> = {
    default: (props) => {
        return (
            <div style={{ padding: '10px', height: '100%' }}>hello world</div>
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

const WatermarkPanel = (props: IWatermarkPanelProps) => {
    const [size, setSize] = React.useState<number>(props.containerApi.size);
    const [panels, setPanels] = React.useState<number>(
        props.containerApi.totalPanels
    );

    React.useEffect(() => {
        const disposables = new CompositeDisposable(
            props.containerApi.onDidAddGroup((event) => {
                setSize(props.containerApi.size);
            }),
            props.containerApi.onDidRemoveGroup((event) => {
                setSize(props.containerApi.size);
            }),
            props.containerApi.onDidAddPanel((event) => {
                setPanels(props.containerApi.totalPanels);
            }),
            props.containerApi.onDidRemovePanel((event) => {
                setPanels(props.containerApi.totalPanels);
            })
        );

        return () => {
            disposables.dispose();
        };
    }, []);

    const onClick = () => {
        props.containerApi.addPanel({
            id: Date.now().toString(),
            component: 'default',
            position: { direction: 'right' },
        });
    };
    const onReplace = () => {
        props.containerApi.addPanel({
            id: Date.now().toString(),
            component: 'default',
        });
    };

    const onAddEmptyGroup = () => {
        props.containerApi.addEmptyGroup();
    };

    return (
        <div style={{ margin: '10px' }}>
            <ul>
                <li>
                    This is a custom watermark for when a group has no panels to
                    display.
                </li>
                <li>
                    The watermark is only automatically shown when there are no
                    panels to display. You can otherwise add a watermark
                    programatically.
                </li>
            </ul>
            <div>{`Total groups: ${size}`}</div>
            <div>{`Total panels: ${panels}`}</div>
            <button onClick={onClick}>Add</button>
            <button onClick={onReplace}>Replace</button>
            <button onClick={onAddEmptyGroup}>Empty</button>
            {size > 1 && <button onClick={props.close}>Close</button>}
        </div>
    );
};

export const Watermark = (props: {
    theme: string;
    hideBorders: boolean;
    disableAutoResizing: boolean;
}) => {
    const api = React.useRef<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        api.current = event.api;

        event.api.addEmptyGroup();
    };

    return (
        <DockviewReact
            className={props.theme}
            onReady={onReady}
            components={components}
            hideBorders={props.hideBorders}
            watermarkComponent={WatermarkPanel}
            disableAutoResizing={props.disableAutoResizing}
        />
    );
};

export default {
    title: 'Library/Dockview/Watermark',
    component: Watermark,
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
