import { DockviewApi, IDockviewPanel } from 'dockview-react';
import * as React from 'react';

const iconBtn: React.CSSProperties = {
    padding: '3px 6px',
    fontSize: 11,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const PanelAction = (props: {
    panels: string[];
    api: DockviewApi;
    activePanel?: string;
    panelId: string;
}) => {
    const onClick = () => {
        props.api.getPanel(props.panelId)?.focus();
    };

    const [panel, setPanel] = React.useState<IDockviewPanel | undefined>(
        undefined
    );
    const [visible, setVisible] = React.useState<boolean>(true);

    React.useEffect(() => {
        const panel = props.api.getPanel(props.panelId);
        if (panel) {
            const disposable = panel.api.onDidVisibilityChange((event) => {
                setVisible(event.isVisible);
            });
            setVisible(panel.api.isVisible);
            return () => disposable.dispose();
        }
    }, [props.api, props.panelId]);

    React.useEffect(() => {
        const list = [
            props.api.onDidLayoutFromJSON(() => {
                setPanel(props.api.getPanel(props.panelId));
            }),
        ];

        if (panel) {
            const disposable = panel.api.onDidVisibilityChange((event) => {
                setVisible(event.isVisible);
            });
            setVisible(panel.api.isVisible);
            list.push(disposable);
        }

        setPanel(props.api.getPanel(props.panelId));

        return () => list.forEach((l) => l.dispose());
    }, [props.api, props.panelId]);

    const isActive = props.activePanel === props.panelId;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 16px',
                minHeight: 28,
            }}
        >
            <button
                onClick={onClick}
                style={{
                    flex: 1,
                    padding: '3px 8px',
                    fontSize: 11,
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 4,
                    background: isActive
                        ? 'rgba(72,100,220,0.25)'
                        : 'rgba(255,255,255,0.04)',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {props.panelId}
            </button>
            <div style={{ display: 'flex', gap: 2 }}>
                <button
                    style={iconBtn}
                    onClick={() => {
                        const p = props.api.getPanel(props.panelId);
                        if (p) props.api.addFloatingGroup(p);
                    }}
                    title="Float"
                >
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14 }}
                    >
                        ad_group
                    </span>
                </button>
                <button
                    style={iconBtn}
                    onClick={() => {
                        const p = props.api.getPanel(props.panelId);
                        if (p) props.api.addPopoutGroup(p);
                    }}
                    title="Popout"
                >
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14 }}
                    >
                        open_in_new
                    </span>
                </button>
                <button
                    style={iconBtn}
                    onClick={() => {
                        const p = props.api.getPanel(props.panelId);
                        p?.api.close();
                    }}
                    title="Close"
                >
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14 }}
                    >
                        close
                    </span>
                </button>
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: 14,
                        color: visible
                            ? 'rgba(255,255,255,0.4)'
                            : 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 2px',
                    }}
                    title="Visibility (read-only)"
                >
                    {visible ? 'visibility' : 'visibility_off'}
                </span>
            </div>
        </div>
    );
};

export const PanelActions = (props: {
    panels: string[];
    api: DockviewApi;
    activePanel?: string;
}) => {
    return (
        <div style={{ padding: '2px 0' }}>
            {props.panels.map((id) => (
                <PanelAction key={id} {...props} panelId={id} />
            ))}
        </div>
    );
};
