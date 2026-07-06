import { DockviewApi } from 'dockview-react';
import * as React from 'react';
import { GridActions } from './gridActions';
import { PanelActions } from './panelActions';
import { GroupActions } from './groupActions';

const Section = (props: { title: string; children: React.ReactNode }) => (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div
            style={{
                padding: '8px 16px 4px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 600,
            }}
        >
            {props.title}
        </div>
        {props.children}
    </div>
);

const Kbd = (props: { children: React.ReactNode }) => (
    <kbd
        style={{
            display: 'inline-block',
            padding: '1px 6px',
            fontSize: 10,
            fontFamily: 'inherit',
            lineHeight: '16px',
            border: '1px solid rgba(255,255,255,0.18)',
            borderBottomWidth: 2,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.85)',
            whiteSpace: 'nowrap',
        }}
    >
        {props.children}
    </kbd>
);

// Read-only reference. Mirrors the enabled `keyboardNavigation` bindings —
// KeyboardNavigation (nav) + KeyboardDocking (move). Keep in sync with
// DEFAULT_KEYMAP in dockview-enterprise if the defaults change.
const SHORTCUTS: { label: string; keys: string[] }[] = [
    { label: 'Focus next / previous group', keys: ['F6', '⇧ F6'] },
    { label: 'Focus group by direction', keys: ['Ctrl ⇧ ←↑↓→'] },
    { label: 'Next / previous tab in group', keys: ['Ctrl ]', 'Ctrl ['] },
    { label: 'Focus the tab strip', keys: ['Ctrl ⇧ \\'] },
    { label: 'Move panel — arm', keys: ['Ctrl M'] },
    { label: '…then pick target / edge', keys: ['←↑↓→'] },
    { label: '…tab into group (centre)', keys: ['Space', 'C'] },
    { label: '…commit / cancel', keys: ['Enter', 'Esc'] },
    { label: '…float instead of dock', keys: ['Ctrl ⇧ F'] },
];

const KeyboardShortcuts = () => (
    <div style={{ padding: '4px 16px 10px' }}>
        {SHORTCUTS.map((row) => (
            <div
                key={row.label}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '3px 0',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.7)',
                }}
            >
                <span>{row.label}</span>
                <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {row.keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                    ))}
                </span>
            </div>
        ))}
    </div>
);

const toggleBtn = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    fontSize: 11,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    background: active ? 'rgba(72,100,220,0.25)' : 'rgba(255,255,255,0.04)',
    borderColor: active ? 'rgba(72,100,220,0.5)' : 'rgba(255,255,255,0.12)',
    color: active ? 'white' : 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
});

export const ControlsContent = (props: {
    api?: DockviewApi;
    panels: string[];
    groups: string[];
    activePanel?: string;
    activeGroup?: string;
    hasCustomWatermark: boolean;
    toggleCustomWatermark: () => void;
    hasCustomGhost: boolean;
    toggleCustomGhost: () => void;
    debug: boolean;
    onToggleDebug: () => void;
    showLogs: boolean;
    onToggleShowLogs: () => void;
    onClearLogs: () => void;
}) => {
    return (
        <>
            <Section title="Grid">
                <GridActions api={props.api} />
            </Section>

            {props.api && props.activePanel && (
                <Section title="Active Panel">
                    <PanelActions
                        api={props.api}
                        panels={[props.activePanel]}
                        activePanel={props.activePanel}
                    />
                </Section>
            )}

            {props.api && props.activeGroup && (
                <Section title="Active Group">
                    <GroupActions
                        api={props.api}
                        groups={[props.activeGroup]}
                        activeGroup={props.activeGroup}
                    />
                </Section>
            )}

            <Section title="View">
                <div
                    style={{
                        display: 'flex',
                        gap: 6,
                        padding: '6px 16px 8px',
                        flexWrap: 'wrap',
                    }}
                >
                    <button
                        onClick={props.onToggleDebug}
                        style={toggleBtn(props.debug)}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            engineering
                        </span>
                        <span>Debug</span>
                    </button>
                    <button
                        onClick={props.onToggleShowLogs}
                        style={toggleBtn(props.showLogs)}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            terminal
                        </span>
                        <span>Events Log</span>
                    </button>
                    <button
                        onClick={props.toggleCustomWatermark}
                        style={toggleBtn(props.hasCustomWatermark)}
                        title="Use a custom watermark component (visible when no grid groups are present)"
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            branding_watermark
                        </span>
                        <span>Custom watermark</span>
                    </button>
                    <button
                        onClick={props.toggleCustomGhost}
                        style={toggleBtn(props.hasCustomGhost)}
                        title="Replace the default 'Multiple Panels (N)' group drag ghost with a custom component"
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14 }}
                        >
                            drag_indicator
                        </span>
                        <span>Custom Drag Ghost</span>
                    </button>
                    {props.showLogs && (
                        <button
                            onClick={props.onClearLogs}
                            style={toggleBtn(false)}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 14 }}
                            >
                                undo
                            </span>
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </Section>

            <Section title="Keyboard shortcuts">
                <KeyboardShortcuts />
            </Section>
        </>
    );
};
