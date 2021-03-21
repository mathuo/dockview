import {
    PanelCollection,
    PaneviewReact,
    PaneviewApi,
    PaneviewReadyEvent,
    IPaneviewPanelProps,
    SerializedPaneview,
    PanelConstraintChangeEvent,
    CompositeDisposable,
    PanelDimensionChangeEvent,
    ExpansionEvent,
    FocusEvent,
    ActiveEvent,
} from 'dockview';
import * as React from 'react';
import { Story, Meta } from '@storybook/react';
import 'dockview/dist/styles.css';

const components: PanelCollection<IPaneviewPanelProps> = {
    default: (props) => {
        const [constraints, setConstraints] = React.useState<
            PanelConstraintChangeEvent
        >();
        const [dimensions, setDimensions] = React.useState<
            PanelDimensionChangeEvent
        >();
        const [expansionState, setExpansionState] = React.useState<
            ExpansionEvent
        >();
        const [active, setActive] = React.useState<ActiveEvent>();
        const [focus, setFocus] = React.useState<FocusEvent>();

        React.useEffect(() => {
            const disposables = new CompositeDisposable(
                props.api.onDidConstraintsChange(setConstraints),
                props.api.onDidDimensionsChange(setDimensions),
                props.api.onDidExpansionChange(setExpansionState),
                props.api.onDidActiveChange(setActive),
                props.api.onDidFocusChange(setFocus)
            );

            return () => {
                disposables.dispose();
            };
        }, []);

        const resize = () => {
            props.api.setSize({ size: 300 });
        };

        return (
            <div
                style={{
                    padding: '10px',
                    backgroundColor: props.color,
                    boxSizing: 'border-box',
                    height: '100%',
                }}
            >
                <div
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}
                >
                    <div>Contraints:</div>
                    <div>{`maximumSize: ${constraints?.maximumSize} minimumSize: ${constraints?.minimumSize}`}</div>
                    <div>Dimesions:</div>
                    <div>{`width: ${dimensions?.width} height: ${dimensions?.height}`}</div>
                    <div>Expansion:</div>
                    <div>{`expanded: ${expansionState?.isExpanded}`}</div>
                    <div>Active:</div>
                    <div>{`active: ${active?.isActive}`}</div>
                    <div>Focus:</div>
                    <div>{`focused: ${focus?.isFocused}`}</div>
                </div>
                <button onClick={resize}>Resize</button>
            </div>
        );
    },
};

export const Simple = (props: {
    theme: string;
    disableAutoResizing: boolean;
}) => {
    const api = React.useRef<PaneviewApi>();

    const onReady = (event: PaneviewReadyEvent) => {
        event.api.layout(window.innerWidth, window.innerHeight);
        api.current = event.api;

        event.api.addPanel({
            id: 'panel1',
            component: 'default',
            params: { color: 'red' },
            title: 'Panel1',
            minimumBodySize: 100,
        });
        event.api.addPanel({
            id: 'panel2',
            component: 'default',
            params: { color: 'green' },
            title: 'Panel 2',
            minimumBodySize: 100,
        });
        event.api.addPanel({
            id: 'panel3',
            component: 'default',
            params: { color: 'purple' },
            title: 'Panel 3',
            minimumBodySize: 100,
        });
    };

    React.useEffect(() => {
        window.addEventListener('resize', () => {
            api.current?.layout(window.innerWidth, window.innerHeight);
        });
    }, []);

    return (
        <PaneviewReact
            className={props.theme}
            onReady={onReady}
            components={components}
            disableAutoResizing={props.disableAutoResizing}
        />
    );
};


export default {
    title: 'Paneview/Simple',
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
    args: { theme: 'dockview-theme-light', disableAutoResizing: false },
    argTypes: {
        theme: {
            control: {
                type: 'select',
                options: ['dockview-theme-dark', 'dockview-theme-light'],
            },
        },
    },
} as Meta;
 