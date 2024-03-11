import {
    DockviewApi,
    DockviewDndOverlayEvent,
    DockviewDidDropEvent,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    positionToDirection,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return (
            <div style={{ padding: '20px' }}>
                <div>{props.params.title}</div>
            </div>
        );
    },
};

const DraggableElement = () => (
    <span
        tabIndex={-1}
        onDragStart={(event) => {
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';

                event.dataTransfer.setData('text/plain', 'nothing');
            }
        }}
        style={{
            backgroundColor: 'orange',
            padding: '0px 8px',
            borderRadius: '4px',
            width: '100px',
            cursor: 'pointer',
        }}
        draggable={true}
    >
        Drag me into the dock
    </span>
);

const DndDockview = (props: { renderVisibleOnly: boolean; theme?: string }) => {
    const [api, setApi] = React.useState<DockviewApi>();

    React.useEffect(() => {
        if (!api) {
            return;
        }

        api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
        });

        api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
        });

        api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
        });

        api.addPanel({
            id: 'panel_4',
            component: 'default',
            params: {
                title: 'Panel 4',
            },
            position: { referencePanel: 'panel_1', direction: 'right' },
        });

        const panelDragDisposable = api.onWillDragPanel((event) => {
            const dataTransfer = event.nativeEvent.dataTransfer;

            if (dataTransfer) {
                dataTransfer.setData(
                    'text/plain',
                    'Some custom panel data transfer data'
                );
                dataTransfer.setData(
                    'text/json',
                    '{text: "Some custom panel data transfer data"}'
                );
            }
        });

        const groupDragDisposable = api.onWillDragGroup((event) => {
            const dataTransfer = event.nativeEvent.dataTransfer;

            if (dataTransfer) {
                dataTransfer.setData(
                    'text/plain',
                    'Some custom group data transfer data'
                );
                dataTransfer.setData(
                    'text/json',
                    '{text: "Some custom group data transfer data"}'
                );
            }
        });

        return () => {
            panelDragDisposable.dispose();
            groupDragDisposable.dispose();
        };
    }, [api]);

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);
    };

    const onDidDrop = (event: DockviewDidDropEvent) => {
        event.api.addPanel({
            id: 'test',
            component: 'default',
            position: {
                direction: positionToDirection(event.position),
                referenceGroup: event.group || undefined,
            },
        });
    };

    const showDndOverlay = (event: DockviewDndOverlayEvent) => {
        return true;
    };

    const onDrop = (event: React.DragEvent) => {
        const dataTransfer = event.dataTransfer;

        let text = 'The following dataTransfer data was found:\n';

        for (let i = 0; i < dataTransfer.items.length; i++) {
            const item = dataTransfer.items[i];
            const value = dataTransfer.getData(item.type);
            text += `type=${item.type},data=${value}\n`;
        }

        alert(text);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            <div style={{ margin: '2px 0px' }}>
                <DraggableElement />
                <div
                    style={{
                        padding: '0px 4px',
                        backgroundColor: 'black',
                        borderRadius: '2px',
                        color: 'white',
                    }}
                    onDrop={onDrop}
                >
                    Drop a tab or group here to inspect the attached metadata
                </div>
            </div>
            <DockviewReact
                components={components}
                onReady={onReady}
                className={`${props.theme || 'dockview-theme-abyss'}`}
                onDidDrop={onDidDrop}
                showDndOverlay={showDndOverlay}
                rootOverlayModel={{
                    size: { value: 100, type: 'pixels' },
                    activationSize: { value: 5, type: 'percentage' },
                }}
            />
        </div>
    );
};

export default DndDockview;
