import { DockviewApi } from 'dockview';
import * as React from 'react';
import { GridActions } from './gridActions';
import { PanelActions } from './panelActions';
import { GroupActions } from './groupActions';
import { ToggleRow } from './toggleRow';

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

export const SettingsModal = (props: {
    open: boolean;
    onClose: () => void;
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
    tabAnimation: 'smooth' | 'default';
    onToggleTabAnimation: (v: 'smooth' | 'default') => void;
}) => {
    if (!props.open) return null;

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onClick={props.onClose}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '320px',
                    backgroundColor: '#0d1117',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '14px',
                        }}
                    >
                        Controls
                    </span>
                    <button
                        onClick={props.onClose}
                        style={{
                            background: 'none',
                            outline: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '18px' }}
                        >
                            close
                        </span>
                    </button>
                </div>

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
                        className="action-container"
                        style={{ flexWrap: 'wrap', gap: '4px' }}
                    >
                        <button
                            onClick={props.onToggleDebug}
                            style={
                                props.debug ? { backgroundColor: '#4864dc' } : {}
                            }
                        >
                            <span className="material-symbols-outlined">
                                engineering
                            </span>
                        </button>
                        <button
                            onClick={props.onToggleShowLogs}
                            style={
                                props.showLogs
                                    ? { backgroundColor: '#4864dc' }
                                    : {}
                            }
                        >
                            <span style={{ paddingRight: '4px' }}>
                                Events Log
                            </span>
                            <span className="material-symbols-outlined">
                                terminal
                            </span>
                        </button>
                        {props.showLogs && (
                            <button onClick={props.onClearLogs}>
                                <span className="material-symbols-outlined">
                                    undo
                                </span>
                            </button>
                        )}
                    </div>
                    <ToggleRow
                        label="Tab Animation"
                        value={props.tabAnimation}
                        options={[
                            { value: 'default', label: 'default' },
                            { value: 'smooth', label: 'smooth' },
                        ]}
                        onChange={props.onToggleTabAnimation}
                    />
                </Section>
            </div>
        </div>
    );
};
