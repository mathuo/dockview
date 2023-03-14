import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    IWatermarkPanelProps,
    Orientation,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
};

const counter = (() => {
    let i = 0;

    return {
        next: () => ++i,
    };
})();

const Watermark = (props: IWatermarkPanelProps) => {
    const isGroup = props.containerApi.groups.length > 0;

    const addPanel = () => {
        props.containerApi.addPanel({
            id: counter.next().toString(),
            component: 'default',
        });
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <span>
                    This is a custom watermark. You can put whatever React
                    component you want here
                </span>
                <span>
                    <button onClick={addPanel}>Add New Panel</button>
                </span>
                {isGroup && (
                    <span>
                        <button
                            onClick={() => {
                                props.close();
                            }}
                        >
                            Close Group
                        </button>
                    </span>
                )}
            </div>
        </div>
    );
};

const DockviewWatermark = () => {
    const [api, setApi] = React.useState<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        // event.api.addPanel({
        //     id: 'panel_1',
        //     component: 'default',
        // });

        event.api.fromJSON({
            grid: {
                orientation: Orientation.HORIZONTAL,
                root: { type: 'branch', data: [] },
                height: 100,
                width: 100,
            },
            panels: {},
        });

        setApi(event.api);
    };

    const onClick = () => {
        if (!api) {
            return;
        }

        api.addGroup();
    };

    return (
        <div
            style={{
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div>
                <button onClick={onClick}>Add Empty Group</button>
            </div>
            <DockviewReact
                onReady={onReady}
                components={components}
                watermarkComponent={Watermark}
                className="dockview-theme-abyss nested-dockview"
            />
        </div>
    );
};

export default DockviewWatermark;
