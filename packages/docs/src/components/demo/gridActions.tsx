import { DockviewApi } from 'dockview';
import * as React from 'react';
import { defaultConfig, nextId } from './defaultLayout';

import { createRoot } from 'react-dom/client';
import { PanelBuilder } from './panelBuilder';
import { Button } from '@chakra-ui/react';
import { ButtonGroup } from './ButtonGroup';

let mount = document.querySelector('.popover-anchor') as HTMLElement | null;

if (!mount) {
    mount = document.createElement('div');
    mount.className = 'popover-anchor';
    document.body.insertBefore(mount, document.body.firstChild);
}

const PopoverComponent = (props: {
    close: () => void;
    component: React.FC<{ close: () => void }>;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handler = (ev: MouseEvent) => {
            let target = ev.target as HTMLElement;

            while (target.parentElement) {
                if (target === ref.current) {
                    return;
                }
                target = target.parentElement;
            }

            props.close();
        };

        window.addEventListener('mousedown', handler);

        return () => {
            window.removeEventListener('mousedown', handler);
        };
    }, []);

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 9999,
                height: '100%',
                width: '100%',
            }}
        >
            <div
                ref={ref}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    backgroundColor: 'black',
                    color: 'white',
                    padding: 10,
                }}
            >
                <props.component close={props.close} />
            </div>
        </div>
    );
};

function usePopover() {
    return {
        open: (Component: React.FC<{ close: () => void }>) => {
            const el = document.createElement('div');
            mount!.appendChild(el);
            const root = createRoot(el);

            root.render(
                <PopoverComponent
                    component={Component}
                    close={() => {
                        root.unmount();
                        el.remove();
                    }}
                />
            );
        },
    };
}

export const GridActions = (props: {
    api?: DockviewApi;
    hasCustomWatermark: boolean;
    toggleCustomWatermark: () => void;
}) => {
    const onClear = () => {
        props.api?.clear();
    };

    const onLoad = () => {
        const state = localStorage.getItem('dv-demo-state');
        if (state) {
            try {
                props.api?.fromJSON(JSON.parse(state));
            } catch (err) {
                console.error('failed to load state', err);
                localStorage.removeItem('dv-demo-state');
            }
        }
    };

    const onSave = () => {
        if (props.api) {
            const state = props.api.toJSON();
            console.log(state);

            localStorage.setItem('dv-demo-state', JSON.stringify(state));
        }
    };

    const onReset = () => {
        if (props.api) {
            try {
                props.api.clear();
                defaultConfig(props.api);
            } catch (err) {
                localStorage.removeItem('dv-demo-state');
            }
        }
    };

    const popover = usePopover();

    const onAddPanel = (options?: { advanced?: boolean; nested?: boolean }) => {
        if (options?.advanced) {
            popover.open(({ close }) => {
                return <PanelBuilder api={props.api!} done={close} />;
            });
        } else {
            props.api?.addPanel({
                id: `id_${Date.now().toString()}`,
                component: options?.nested ? 'nested' : 'default',
                title: `Tab ${nextId()}`,
                renderer: 'always',
            });
        }
    };

    const onAddGroup = () => {
        props.api?.addGroup();
    };

    return (
        <div className="action-container">
                <ButtonGroup>
                    <Button 
                        size="sm" 
                        variant="outline"
                        css={{ 
                            position: 'relative', 
                            display: 'flex', 
                            alignItems: 'center',
                            padding: 0
                        }}
                    >
                        <span 
                            onClick={() => onAddPanel()}
                            style={{ 
                                padding: '2px 8px',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s',
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                height: '100%'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            Add Panel
                        </span>
                        <span 
                            onClick={() => onAddPanel({ advanced: true })}
                            className="material-symbols-outlined" 
                            style={{ 
                                padding: '4px',
                                cursor: 'pointer',
                                borderLeft: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '0 4px 4px 0',
                                transition: 'background-color 0.15s',
                                fontSize: '16px'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            tune
                        </span>
                    </Button>
                    <Button
                        onClick={() => onAddPanel({ nested: true })}
                        size="sm" 
                        variant="outline"
                    >
                        Add Nested Panel
                    </Button>
                </ButtonGroup>
                <ButtonGroup>
                    <Button 
                        onClick={onAddGroup} 
                        size="sm" 
                        variant="outline"
                    >
                        Add Group
                    </Button>
                </ButtonGroup>
                <Button
                    onClick={props.toggleCustomWatermark}
                    size="sm"
                    variant={props.hasCustomWatermark ? "solid" : "outline"}
                    colorPalette="blue"
                >
                    Use Custom Watermark
                </Button>
                <span style={{ flexGrow: 1 }} />
                <ButtonGroup>
                    <span style={{ 
                        fontSize: '12px', 
                        color: 'var(--chakra-colors-fg)', 
                        alignSelf: 'center',
                        marginRight: '8px',
                        fontWeight: '500'
                    }}>
                        Layout:
                    </span>
                    <Button 
                        onClick={onClear} 
                        size="sm" 
                        variant="outline" 
                        colorPalette="red"
                    >
                        Clear
                    </Button>
                    <Button 
                        onClick={onLoad} 
                        size="sm" 
                        variant="outline"
                    >
                        Load
                    </Button>
                    <Button 
                        onClick={onSave} 
                        size="sm" 
                        variant="outline"
                    >
                        Save
                    </Button>
                    <Button 
                        onClick={onReset} 
                        size="sm" 
                        variant="outline"
                    >
                        Reset
                    </Button>
                </ButtonGroup>
            </div>
    );
};
