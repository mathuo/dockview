import React from 'react';
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps, ITabOverflowProps } from 'dockview';
import 'dockview/dist/styles/dockview.css';

// Simple panel component
const Panel: React.FC<IDockviewPanelProps> = (props) => {
    const [title, setTitle] = React.useState<string>('');

    React.useEffect(() => {
        const updateTitle = () => {
            setTitle(props.api.title || props.api.id);
        };

        updateTitle();
        const disposable = props.api.onDidTitleChange(updateTitle);

        return () => {
            disposable.dispose();
        };
    }, [props.api]);

    return (
        <div style={{ height: '100%', padding: '16px' }}>
            <h3>{title}</h3>
            <p>This is a sample panel. Try resizing the window to see the custom overflow behavior.</p>
        </div>
    );
};

// Custom tab overflow component
const CustomTabOverflow: React.FC<ITabOverflowProps> = ({ event }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        if (!event.isVisible) {
            setIsOpen(false);
        }
    }, [event.isVisible]);

    if (!event.isVisible) {
        return null;
    }

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                }}
            >
                +{event.tabs.length} more
            </button>
            
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        minWidth: '200px',
                    }}
                >
                    {event.tabs.map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => {
                                tab.panel.api.setActive();
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                backgroundColor: tab.isActive ? '#e6f3ff' : 'transparent',
                            }}
                        >
                            {tab.title}
                            {tab.isActive && (
                                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                                    (active)
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const App: React.FC = () => {
    const onReady = (event: DockviewReadyEvent) => {
        // Add multiple panels to trigger overflow
        for (let i = 1; i <= 8; i++) {
            event.api.addPanel({
                id: `panel_${i}`,
                component: 'panel',
                title: `Panel ${i}`,
            });
        }
    };

    return (
        <DockviewReact
            components={{ panel: Panel }}
            tabOverflowComponent={CustomTabOverflow}
            onReady={onReady}
            className="dockview-theme-abyss"
            style={{ height: '100vh' }}
        />
    );
};