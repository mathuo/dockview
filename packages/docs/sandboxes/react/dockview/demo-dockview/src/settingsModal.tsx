import { DockviewApi } from 'dockview';
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

const toggleBtn = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    fontSize: 11,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    background: active
        ? 'rgba(72,100,220,0.25)'
        : 'rgba(255,255,255,0.04)',
    borderColor: active
        ? 'rgba(72,100,220,0.5)'
        : 'rgba(255,255,255,0.12)',
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
    debug: boolean;
    onToggleDebug: () => void;
    showLogs: boolean;
    onToggleShowLogs: () => void;
    onClearLogs: () => void;
}) => {
    return (
        <>
            <Section title="Grid">
                <GridActions
                    api={props.api}
                    hasCustomWatermark={props.hasCustomWatermark}
                    toggleCustomWatermark={props.toggleCustomWatermark}
                />
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
        </>
    );
};
