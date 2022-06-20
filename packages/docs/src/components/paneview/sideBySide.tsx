import {
    IPaneviewPanelProps,
    PaneviewDropEvent,
    PaneviewReact,
    PaneviewReadyEvent,
    PaneviewDndOverlayEvent,
} from 'dockview';
import * as React from 'react';
import { Console, Line } from '../console/console';
import './sideBySide.scss';

const components = {
    default: (props: IPaneviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    padding: '10px',
                    height: '100%',
                    backgroundColor: 'rgb(60,60,60)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
};

export const SideBySidePaneview = () => {
    const [checked, setChecked] = React.useState<boolean>(false);
    const [lines, setLines] = React.useState<Line[]>([]);

    const onReady = (event: PaneviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
            title: 'Panel 1',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
            title: 'Panel 2',
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
            title: 'Panel 3',
        });
    };

    const showDndOverlay = (event: PaneviewDndOverlayEvent) => {
        return checked;
    };

    const onDidDrop = (event: PaneviewDropEvent) => {
        const text = `onDidDrop ${event.position} ${event.panel.id}`;

        setLines((lines) => [...lines, { text, timestamp: new Date() }]);
    };

    return (
        <div
            style={{
                height: '300px',
                margin: '20px 0px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{ height: '25px' }}>
                <label>
                    <span>Enable external events</span>
                    <input
                        type={'checkbox'}
                        checked={checked}
                        onChange={(e) => {
                            setChecked(e.target.checked);
                        }}
                    />
                </label>
            </div>
            <div
                style={{
                    height: '250px',
                    display: 'flex',
                }}
            >
                <PaneviewReact
                    components={components}
                    onReady={onReady}
                    className="dockview-theme-abyss paneview-side-by-side"
                    showDndOverlay={showDndOverlay}
                    onDidDrop={onDidDrop}
                />
                <PaneviewReact
                    components={components}
                    onReady={onReady}
                    className="dockview-theme-abyss paneview-side-by-side"
                    showDndOverlay={showDndOverlay}
                    onDidDrop={onDidDrop}
                />
            </div>
            <div style={{ height: '100px' }}>
                <Console lines={lines} />
            </div>
        </div>
    );
};
