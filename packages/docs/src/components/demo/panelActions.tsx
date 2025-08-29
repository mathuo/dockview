import { DockviewApi, IDockviewPanel } from 'dockview';
import * as React from 'react';
import { Button, ButtonGroup } from '@chakra-ui/react';

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
                <Button
                    variant={props.activePanel === props.panelId ? "solid" : "outline"}
                    colorPalette={props.activePanel === props.panelId ? "blue" : undefined}
                    onClick={onClick}
                    size="sm"
                >
                    {props.panelId}
                </Button>
            </div>
            <div style={{ display: 'flex' }}>
                <ButtonGroup size="sm" variant="outline">
                    <Button
                        onClick={() => {
                            const panel = props.api.getPanel(props.panelId);
                            if (panel) {
                                props.api.addFloatingGroup(panel);
                            }
                        }}
                    >
                        <span className="material-symbols-outlined">ad_group</span>
                    </Button>
                    <Button
                        onClick={() => {
                            const panel = props.api.getPanel(props.panelId);
                            if (panel) {
                                props.api.addPopoutGroup(panel);
                            }
                        }}
                    >
                        <span className="material-symbols-outlined">open_in_new</span>
                    </Button>
                    <Button
                        onClick={() => {
                            const panel = props.api.getPanel(props.panelId);
                            panel?.api.close();
                        }}
                    >
                        <span className="material-symbols-outlined">close</span>
                    </Button>
                    <Button
                        title="Panel visiblity cannot be edited manually."
                        disabled={true}
                    >
                        <span className="material-symbols-outlined">
                            {visible ? 'visibility' : 'visibility_off'}
                        </span>
                    </Button>
                </ButtonGroup>
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
