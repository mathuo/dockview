import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    IDockviewPanelHeaderProps,
} from 'dockview';
import * as React from 'react';
import './app.scss';

const components = {
    default: (props: IDockviewPanelProps<{ title: string; x?: number }>) => {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    height: '100%',
                }}
            >
                <span>{`${props.params.title}`}</span>
                {props.params.x && <span>{`  ${props.params.x}`}</span>}
            </div>
        );
    },
};

const tabComponents = {
    default: (props: IDockviewPanelHeaderProps<{ title: string }>) => {
        return (
            <div className="my-custom-tab">
                <span>{props.params.title}</span>
                <span style={{ flexGrow: 1 }} />

                <span className="my-custom-tab-icon material-symbols-outlined">
                    minimize
                </span>
                <span className="my-custom-tab-icon material-symbols-outlined">
                    maximize
                </span>
                <span className="my-custom-tab-icon material-symbols-outlined">
                    close
                </span>
            </div>
        );
    },
};

const DockviewNative = (props: { theme?: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
        const panel1 = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Window 1',
            },
        });
        panel1.group.locked = true;

        const panel2 = event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Window 2',
            },
            position: {
                direction: 'right',
            },
        });
        panel2.group.locked = true;

        const panel3 = event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            tabComponent: 'default',
            params: {
                title: 'Window 3',
            },
            position: {
                direction: 'below',
            },
        });
        panel3.group.locked = true;
    };

    return (
        <DockviewReact
            onReady={onReady}
            components={components}
            tabComponents={tabComponents}
            className={`${props.theme || 'dockview-theme-abyss'}`}
            singleTabMode="fullwidth"
        />
    );
};

export default DockviewNative;
