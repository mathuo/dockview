import React from 'react';
import { DockviewReact, ITabOverflowProps } from 'dockview';
import 'dockview/dist/styles/dockview.css';

// Custom overflow component that renders a dropdown with tab titles
const CustomTabOverflow: React.FC<ITabOverflowProps> = ({ event }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    // Show/hide the overflow UI based on whether there are overflow tabs
    React.useEffect(() => {
        if (!event.isVisible) {
            setIsOpen(false);
        }
    }, [event.isVisible]);

    if (!event.isVisible) {
        return null; // No overflow tabs, don't render anything
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

// Simple panel component
const SimplePanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
        <h3>Panel Content</h3>
        <p>This is a sample panel. Try resizing the window to see the custom overflow behavior.</p>
    </div>
);

const CustomTabOverflowExample: React.FC = () => {
    const [api, setApi] = React.useState<any>();

    const onReady = (event: any) => {
        setApi(event.api);
        
        // Add multiple panels to trigger overflow
        for (let i = 1; i <= 8; i++) {
            event.api.addPanel({
                id: `panel${i}`,
                title: `Panel ${i}`,
                component: 'simple',
            });
        }
    };

    return (
        <div style={{ height: '400px', border: '1px solid #ccc' }}>
            <DockviewReact
                onReady={onReady}
                components={{
                    simple: SimplePanel,
                }}
                tabOverflowComponent={CustomTabOverflow}
            />
        </div>
    );
};

export default CustomTabOverflowExample;