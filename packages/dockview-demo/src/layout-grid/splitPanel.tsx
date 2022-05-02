import * as React from 'react';
import {
    ISplitviewPanelProps,
    Orientation,
    SplitviewReadyEvent,
    SplitviewReact,
    SplitviewApi,
    IDockviewPanelProps,
} from 'dockview';
import { useLayoutRegistry } from './registry';
import './splitPanel.scss';
import { CompositeDisposable } from '../lifecycle';

const components = {
    default1: (props: ISplitviewPanelProps) => {
        const ref = React.useRef<HTMLInputElement>();
        const [focused, setFocused] = React.useState<boolean>(false);
        const [active, setActive] = React.useState<boolean>(false);

        const onClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
            props.api.setSize({ size: 300 });
        };

        React.useEffect(() => {
            const disposable = new CompositeDisposable(
                props.api.onDidFocusChange((event) => {
                    setFocused(event.isFocused);
                }),
                props.api.onDidActiveChange((event) => {
                    setActive(event.isActive);
                }),
                props.api.onFocusEvent(() => {
                    ref.current.focus();
                })
            );

            return () => {
                disposable.dispose();
            };
        }, []);

        return (
            <div style={{ height: '100%' }}>
                <div style={{ display: 'flex', padding: '5px' }}>
                    <div>This is a splitview panel inside a dockable panel</div>
                    <span style={{ flexGrow: 1 }} />
                    <button onClick={onClick}>resize</button>
                </div>
                <div style={{ padding: '0px 5px' }}>
                    <div>{`isPanelActive: ${active} isPanelFocused: ${focused}`}</div>
                    <input ref={ref} type="text" placeholder="focus test" />
                    <span>{(props as any).text}</span>
                </div>
            </div>
        );
    },
};

export const SplitPanel = (props: IDockviewPanelProps) => {
    const api = React.useRef<SplitviewApi>();
    const registry = useLayoutRegistry();

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidDimensionsChange((event) => {
                api.current?.layout(event.width, event.height - 25);
            }),
            props.api.onFocusEvent(() => {
                api.current.focus();
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    const onReady = (event: SplitviewReadyEvent) => {
        api.current = event.api;

        registry.register('splitview', event.api);

        event.api.fromJSON(require('./splitpanel.layout.json'));
        return;
        event.api.addPanel({
            id: '1',
            component: 'default1',
            snap: true,
            params: {
                text: 'hiya',
            },
        });
        event.api.addPanel({ id: '2', component: 'default1' });
    };

    const onUpdateProps = () => {
        const panel = api.current.getPanel('1');
        panel.update({ params: { text: Date.now().toString() } });
    };

    const onAdd = () => {
        api.current.addPanel({
            id: `${Date.now()}`,
            component: 'default1',
            snap: true,
            params: {
                text: 'hiya',
            },
        });
    };

    const onRemove = () => {
        const panels = api.current.panels;
        if (panels.length === 0) {
            return;
        }
        api.current.removePanel(panels[panels.length - 1]);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                color: 'white',
            }}
        >
            <div style={{ height: '25px' }}>
                <button onClick={onUpdateProps}>Update props</button>
                <button onClick={onAdd}>Add</button>
                <button onClick={onRemove}>Remove</button>
            </div>
            <SplitviewReact
                components={components}
                onReady={onReady}
                orientation={Orientation.VERTICAL}
            />
        </div>
    );
};
