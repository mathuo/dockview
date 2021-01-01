import * as React from 'react';
import { CompositeDisposable, IGridviewPanelProps } from 'dockview';

export const Panel = (props: IGridviewPanelProps) => {
    const [active, setActive] = React.useState<boolean>();
    const [focused, setFocused] = React.useState<boolean>();

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            props.api.onDidActiveChange((event) => {
                setActive(event.isActive);
            }),
            props.api.onDidFocusChange((event) => {
                setFocused(event.isFocused);
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    const onToggle = () => {
        const editorPanel = props.containerApi.getPanel('editor');
        editorPanel.api.setVisible(!editorPanel.api.isVisible);
    };

    const onClose = () => {
        const editorPanel = props.containerApi.getPanel('editor');

        editorPanel.api.setVisible(true);
        props.api.setVisible(false);
    };

    const onMove = () => {
        const thisPanel = props.containerApi.getPanel('panel');
        const editor = props.containerApi.getPanel('editor');

        props.containerApi.movePanel(thisPanel, {
            direction: 'left',
            reference: editor.id,
        });
    };

    return (
        <div
            style={{
                borderTop: `1px solid var(--dv-separator-border)`,
                boxSizing: 'border-box',
                backgroundColor: 'rgb(30,30,30)',
                height: '100%',
            }}
        >
            <div style={{ display: 'flex', padding: '5px' }}>
                <span>This panel is outside of the dockable layer</span>
                <span style={{ flexGrow: 1 }} />
                {/* <button onClick={onMove}>Move</button> */}
                <button onClick={onToggle}>Resize</button>
                <button onClick={onClose}>Close</button>
            </div>
            <div style={{ padding: '0px 5px' }}>
                <div>{`isPanelActive: ${active} isPanelFocused: ${focused}`}</div>
            </div>
        </div>
    );
};
