import { DockviewApi } from 'dockview';

const PanelAction = (props: {
    panels: string[];
    api: DockviewApi;
    activePanel?: string;
    panelId: string;
}) => {
    const onClick = () => {
        props.api.getPanel(props.panelId)?.focus();
    };
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
                            props.api.addFloatingGroup(panel, undefined, {
                                position: {
                                    width: 400,
                                    height: 300,
                                    bottom: 20,
                                    right: 20,
                                }
                            });
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
