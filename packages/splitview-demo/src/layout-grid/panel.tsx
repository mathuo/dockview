import * as React from 'react';
import { CompositeDisposable, IGridviewPanelProps } from 'splitview';

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
        <div style={{ backgroundColor: 'rgb(30,30,30)', height: '100%' }}>
            <button onClick={onClick}>Resize</button>
            Panel
            <div>{`active: ${active} focused ${focused}`}</div>
        </div>
    );
};
