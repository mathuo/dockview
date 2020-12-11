import {
    CompositeDisposable,
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    GroupChangeKind,
    IDockviewPanelProps,
    IWatermarkPanelProps,
    PanelCollection,
} from 'dockview';
import * as React from 'react';
import { Meta } from '@storybook/react';
import 'dockview/dist/styles.css';

const components: PanelCollection<IDockviewPanelProps> = {
    default: (props) => {
        return (
            <div style={{ padding: '10px', height: '100%' }}>hello world</div>
        );
    },
};

export const Simple = (props: {
    onEvent: (name: string) => void;
    theme: string;
    hideBorders: boolean;
}) => {
    const api = React.useRef<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        event.api.layout(window.innerWidth, window.innerHeight);
        api.current = event.api;

        event.api.onGridEvent((e) => props.onEvent(e.kind));

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

    React.useEffect(() => {
        window.addEventListener('resize', () => {
            api.current?.layout(window.innerWidth, window.innerHeight);
        });
    }, []);

    return (
        <DockviewReact
            className={props.theme}
            onReady={onReady}
            components={components}
            hideBorders={props.hideBorders}
        />
    );
};

const Watermark = (props: IWatermarkPanelProps) => {
    const [size, setSize] = React.useState<number>(props.containerApi.size);
    const [panels, setPanels] = React.useState<number>(
        props.containerApi.totalPanels
    );

    React.useEffect(() => {
        const disposables = new CompositeDisposable(
            props.containerApi.onGridEvent((event) => {
                switch (event.kind) {
                    case GroupChangeKind.ADD_GROUP:
                    case GroupChangeKind.REMOVE_GROUP:
                    case GroupChangeKind.ADD_PANEL:
                    case GroupChangeKind.REMOVE_PANEL:
                        setSize(props.containerApi.size);
                        setPanels(props.containerApi.totalPanels);
                        break;
                }
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

export const CustomWatermark = (props: {
    onEvent: (name: string) => void;
    theme: string;
    hideBorders: boolean;
}) => {
    const api = React.useRef<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        event.api.layout(window.innerWidth, window.innerHeight);
        api.current = event.api;

        event.api.onGridEvent((e) => props.onEvent(e.kind));

        event.api.addEmptyGroup();
    };

    React.useEffect(() => {
        window.addEventListener('resize', () => {
            api.current?.layout(window.innerWidth, window.innerHeight);
        });
    }, []);

    return (
        <DockviewReact
            className={props.theme}
            onReady={onReady}
            components={components}
            hideBorders={props.hideBorders}
            watermarkComponent={Watermark}
        />
    );
};

export default {
    title: 'Dockview',
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
