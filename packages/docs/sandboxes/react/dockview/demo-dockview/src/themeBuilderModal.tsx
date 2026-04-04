import * as React from 'react';
import { DockviewTheme } from 'dockview';
import {
    ThemeBuilderState,
    ThemeCssOverrides,
    generateCodeSnippet,
} from './themeBuilder';
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
        <div style={{ paddingBottom: 8 }}>{props.children}</div>
    </div>
);

const SliderRow = (props: {
    label: string;
    value: number;
    min: number;
    max: number;
    unit?: string;
    onChange: (v: number) => void;
}) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 16px',
            minHeight: 30,
        }}
    >
        <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            {props.label}
        </span>
        <input
            type="range"
            min={props.min}
            max={props.max}
            value={props.value}
            onChange={(e) => props.onChange(Number(e.target.value))}
            style={{ width: 90 }}
        />
        <span
            style={{
                width: 36,
                textAlign: 'right',
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'monospace',
            }}
        >
            {props.value}
            {props.unit ?? ''}
        </span>
    </div>
);


const TextRow = (props: {
    label: string;
    varName?: keyof ThemeCssOverrides;
    value: string;
    containerEl?: HTMLElement | null;
    themeKey?: string;
    onChange: (v: string) => void;
}) => {
    const [computed, setComputed] = React.useState('');

    React.useEffect(() => {
        if (!props.varName || !props.containerEl) return;
        const id = requestAnimationFrame(() => {
            const dvRoot = props.containerEl!.querySelector(
                '[class*="dockview-theme"]'
            ) as HTMLElement | null;
            if (!dvRoot) return;
            setComputed(
                getComputedStyle(dvRoot).getPropertyValue(props.varName!).trim()
            );
        });
        return () => cancelAnimationFrame(id);
    }, [props.containerEl, props.varName, props.themeKey]);

    const displayed = props.value || computed;

    return (
        <div style={{ padding: '3px 16px 6px' }}>
            <div
                style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: 4,
                }}
            >
                {props.label}
            </div>
            <input
                type="text"
                value={displayed}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder="inherit"
                style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    padding: '4px 6px',
                    color: props.value ? 'white' : 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                }}
            />
        </div>
    );
};

const isHexColor = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

const ColorRow = (props: {
    label: string;
    varName: keyof ThemeCssOverrides;
    value: string;
    onChange: (v: string) => void;
    containerEl: HTMLElement | null;
    themeKey: string;
}) => {
    const [placeholder, setPlaceholder] = React.useState('');

    React.useEffect(() => {
        if (!props.containerEl) return;
        const id = requestAnimationFrame(() => {
            const dvRoot = props.containerEl!.querySelector(
                '[class*="dockview-theme"]'
            ) as HTMLElement | null;
            if (!dvRoot) return;
            setPlaceholder(
                getComputedStyle(dvRoot).getPropertyValue(props.varName).trim()
            );
        });
        return () => cancelAnimationFrame(id);
    }, [props.containerEl, props.varName, props.themeKey]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 16px',
                minHeight: 28,
            }}
        >
            <input
                type="color"
                value={
                    isHexColor(props.value)
                        ? props.value
                        : isHexColor(placeholder)
                          ? placeholder
                          : '#000000'
                }
                onChange={(e) => props.onChange(e.target.value)}
                style={{
                    width: 22,
                    height: 22,
                    padding: 1,
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 3,
                    cursor: 'pointer',
                    background: 'none',
                    flexShrink: 0,
                }}
                title="Pick color"
            />
            <span
                style={{
                    flex: 1,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.65)',
                }}
            >
                {props.label}
            </span>
            <input
                type="text"
                value={props.value || placeholder}
                onChange={(e) => props.onChange(e.target.value)}
                style={{
                    width: 108,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    padding: '3px 6px',
                    color: props.value ? 'white' : 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    outline: 'none',
                    fontFamily: 'monospace',
                }}
            />
            {props.value && (
                <button
                    onClick={() => props.onChange('')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.35)',
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontSize: 14,
                        lineHeight: 1,
                        flexShrink: 0,
                    }}
                    title="Reset to theme default"
                >
                    ×
                </button>
            )}
        </div>
    );
};

export const ThemeBuilderModal = (props: {
    open: boolean;
    onClose: () => void;
    state: ThemeBuilderState;
    onChange: (patch: Partial<ThemeBuilderState>) => void;
    onCssChange: (patch: Partial<ThemeCssOverrides>) => void;
    onReset: () => void;
    baseTheme: DockviewTheme;
    containerEl: HTMLElement | null;
}) => {
    const [themeDefaults, setThemeDefaults] = React.useState<
        Record<string, number>
    >({});

    React.useEffect(() => {
        if (!props.open || !props.containerEl) return;
        const read = () => {
            const dvRoot = props.containerEl!.querySelector(
                '[class*="dockview-theme"]'
            ) as HTMLElement | null;
            if (!dvRoot) return;
            const val = (v: string, fb: number) =>
                parseInt(getComputedStyle(dvRoot).getPropertyValue(v)) || fb;
            const fval = (v: string, fb: number) =>
                parseFloat(getComputedStyle(dvRoot).getPropertyValue(v)) || fb;
            setThemeDefaults({
                '--dv-tabs-and-actions-container-height': val(
                    '--dv-tabs-and-actions-container-height',
                    35
                ),
                '--dv-tabs-and-actions-container-font-size': val(
                    '--dv-tabs-and-actions-container-font-size',
                    13
                ),
                '--dv-border-radius': val('--dv-border-radius', 0),
                '--dv-spacing-padding': val('--dv-spacing-padding', 0),
                '--dv-tab-border-radius': val('--dv-tab-border-radius', 0),
                '--dv-sash-border-radius': val('--dv-sash-border-radius', 0),
                '--dv-floating-group-dragging-opacity': fval(
                    '--dv-floating-group-dragging-opacity',
                    0.5
                ),
            });
        };
        // RAF ensures dockview's own effects (which swap the CSS class) have run first
        const id = requestAnimationFrame(read);
        return () => cancelAnimationFrame(id);
    }, [props.open, props.containerEl, props.baseTheme]);

    const [showExport, setShowExport] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    if (!props.open) return null;

    const css = props.state.cssOverrides;

    const set = (patch: Partial<ThemeCssOverrides>) => props.onCssChange(patch);

    const computedVar = (varName: string, fallback: number): number => {
        const override = css[varName as keyof ThemeCssOverrides];
        if (override !== undefined && override !== '')
            return parseInt(override) || fallback;
        return themeDefaults[varName] ?? fallback;
    };

    const draggingOpacity =
        css['--dv-floating-group-dragging-opacity'] !== undefined
            ? parseFloat(css['--dv-floating-group-dragging-opacity'])
            : (themeDefaults['--dv-floating-group-dragging-opacity'] ?? 0.5);

    const tabH = computedVar('--dv-tabs-and-actions-container-height', 35);
    const tabFs = computedVar('--dv-tabs-and-actions-container-font-size', 13);
    const borderRadius = computedVar('--dv-border-radius', 0);
    const spacingPadding = computedVar('--dv-spacing-padding', 0);
    const tabBorderRadius = computedVar('--dv-tab-border-radius', 0);
    const sashBorderRadius = computedVar('--dv-sash-border-radius', 0);

    const code = generateCodeSnippet(props.baseTheme, props.state);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const colorRow = (label: string, varName: keyof ThemeCssOverrides) => (
        <ColorRow
            key={varName}
            label={label}
            varName={varName}
            value={css[varName] ?? ''}
            onChange={(v) =>
                set({ [varName]: v || undefined } as Partial<ThemeCssOverrides>)
            }
            containerEl={props.containerEl}
            themeKey={props.baseTheme.name}
        />
    );

    return (
        <div
            style={{
                width: '300px',
                backgroundColor: '#0d1117',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                flexShrink: 0,
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#0d1117',
                    zIndex: 1,
                }}
            >
                <span
                    style={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '14px',
                    }}
                >
                    Theme Builder
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                        onClick={props.onReset}
                        style={{
                            background: 'none',
                            outline: 'none',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 4,
                            color: 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            padding: '3px 8px',
                            fontSize: 11,
                        }}
                        title="Reset all overrides"
                    >
                        Reset
                    </button>
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
            </div>

            {/* Layout */}
            <Section title="Layout">
                <SliderRow
                    label="Gap"
                    value={props.state.gap}
                    min={0}
                    max={20}
                    onChange={(v) => props.onChange({ gap: v })}
                />
                <SliderRow
                    label="Spacing Padding"
                    value={spacingPadding}
                    min={0}
                    max={30}
                    unit="px"
                    onChange={(v) => set({ '--dv-spacing-padding': `${v}px` })}
                />
                <SliderRow
                    label="Tab Bar Height"
                    value={tabH}
                    min={20}
                    max={60}
                    unit="px"
                    onChange={(v) =>
                        set({
                            '--dv-tabs-and-actions-container-height': `${v}px`,
                        })
                    }
                />
                <SliderRow
                    label="Font Size"
                    value={tabFs}
                    min={10}
                    max={18}
                    unit="px"
                    onChange={(v) =>
                        set({
                            '--dv-tabs-and-actions-container-font-size': `${v}px`,
                        })
                    }
                />
            </Section>

            {/* Radius */}
            <Section title="Radius">
                <SliderRow
                    label="Border Radius"
                    value={borderRadius}
                    min={0}
                    max={20}
                    unit="px"
                    onChange={(v) => set({ '--dv-border-radius': `${v}px` })}
                />
                <SliderRow
                    label="Tab Border Radius"
                    value={tabBorderRadius}
                    min={0}
                    max={20}
                    unit="px"
                    onChange={(v) =>
                        set({ '--dv-tab-border-radius': `${v}px` })
                    }
                />
                <SliderRow
                    label="Sash Border Radius"
                    value={sashBorderRadius}
                    min={0}
                    max={20}
                    unit="px"
                    onChange={(v) =>
                        set({ '--dv-sash-border-radius': `${v}px` })
                    }
                />
            </Section>

            {/* Floating Group */}
            <Section title="Floating Group">
                <TextRow
                    label="Floating Group Border"
                    varName="--dv-floating-group-border"
                    value={css['--dv-floating-group-border'] ?? ''}
                    containerEl={props.containerEl}
                    themeKey={props.baseTheme.name}
                    onChange={(v) =>
                        set({ '--dv-floating-group-border': v || undefined })
                    }
                />
            </Section>

            {/* DnD */}
            <Section title="Drag & Drop">
                <ToggleRow
                    label="DnD Overlay"
                    value={props.state.dndOverlayMounting}
                    options={[
                        { value: 'relative', label: 'relative' },
                        { value: 'absolute', label: 'absolute' },
                    ]}
                    onChange={(v) =>
                        props.onChange({
                            dndOverlayMounting: v as 'relative' | 'absolute',
                        })
                    }
                />
                <ToggleRow
                    label="DnD Panel Target"
                    value={props.state.dndPanelOverlay}
                    options={[
                        { value: 'content', label: 'content' },
                        { value: 'group', label: 'group' },
                    ]}
                    onChange={(v) =>
                        props.onChange({
                            dndPanelOverlay: v as 'content' | 'group',
                        })
                    }
                />
                <ToggleRow
                    label="Tab Indicator"
                    value={props.state.dndTabIndicator}
                    options={[
                        { value: 'fill', label: 'fill' },
                        { value: 'line', label: 'line' },
                    ]}
                    onChange={(v) =>
                        props.onChange({
                            dndTabIndicator: v as 'fill' | 'line',
                        })
                    }
                />
                {colorRow('Drag-over bg', '--dv-drag-over-background-color')}
                <TextRow
                    label="Drag-over border"
                    varName="--dv-drag-over-border"
                    value={props.state.dndOverlayBorder}
                    containerEl={props.containerEl}
                    themeKey={props.baseTheme.name}
                    onChange={(v) =>
                        props.onChange({ dndOverlayBorder: v })
                    }
                />
            </Section>

            {/* Backgrounds */}
            <Section title="Backgrounds">
                {colorRow(
                    'Panel background',
                    '--dv-group-view-background-color'
                )}
                {colorRow(
                    'Tab bar background',
                    '--dv-tabs-and-actions-container-background-color'
                )}
                {colorRow('Separator', '--dv-separator-border')}
                {colorRow(
                    'Pane header border',
                    '--dv-paneview-header-border-color'
                )}
            </Section>

            {/* Active Group Tabs */}
            <Section title="Active Group Tabs">
                {colorRow(
                    'Visible tab bg',
                    '--dv-activegroup-visiblepanel-tab-background-color'
                )}
                {colorRow(
                    'Hidden tab bg',
                    '--dv-activegroup-hiddenpanel-tab-background-color'
                )}
                {colorRow(
                    'Visible tab text',
                    '--dv-activegroup-visiblepanel-tab-color'
                )}
                {colorRow(
                    'Hidden tab text',
                    '--dv-activegroup-hiddenpanel-tab-color'
                )}
            </Section>

            {/* Inactive Group Tabs */}
            <Section title="Inactive Group Tabs">
                {colorRow(
                    'Visible tab bg',
                    '--dv-inactivegroup-visiblepanel-tab-background-color'
                )}
                {colorRow(
                    'Hidden tab bg',
                    '--dv-inactivegroup-hiddenpanel-tab-background-color'
                )}
                {colorRow(
                    'Visible tab text',
                    '--dv-inactivegroup-visiblepanel-tab-color'
                )}
                {colorRow(
                    'Hidden tab text',
                    '--dv-inactivegroup-hiddenpanel-tab-color'
                )}
            </Section>

            {/* Chrome */}
            <Section title="Chrome">
                {colorRow('Tab divider', '--dv-tab-divider-color')}
                {colorRow('Icon hover bg', '--dv-icon-hover-background-color')}
                {colorRow('Active sash', '--dv-active-sash-color')}
                {colorRow('Sash', '--dv-sash-color')}
                {colorRow('Scrollbar', '--dv-scrollbar-background-color')}
            </Section>

            {/* Floating */}
            <Section title="Floating">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 16px',
                        minHeight: 30,
                    }}
                >
                    <span
                        style={{
                            flex: 1,
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.7)',
                        }}
                    >
                        Dragging Opacity
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={draggingOpacity}
                        onChange={(e) =>
                            set({
                                '--dv-floating-group-dragging-opacity':
                                    e.target.value,
                            })
                        }
                        style={{ width: 90 }}
                    />
                    <span
                        style={{
                            width: 36,
                            textAlign: 'right',
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.5)',
                            fontFamily: 'monospace',
                        }}
                    >
                        {draggingOpacity.toFixed(2)}
                    </span>
                </div>
                <TextRow
                    label="Box Shadow"
                    varName="--dv-floating-box-shadow"
                    value={css['--dv-floating-box-shadow'] ?? ''}
                    containerEl={props.containerEl}
                    themeKey={props.baseTheme.name}
                    onChange={(v) =>
                        set({
                            '--dv-floating-box-shadow': v || undefined,
                        })
                    }
                />
                <TextRow
                    label="Border"
                    varName="--dv-floating-border"
                    value={css['--dv-floating-border'] ?? ''}
                    containerEl={props.containerEl}
                    themeKey={props.baseTheme.name}
                    onChange={(v) =>
                        set({
                            '--dv-floating-border': v || undefined,
                        })
                    }
                />
            </Section>

            {/* Export */}
            <Section title="Export">
                <div style={{ padding: '0 16px 8px' }}>
                    <button
                        onClick={() => setShowExport((v) => !v)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 4,
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            padding: '4px 10px',
                            fontSize: 11,
                            marginBottom: showExport ? 8 : 0,
                        }}
                    >
                        {showExport ? 'Hide' : 'Show'} code
                    </button>
                    {showExport && (
                        <div>
                            <pre
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 4,
                                    padding: '8px 10px',
                                    fontSize: 10.5,
                                    color: 'rgba(255,255,255,0.7)',
                                    overflow: 'auto',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre',
                                    margin: 0,
                                    maxHeight: 240,
                                }}
                            >
                                {code}
                            </pre>
                            <button
                                onClick={handleCopy}
                                style={{
                                    marginTop: 6,
                                    background: copied
                                        ? 'rgba(74,222,128,0.15)'
                                        : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${
                                        copied
                                            ? 'rgba(74,222,128,0.3)'
                                            : 'rgba(255,255,255,0.1)'
                                    }`,
                                    borderRadius: 4,
                                    color: copied
                                        ? '#4ade80'
                                        : 'rgba(255,255,255,0.7)',
                                    cursor: 'pointer',
                                    padding: '4px 10px',
                                    fontSize: 11,
                                    width: '100%',
                                }}
                            >
                                {copied ? 'Copied!' : 'Copy to clipboard'}
                            </button>
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
};
