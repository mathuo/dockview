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

const components = {
    default1: (props: ISplitviewPanelProps) => {
        const [focused, setFocused] = React.useState<boolean>(false);

        const onClick = () => {
            props.api.setSize({ size: 300 });
        };

        React.useEffect(() => {
            const disposable = new CompositeDisposable(
                props.api.onDidFocusChange((event) => {
                    setFocused(event.isFocused);
                })
            );

            return () => {
                disposable.dispose();
            };
        }, []);

        return (
            <div style={{ height: '100%', width: '100%' }}>
                {`component [isFocused: ${focused}]`}
                <button onClick={onClick}>resize</button>
                <span>{(props as any).text}</span>
            </div>
        );
    },
};

const SPLIT_PANEL_STATE_KEY = 'splitview_panel_state';

export const SplitPanel = (props: IGroupPanelProps) => {
    const api = React.useRef<SplitviewApi>();

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidDimensionsChange((event) => {
                api.current?.layout(event.width, event.height);
            }),
            api.current.onDidLayoutChange(() => {
                props.api.setState(SPLIT_PANEL_STATE_KEY, api.current.toJSON());
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    const onReady = (event: SplitviewReadyEvent) => {
        api.current = event.api;

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
