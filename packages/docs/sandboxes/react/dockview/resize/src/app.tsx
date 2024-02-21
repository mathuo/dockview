import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';
import './resize.scss';

const Default = (props: IDockviewPanelProps) => {
    const [width, setWidth] = React.useState<number>(100);
    const [height, setHeight] = React.useState<number>(100);

    return (
        <div className="resize-panel">
            <div style={{ height: '25px' }}>{props.api.title}</div>
            <div className="resize-control">
                <span>Width:</span>
                <input
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    type="number"
                    min={50}
                    step={1}
                />
                <button
                    style={{ width: '100px' }}
                    onClick={() => {
                        props.api.group.api.setSize({
                            width,
                        });
                    }}
                >
                    Resize Group
                </button>
                <button
                    style={{ width: '100px' }}
                    onClick={() => {
                        props.api.setSize({
                            width,
                        });
                    }}
                >
                    Resize panel
                </button>
            </div>
            <div className="resize-control">
                <span>Height:</span>
                <input
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    type="number"
                    min={50}
                    step={1}
                />
                <button
                    style={{ width: '100px' }}
                    onClick={() => {
                        props.api.group.api.setSize({
                            height,
                        });
                    }}
                >
                    Resize Group
                </button>
                <button
                    style={{ width: '100px' }}
                    onClick={() => {
                        props.api.setSize({
                            height,
                        });
                    }}
                >
                    Resize Panel
                </button>
            </div>
        </div>
    );
};

const components = {
    default: Default,
};

const ResizeDockview = (props: { theme?: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
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
        <DockviewReact
            className={`${props.theme || 'dockview-theme-abyss'}`}
            onReady={onReady}
            components={components}
        />
    );
};

export default ResizeDockview;
