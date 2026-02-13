import React from 'react';

export function PopoverMenu(props: { window: Window }) {
    const [isOpen, setOpen] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // helper function to close the menu
    function close() {
        setOpen(false);
    }

    // Close on click outside
    React.useEffect(() => {
        if (!isOpen) return;
        
        function handleClickOutside(event: Event) {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                close();
            }
        }

        const doc = props.window?.document || document;
        doc.addEventListener('mousedown', handleClickOutside);
        return () => doc.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, props.window]);

    return (
        <>
            <button 
                ref={buttonRef}
                onClick={() => setOpen(!isOpen)}
                style={{ position: 'relative' }}
            >
                {isOpen ? 'Hide' : 'Show'}
                {isOpen && (
                    <ul style={{
                        position: 'absolute',
                        top: '-120px',
                        right: '0',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        listStyle: 'none',
                        padding: '8px 0',
                        margin: '0',
                        minWidth: '120px',
                        zIndex: 1000,
                        transition: 'opacity 0.2s ease-in-out',
                        opacity: 1
                    }}>
                        <li style={{ padding: '8px 16px', cursor: 'pointer' }} 
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            Item 1
                        </li>
                        <li style={{ padding: '8px 16px', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            Item 2
                        </li>
                        <li style={{ padding: '8px 16px', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            Item 3
                        </li>
                        <li style={{ padding: '8px 16px', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            Item 4
                        </li>
                    </ul>
                )}
            </button>
        </>
    );
}
