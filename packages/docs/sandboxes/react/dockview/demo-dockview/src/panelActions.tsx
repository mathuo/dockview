import { DockviewApi, IDockviewPanel } from 'dockview';
import * as React from 'react';

const PanelAction = (props: {
    panels: string[];
    api: DockviewApi;
    activePanel?: string;
    panelId: string;
}) => {
    const onClick = () => {
        props.api.getPanel(props.panelId)?.focus();
    };

    React.useEffect(() => {
        const panel = props.api.getPanel(props.panelId);
        if (panel) {
            const disposable = panel.api.onDidVisibilityChange((event) => {
                setVisible(event.isVisible);
            });
            setVisible(panel.api.isVisible);

            return () => {
                disposable.dispose();
            };
        }
    }, [props.api, props.panelId]);

    const [panel, setPanel] = React.useState<IDockviewPanel | undefined>(
        undefined
    );

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

        return () => {
            list.forEach((l) => l.dispose());
        };
    }, [props.api, props.panelId]);

    const [visible, setVisible] = React.useState<boolean>(true);

    return (
        <div className="button-action">
            <div style={{ display: 'flex' }}>
                <button
                    className={
                        props.activePanel === props.panelId
                            ? 'demo-button selected'
                            : 'demo-button'
                    }
                    onClick={onClick}
                >
                    {props.panelId}
                </button>
            </div>
            <div style={{ display: 'flex' }}>
                <button
                    className="demo-icon-button"
                    onClick={() => {
                        const panel = props.api.getPanel(props.panelId);
                        if (panel) {
                            props.api.addFloatingGroup(panel);
                        }
                    }}
                >
                    <span className="material-symbols-outlined">ad_group</span>
                </button>
                <button
                    className="demo-icon-button"
                    onClick={() => {
                        const panel = props.api.getPanel(props.panelId);
                        if (panel) {
                            props.api.addPopoutGroup(panel);
                        }
                    }}
                >
                    <span className="material-symbols-outlined">
                        open_in_new
                    </span>
                </button>
                <button
                    className="demo-icon-button"
                    onClick={() => {
                        const panel = props.api.getPanel(props.panelId);
                        panel?.api.close();
                    }}
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <button
                    title="Panel visiblity cannot be edited manually."
                    disabled={true}
                    className="demo-icon-button"
                >
                    <span className="material-symbols-outlined">
                        {visible ? 'visibility' : 'visibility_off'}
                    </span>
                </button>
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
        <div className="action-container">
            {props.panels.map((id) => {
                return <PanelAction key={id} {...props} panelId={id} />;
            })}
        </div>
    );
};
