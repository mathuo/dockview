import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';

const Default = (props: IDockviewPanelProps) => {
    return (
        <div style={{ height: '100%' }}>
            <div>{props.api.title}</div>
        </div>
    );
};

const components = {
    default: Default,
};

const Component = (props: { theme?: string }) => {
    const [disablePanelDrag, setDisablePanelDrag] =
        React.useState<boolean>(false);
    const [disableGroupDrag, setDisableGroupDrag] =
        React.useState<boolean>(false);
    const [disableOverlay, setDisableOverlay] = React.useState<boolean>(false);

    const [api, setApi] = React.useState<DockviewApi>();

    React.useEffect(() => {
        if (!api) {
            return;
        }

        const disposables = [
            api.onWillDragPanel((e) => {
                if (!disablePanelDrag) {
                    return;
                }
                e.nativeEvent.preventDefault();
            }),

            api.onWillDragGroup((e) => {
                if (!disableGroupDrag) {
                    return;
                }
                e.nativeEvent.preventDefault();
            }),
            api.onWillShowOverlay((e) => {
                console.log(e);

                if (!disableOverlay) {
                    return;
                }

                e.preventDefault();
            }),

            api.onWillDrop((e) => {
                //
            }),

            api.onDidDrop((e) => {
                //
            }),
        ];

        return () => {
            disposables.forEach((disposable) => {
                disposable.dispose();
            });
        };
    }, [api, disablePanelDrag, disableGroupDrag, disableOverlay]);

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);

        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            position: {
                direction: 'right',
                referencePanel: 'panel_1',
            },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: {
                direction: 'below',
                referencePanel: 'panel_1',
            },
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
        });
    };

    return (
        <div
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            <div>
                <button
                    onClick={() => setDisablePanelDrag(!disablePanelDrag)}
                >{`Panel Drag: ${
                    disablePanelDrag ? 'disabled' : 'enabled'
                }`}</button>
                <button
                    onClick={() => setDisableGroupDrag(!disableGroupDrag)}
                >{`Group Drag: ${
                    disableGroupDrag ? 'disabled' : 'enabled'
                }`}</button>
                <button
                    onClick={() => setDisableOverlay(!disableOverlay)}
                >{`Overlay: ${
                    disableOverlay ? 'disabled' : 'enabled'
                }`}</button>
            </div>
            <div style={{ flexGrow: 1 }}>
                <DockviewReact
                    className={`${props.theme || 'dockview-theme-abyss'}`}
                    onReady={onReady}
                    components={components}
                />
            </div>
        </div>
    );
};

export default Component;
