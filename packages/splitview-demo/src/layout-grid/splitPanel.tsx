import * as React from 'react';
import {
    CompositeDisposable,
    ISplitviewPanelProps,
    Orientation,
    SplitviewReadyEvent,
    SplitviewComponent,
    IComponentSplitview,
    IGroupPanelProps,
} from 'splitview';

const components = {
    default1: (props: ISplitviewPanelProps) => {
        const [focused, setFocused] = React.useState<boolean>(false);

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
            <div
                style={{ height: '100%', width: '100%' }}
            >{`component [isFocused: ${focused}]`}</div>
        );
    },
};

const SPLIT_PANEL_STATE_KEY = 'splitview_panel_state';

export const SplitPanel = (props: IGroupPanelProps) => {
    const api = React.useRef<IComponentSplitview>();

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidDimensionsChange((event) => {
                api.current?.layout(event.width, event.height - 20);
            }),
            api.current.onChange((event) => {
                props.api.setState(SPLIT_PANEL_STATE_KEY, api.current.toJSON());
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    const onReady = (event: SplitviewReadyEvent) => {
        const existingLayout = props.api.getStateKey(SPLIT_PANEL_STATE_KEY);

        if (existingLayout) {
            event.api.fromJSON(existingLayout);
        } else {
            event.api.addFromComponent({ id: '1', component: 'default1' });
            event.api.addFromComponent({ id: '2', component: 'default1' });
        }
        api.current = event.api;
    };

    const onSave = () => {
        props.api.setState(SPLIT_PANEL_STATE_KEY, api.current.toJSON());
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
            <div style={{ height: '20px', flexShrink: 0 }}>
                <button onClick={onSave}>save</button>
            </div>
            <SplitviewComponent
                components={components}
                onReady={onReady}
                orientation={Orientation.VERTICAL}
            />
        </div>
    );
};
