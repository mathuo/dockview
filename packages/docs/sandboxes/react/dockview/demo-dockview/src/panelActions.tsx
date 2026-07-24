import { DockviewApi, IDockviewPanel } from 'dockview-react';
import * as React from 'react';
import { SB } from './sidebarTheme';
import { IconBtn } from './sidebarKit';

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
                padding: '4px 0',
                minHeight: 28,
            }}
        >
            <button
                onClick={onClick}
                style={{
                    flex: 1,
                    padding: '5px 10px',
                    fontSize: 11.5,
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: SB.ui,
                    border: `1px solid ${isActive ? SB.accent : SB.border}`,
                    borderRadius: SB.radiusSm,
                    background: isActive ? SB.accent : SB.surface,
                    color: isActive ? SB.accentContrast : SB.text,
                    boxShadow: isActive ? SB.glow : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {props.panelId}
            </button>
            <div style={{ display: 'flex', gap: 3 }}>
                <IconBtn
                    icon="ad_group"
                    title="Float"
                    onClick={() => {
                        const p = props.api.getPanel(props.panelId);
                        if (p) props.api.addFloatingGroup(p);
                    }}
                />
                <IconBtn
                    icon="open_in_new"
                    title="Popout"
                    onClick={() => {
                        const p = props.api.getPanel(props.panelId);
                        if (p) props.api.addPopoutGroup(p);
                    }}
                />
                <IconBtn
                    icon="close"
                    title="Close"
                    onClick={() => {
                        const p = props.api.getPanel(props.panelId);
                        p?.api.close();
                    }}
                />
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: 16,
                        color: visible ? SB.muted : SB.faint,
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
