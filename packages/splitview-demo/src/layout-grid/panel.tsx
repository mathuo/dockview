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

    const onClick = () => {
        props.api.setSize({ height: 500 });
    };

    return (
        <div
            style={{
                backgroundColor: 'rgb(30,30,30)',
                height: '100%',
            }}
        >
            <div style={{ display: 'flex', padding: '5px' }}>
                <span>This panel is outside of the dockable layer</span>
                <span style={{ flexGrow: 1 }} />
                <button onClick={onClick}>Resize</button>
            </div>
            <div style={{ padding: '0px 5px' }}>
                <div>{`isPanelActive: ${active} isPanelFocused: ${focused}`}</div>
            </div>
        </div>
    );
};
