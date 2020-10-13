import * as React from 'react';
import { IGroupPanelProps } from 'dockview';

export const Settings = (props: IGroupPanelProps) => {
    const [tabHeight, setTabHeight] = React.useState<number>(
        props.containerApi.getTabHeight()
    );

    const onTabHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (!Number.isNaN(value)) {
            setTabHeight(value);
        }
    };

    const onClick = () => {
        props.containerApi.setTabHeight(tabHeight);
    };

    return (
        <div style={{ height: '100%', color: 'white' }}>
            <label>
                Tab height
                <input
                    onChange={onTabHeightChange}
                    value={tabHeight}
                    type="number"
                />
                <button onClick={onClick}>Apply</button>
            </label>
        </div>
    );
};
