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
                backgroundColor: 'var(--header-color)',
                padding: '0px 8px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
            }}
        >
            <div>
                <div>
                    <span style={{ fontSize: '2em' }}>dockview</span>
                    <span style={{ fontSize: '1.25em' }}>
                        {' documentation'}
                    </span>
                </div>
            </div>
        </div>
    );
};
