import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return (
            <div style={{ padding: '20px', color: 'white' }}>
                {props.params.title}
            </div>
        );
    },
};

export const App: React.FC = (props: { theme?: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
        const panel1 = event.api.addPanel({
            id: 'locked1',
            component: 'default',
            params: {
                title: 'Locked',
            },
        });

        panel1.group.locked = true;
        panel1.group.header.hidden = true;

        event.api.addPanel({
            id: 'Drag me',
            component: 'default',
            params: {
                title: '',
            },
            position: { referencePanel: 'locked1', direction: 'right' },
        });

        event.api.addPanel({
            id: 'Drag me too',
            component: 'default',
            params: {
                title: '',
            },
            position: { referencePanel: 'Drag me', direction: 'right' },
        });

        const panel3 = event.api.addPanel({
            id: 'locked2',
            component: 'default',
            params: {
                title: 'Locked with no drop target',
            },
            position: { referencePanel: 'Drag me too', direction: 'right' },
        });

        panel3.group.locked = 'no-drop-target';
        panel3.group.header.hidden = true;
    };

    return (
        <DockviewReact
            components={components}
            onReady={onReady}
            className={props.theme || 'dockview-theme-abyss'}
        />
    );
};

export default App;
