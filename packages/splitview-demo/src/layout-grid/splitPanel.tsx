import * as React from 'react';
import {
    CompositeDisposable,
    ISplitviewPanelProps,
    Orientation,
    SplitviewReadyEvent,
    SplitviewComponent,
    IGroupPanelProps,
    SplitviewApi,
} from 'splitview';
import { useLayoutRegistry } from './registry';
import './splitPanel.scss';

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
            <div style={{ height: '100%', width: '100%' }}>
                {`[isFocused: ${focused} isActive: ${active}]`}
                <button onClick={onClick}>resize</button>
                <input ref={ref} type="text" placeholder="focus test" />
                <span>{(props as any).text}</span>
            </div>
        );
    },
};

const SPLIT_PANEL_STATE_KEY = 'splitview_panel_state';

export const SplitPanel = (props: IGroupPanelProps) => {
    const api = React.useRef<SplitviewApi>();
    const registry = useLayoutRegistry();

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidDimensionsChange((event) => {
                api.current?.layout(event.width, event.height);
            }),
            api.current.onDidLayoutChange(() => {
                props.api.setState(SPLIT_PANEL_STATE_KEY, api.current.toJSON());
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

        const existingLayout = props.api.getStateKey(SPLIT_PANEL_STATE_KEY);

        event.api.fromJSON(require('./splitpanel.layout.json'));
        return;
        event.api.addFromComponent({
            id: '1',
            component: 'default1',
            snap: true,
            params: {
                text: 'hiya',
            },
        });
        event.api.addFromComponent({ id: '2', component: 'default1' });
    };

    const onSave = () => {
        props.api.setState(SPLIT_PANEL_STATE_KEY, api.current.toJSON());
        console.log(JSON.stringify(api.current.toJSON(), null, 4));
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
            <SplitviewComponent
                components={components}
                onReady={onReady}
                orientation={Orientation.VERTICAL}
            />
        </div>
    );
};
