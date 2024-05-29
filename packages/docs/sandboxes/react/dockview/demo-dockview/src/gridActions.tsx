import { DockviewApi } from 'dockview';
import * as React from 'react';
import { defaultConfig, nextId } from './defaultLayout';

export const GridActions = (props: {
    api?: DockviewApi;
    hasCustomWatermark: boolean;
    toggleCustomWatermark: () => void;
}) => {
    const onClear = () => {
        props.api?.clear();
    };

    const onLoad = () => {
        const state = localStorage.getItem('dv-demo-state');
        if (state) {
            try {
                props.api?.fromJSON(JSON.parse(state));
            } catch {
                localStorage.removeItem('dv-demo-state');
            }
        }
    };

    const onSave = () => {
        if (props.api) {
            localStorage.setItem(
                'dv-demo-state',
                JSON.stringify(props.api.toJSON())
            );
        }
    };

    const onReset = () => {
        if (props.api) {
            props.api.clear();
            defaultConfig(props.api);
        }
    };

    const onAddPanel = (options?: { inactive: boolean }) => {
        props.api?.addPanel({
            id: `id_${Date.now().toString()}`,
            component: 'default',
            title: `Tab ${nextId()}`,
            inactive: options?.inactive,
        });
    };

    const onAddGroup = () => {
        props.api?.addGroup();
    };

    const [gap, setGap] = React.useState(0);

    React.useEffect(() => {
        props.api?.setGap(gap);
    }, [gap, props.api]);

    return (
        <div className="action-container">
            <button className="text-button" onClick={() => onAddPanel()}>
                Add Panel
            </button>
            <button
                className="text-button"
                onClick={() => onAddPanel({ inactive: true })}
            >
                Add Inactive Panel
            </button>
            <button className="text-button" onClick={onAddGroup}>
                Add Group
            </button>
            <span className="button-action">
                <button
                    className={
                        props.hasCustomWatermark
                            ? 'demo-button selected'
                            : 'demo-button'
                    }
                    onClick={props.toggleCustomWatermark}
                >
                    Use Custom Watermark
                </button>
            </span>
            <button className="text-button" onClick={onClear}>
                Clear
            </button>
            <button className="text-button" onClick={onLoad}>
                Load
            </button>
            <button className="text-button" onClick={onSave}>
                Save
            </button>
            <button className="text-button" onClick={onReset}>
                Reset
            </button>
            <span style={{ flexGrow: 1 }} />
            <div style={{ display: 'flex' }}>
                <span style={{ paddingRight: '4px' }}>Gap</span>
                <input
                    type="number"
                    min={0}
                    max={20}
                    step={1}
                    value={gap}
                    onChange={(event) => setGap(Number(event.target.value))}
                />
            </div>
        </div>
    );
};
