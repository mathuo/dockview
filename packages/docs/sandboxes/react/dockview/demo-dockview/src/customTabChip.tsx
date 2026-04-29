import * as React from 'react';
import { IDockviewTabGroupChipProps, ITabGroup } from 'dockview-react';

const ICON_CYCLE = ['📁', '⭐️', '🔥', '🚀', '🎯', '💡', '🐛', '📊'];

interface ChipParams {
    icon?: string;
}

function readParams(tabGroup: ITabGroup): ChipParams {
    return (tabGroup.componentParams as ChipParams | undefined) ?? {};
}

/**
 * Custom tab-group chip used in the demo with `tabGroupAccent: 'off'`.
 *
 * The dockview built-in color concept is disabled — this chip owns the
 * entire visual and ignores `tabGroup.color` (the field still exists on
 * the data model, it's just not consumed). All identity comes from the
 * persisted `componentParams.icon`.
 *
 * - Left-click on the chip body toggles collapse.
 * - Left-click on the icon cycles to the next icon and writes back via
 *   `setComponentParams`, so the value round-trips through `toJSON` /
 *   `fromJSON` (Save/Load in the demo).
 * - Right-click bubbles to the chip's root element and triggers the
 *   configured chip context menu (`rename`, etc.).
 */
export const DemoTabGroupChip: React.FunctionComponent<
    IDockviewTabGroupChipProps
> = ({ tabGroup }) => {
    const [, forceUpdate] = React.useReducer((c: number) => c + 1, 0);

    React.useEffect(() => {
        const disposable = tabGroup.onDidChange(() => forceUpdate());
        const collapseDisposable = tabGroup.onDidCollapseChange(() =>
            forceUpdate()
        );
        return () => {
            disposable.dispose();
            collapseDisposable.dispose();
        };
    }, [tabGroup]);

    const params = readParams(tabGroup);
    const icon = params.icon ?? ICON_CYCLE[0];

    const cycleIcon = (e: React.MouseEvent) => {
        e.stopPropagation();
        const idx = ICON_CYCLE.indexOf(icon);
        const next = ICON_CYCLE[(idx + 1) % ICON_CYCLE.length];
        tabGroup.setComponentParams({ ...params, icon: next });
    };

    const toggleCollapse = () => tabGroup.toggle();

    return (
        <div
            tabIndex={0}
            draggable
            className="dv-tab-group-chip"
            onClick={toggleCollapse}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: 'inherit',
            }}
        >
            <span
                onClick={cycleIcon}
                title="Click to cycle icon (persists via componentParams)"
                style={{
                    cursor: 'pointer',
                    fontSize: 14,
                    lineHeight: 1,
                }}
            >
                {icon}
            </span>
            {tabGroup.label && (
                <span style={{ fontSize: 11 }}>{tabGroup.label}</span>
            )}
            {tabGroup.collapsed && (
                <span style={{ opacity: 0.6, fontSize: 10 }}>
                    +{tabGroup.panelIds.length}
                </span>
            )}
        </div>
    );
};
