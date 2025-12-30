import React from 'react';
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps, ITabOverflowProps, ITabOverflowTriggerProps } from 'dockview';
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

// Custom trigger component (appears in the tab header)
const CustomTrigger: React.FC<ITabOverflowTriggerProps> = ({ event }) => {
    if (!event.isVisible) return null;
    
    return (
        <button style={{
            background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {event.tabs.length}
        </button>
    );
};

// Custom content component (the overflow menu)
const CustomContent: React.FC<ITabOverflowProps> = ({ event }) => {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '280px',
            color: 'white',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
            <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                textAlign: 'center'
            }}>
                📋 Hidden Tabs ({event.tabs.length})
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {event.tabs.map((tab, index) => (
                    <div
                        key={tab.id}
                        onClick={() => tab.panel.api.setActive()}
                        style={{
                            padding: '12px',
                            margin: '6px 0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: tab.isActive 
                                ? 'rgba(255, 255, 255, 0.2)' 
                                : 'rgba(255, 255, 255, 0.1)',
                            border: tab.isActive 
                                ? '2px solid rgba(255, 255, 255, 0.6)' 
                                : '2px solid transparent',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span style={{ fontWeight: tab.isActive ? 'bold' : 'normal' }}>
                            {tab.title}
                        </span>
                        {tab.isActive && (
                            <span style={{ 
                                fontSize: '12px', 
                                background: 'rgba(255,255,255,0.3)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                ✓ Active
                            </span>
                        )}
                    </div>
                ))}
            </div>
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
            tabOverflowComponent={{
                trigger: CustomTrigger,
                content: CustomContent
            }}
            onReady={onReady}
            className="dockview-theme-abyss"
            style={{ height: '100vh' }}
        />
    );
};