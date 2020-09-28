import * as React from 'react';
import { IGridviewPanelProps } from 'splitview';

export const Panel = (props: IGridviewPanelProps) => {
    const onClick = () => {
        props.api.setSize({ height: 500 });
    };
    return (
        <div style={{ backgroundColor: 'rgb(30,30,30)', height: '100%' }}>
            <button onClick={onClick}>Resize</button>
            panel
        </div>
    );
};
