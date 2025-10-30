import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ myValue: string }>) => {
        const [title, setTitle] = React.useState<string>(props.api.title ?? '');

        const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(event.target.value);
        };

        const onClick = () => {
            props.api.setTitle(title);
        };

        return (
            <div style={{ padding: '20px', color: 'white' }}>
                <div>
                    <span style={{ color: 'grey' }}>{'props.api.title='}</span>
                    <span>{`${props.api.title}`}</span>
                </div>
                <input value={title} onChange={onChange} />
                <button onClick={onClick}>Change</button>
            </div>
        );
    },
};

export const App: React.FC = (props: { theme?: string }) => {
    const onReady = (event: DockviewReadyEvent) => {
        const panel = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
        });

        const panel2 = event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
            position: { referencePanel: panel.id },
        });

        const panel3 = event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',

            position: { referencePanel: panel.id, direction: 'right' },
        });

        const panel4 = event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            title: 'Panel 4',
            position: { referencePanel: panel3.id },
        });
    };

    return (
        <DockviewReact
            components={components}
            onReady={onReady}
            className={`${props.theme || 'dockview-theme-abyss'}`}
        />
    );
};

export default App;
