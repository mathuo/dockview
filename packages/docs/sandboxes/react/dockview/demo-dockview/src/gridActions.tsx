import { DockviewApi, EdgeGroupPosition } from 'dockview-react';
import * as React from 'react';
import { defaultConfig, nextId } from './defaultLayout';

const btnStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: 11,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
};

const btnActiveStyle: React.CSSProperties = {
    ...btnStyle,
    background: 'rgba(72,100,220,0.25)',
    borderColor: 'rgba(72,100,220,0.5)',
    color: 'white',
};

const iconBtnStyle: React.CSSProperties = {
    ...btnStyle,
    padding: '3px 6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const Row = (props: {
    label?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
}) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 16px',
            minHeight: 30,
            ...props.style,
        }}
    >
        {props.label && (
            <span
                style={{
                    flex: 1,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                }}
            >
                {props.label}
            </span>
        )}
        {props.children}
    </div>
);

const EDGE_POSITIONS: EdgeGroupPosition[] = ['top', 'bottom', 'left', 'right'];

const EdgeGroupToggles = (props: { api: DockviewApi }) => {
    const [active, setActive] = React.useState<
        Partial<Record<EdgeGroupPosition, boolean>>
    >(() =>
        Object.fromEntries(
            EDGE_POSITIONS.map((pos) => [
                pos,
                props.api.getEdgeGroup(pos) !== undefined,
            ])
        )
    );

    const toggle = (position: EdgeGroupPosition) => {
        if (active[position]) {
            props.api.removeEdgeGroup(position);
            setActive((s) => ({ ...s, [position]: false }));
        } else {
            const groupApi = props.api.addEdgeGroup(position, {
                id: `edge-${position}`,
                initialSize: 200,
                minimumSize: 100,
            });
            props.api.addPanel({
                id: `edge-panel-${position}-${Date.now()}`,
                component: 'fixedPlaceholder',
                title: `Tab ${nextId()}`,
                position: { referenceGroup: groupApi.id },
                params: { label: position, position },
            });
            setActive((s) => ({ ...s, [position]: true }));
        }
    };

    return (
        <Row label="Edge groups">
            <div
                style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                }}
            >
                {EDGE_POSITIONS.map((pos) => (
                    <button
                        key={pos}
                        onClick={() => toggle(pos)}
                        style={{
                            padding: '3px 8px',
                            fontSize: 11,
                            border: 'none',
                            cursor: 'pointer',
                            background: active[pos]
                                ? 'rgba(255,255,255,0.15)'
                                : 'transparent',
                            color: active[pos]
                                ? 'white'
                                : 'rgba(255,255,255,0.5)',
                        }}
                    >
                        {pos}
                    </button>
                ))}
            </div>
        </Row>
    );
};

import { createRoot } from 'react-dom/client';
import { PanelBuilder } from './panelBuilder';

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
                    backgroundColor: '#161b22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: 'white',
                    padding: 16,
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
        <div style={{ padding: '4px 0' }}>
            <Row>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button style={btnStyle} onClick={onLoad}>
                        Load
                    </button>
                    <button style={btnStyle} onClick={onSave}>
                        Save
                    </button>
                    <button style={btnStyle} onClick={onClear}>
                        Clear
                    </button>
                    <button style={btnStyle} onClick={onReset}>
                        Reset
                    </button>
                </div>
            </Row>
            {props.api && <EdgeGroupToggles api={props.api} />}
            <Row>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button style={btnStyle} onClick={() => onAddPanel()}>
                        Add Panel
                    </button>
                    <button
                        style={iconBtnStyle}
                        onClick={() => onAddPanel({ advanced: true })}
                        title="Advanced panel options"
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            tune
                        </span>
                    </button>
                    <button
                        style={btnStyle}
                        onClick={() => onAddPanel({ nested: true })}
                    >
                        Nested
                    </button>
                    <button style={btnStyle} onClick={onAddGroup}>
                        Add Group
                    </button>
                </div>
            </Row>
        </div>
    );
};
