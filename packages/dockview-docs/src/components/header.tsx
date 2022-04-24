import { DockviewReact, DockviewReadyEvent } from 'dockview';

const components = {
    default: () => {
        return <div>Hello World</div>;
    },
};

export const Header = (props: {}) => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel2',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel3',
            component: 'default',
            position: {
                referencePanel: 'panel2',
                direction: 'right',
            },
        });
    };

    return (
        <div
            style={{
                height: '1000px',
                backgroundColor: '#0070f3',
                padding: '5vw',
            }}
        >
            <DockviewReact
                onReady={onReady}
                components={components}
                className="dockview-theme-dark"
            />
        </div>
    );
};
