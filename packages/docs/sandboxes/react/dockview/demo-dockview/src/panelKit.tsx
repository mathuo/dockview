import * as React from 'react';
import { usePanelColors } from './panelTheme';

// Shared building blocks so every trading panel reads as one system: dense,
// monospace, layered surfaces with stat tiles, chips, tick flashes and micro
// charts. All are theme-aware through usePanelColors().

// Numeric/tabular data uses IBM Plex Mono (an institutional fintech face,
// loaded in app.scss); labels and prose use a neutral grotesk sans. The
// sans-for-chrome + mono-for-numbers split is what real desks look like and
// reads as designed rather than a wall of default monospace.
export const MONO =
    '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
export const UI =
    '"Inter", "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const tnum: React.CSSProperties = {
    fontFamily: MONO,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em',
};

export function fmtPrice(price: number, decimals?: number): string {
    const d = decimals ?? (price >= 1000 ? 1 : price >= 1 ? 2 : 4);
    return price.toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    });
}

export function fmtNum(n: number, d = 2): string {
    return n.toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    });
}

export function fmtCompact(n: number): string {
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(2);
}

export function fmtSigned(n: number, d = 2): string {
    return (n >= 0 ? '+' : '') + fmtNum(n, d);
}

// Sequential heat ramp (blue → cyan → green → yellow → red) for heatmap cells
// like the vol surface. t in [0,1].
export function heatColor(t: number): string {
    const tt = Math.max(0, Math.min(1, t));
    return `hsl(${(220 - tt * 220).toFixed(0)}, 72%, 48%)`;
}

// Theme-aware tint of a base colour at a given strength (0..1) — used for the
// signal / correlation heat cells so they track light/dark.
export function tint(color: string, strength: number): string {
    const pct = Math.round(Math.max(0, Math.min(1, strength)) * 100);
    return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

export function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return h;
}

// Deterministic pseudo-random in [0,1] from a numeric seed.
export function pseudo(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// A slow re-render tick (returns an incrementing counter) for gentle shimmer on
// otherwise-static heat panels. Stops when the panel is unmounted (hidden).
export function useTick(ms: number): number {
    const [n, setN] = React.useState(0);
    React.useEffect(() => {
        const id = setInterval(() => setN((x) => x + 1), ms);
        return () => clearInterval(id);
    }, [ms]);
    return n;
}

// Track a dockview panel's visibility so mounted-but-hidden panels (renderer:
// 'always' keeps inactive tabs mounted) can stop doing per-tick work.
type VisibilityApi = {
    isVisible: boolean;
    onDidVisibilityChange: (
        cb: (e: { isVisible: boolean }) => void
    ) => { dispose: () => void };
};

export function usePanelVisible(api: VisibilityApi | undefined): boolean {
    // Optimistic: start visible so a real on-screen panel never gets stuck blank
    // if the first isVisible read races dockview's layout; the effect corrects
    // hidden panels to false right after mount.
    const [visible, setVisible] = React.useState(true);
    React.useEffect(() => {
        if (!api) {
            return;
        }
        setVisible(api.isVisible);
        const d = api.onDidVisibilityChange((e) => setVisible(e.isVisible));
        return () => d.dispose();
    }, [api]);
    return visible;
}

// Unmounts its children while the panel is hidden, so live-ticking panels only
// re-render when actually on screen; content re-mounts from shared context when
// the tab is shown again.
export const VisibilityGate: React.FC<{
    api: VisibilityApi | undefined;
    children: React.ReactNode;
}> = ({ api, children }) => {
    const visible = usePanelVisible(api);
    return <div style={{ height: '100%' }}>{visible ? children : null}</div>;
};

// Brief up/down flag after a numeric value changes — drives tick flashes.
export function useFlash(value: number): 'up' | 'down' | null {
    const prev = React.useRef(value);
    const [dir, setDir] = React.useState<'up' | 'down' | null>(null);
    React.useEffect(() => {
        const p = prev.current;
        prev.current = value;
        if (value > p) {
            setDir('up');
        } else if (value < p) {
            setDir('down');
        } else {
            return;
        }
        const t = setTimeout(() => setDir(null), 320);
        return () => clearTimeout(t);
    }, [value]);
    return dir;
}

export const PanelShell: React.FC<{
    children: React.ReactNode;
    alt?: boolean;
}> = ({ children, alt }) => {
    const c = usePanelColors();
    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: alt ? c.bgAlt : c.bg,
                color: c.text,
                userSelect: 'none',
                // Base UI font is sans; numbers opt into mono via `tnum`.
                fontFamily: UI,
                fontSize: 12,
                overflow: 'hidden',
                boxSizing: 'border-box',
                // Isolate each panel's layout + paint so a fast-ticking panel
                // (order book, tiles) doesn't invalidate the rest of the page.
                contain: 'layout paint',
                // A distinct surface + hairline + top highlight so each panel
                // reads as its own card on the dockview frame, whatever theme
                // is active (panel backgrounds intentionally differ from the
                // dock's group background).
                border: `1px solid ${c.border}`,
                boxShadow: `inset 0 1px 0 ${
                    c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)'
                }`,
            }}
        >
            {children}
        </div>
    );
};

export const PanelHeader: React.FC<{
    children: React.ReactNode;
    pad?: string;
}> = ({ children, pad = '9px 12px 8px' }) => {
    const c = usePanelColors();
    return (
        <div
            style={{
                padding: pad,
                background: c.headerGrad,
                borderBottom: `1px solid ${c.border}`,
                boxShadow: c.shadow,
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
            }}
        >
            {children}
        </div>
    );
};

export const SectionLabel: React.FC<{
    children: React.ReactNode;
    right?: React.ReactNode;
}> = ({ children, right }) => {
    const c = usePanelColors();
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 10px',
                fontSize: 9.5,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: c.textMuted,
                background: c.bgSubtle,
                borderBottom: `1px solid ${c.borderSubtle}`,
                borderTop: `1px solid ${c.borderSubtle}`,
                flexShrink: 0,
            }}
        >
            <span>{children}</span>
            {right != null && <span style={{ color: c.textFaint }}>{right}</span>}
        </div>
    );
};

// A row of compact label/value tiles — the stat strips that fill terminal
// headers (24h H/L, volume, VWAP, spread…).
export const StatStrip: React.FC<{ children: React.ReactNode; cols?: number }> = ({
    children,
    cols,
}) => {
    const c = usePanelColors();
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: cols
                    ? `repeat(${cols}, 1fr)`
                    : 'repeat(auto-fit, minmax(56px, 1fr))',
                gap: 1,
                background: c.border,
                borderBottom: `1px solid ${c.border}`,
                flexShrink: 0,
            }}
        >
            {children}
        </div>
    );
};

export const Stat: React.FC<{
    label: string;
    value: React.ReactNode;
    color?: string;
    title?: string;
}> = ({ label, value, color, title }) => {
    const c = usePanelColors();
    return (
        <div
            title={title}
            style={{
                background: c.elevated,
                padding: '5px 8px 6px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minWidth: 0,
            }}
        >
            <span
                style={{
                    fontSize: 9,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: c.textMuted,
                    whiteSpace: 'nowrap',
                }}
            >
                {label}
            </span>
            <span
                style={{
                    ...tnum,
                    fontSize: 11.5,
                    color: color ?? c.textSecondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {value}
            </span>
        </div>
    );
};

export const Chip: React.FC<{
    children: React.ReactNode;
    tone?: 'green' | 'red' | 'blue' | 'yellow' | 'neutral';
    solid?: boolean;
}> = ({ children, tone = 'neutral', solid }) => {
    const c = usePanelColors();
    const map = {
        green: [c.green, c.greenBg],
        red: [c.red, c.redBg],
        blue: [c.blue, c.blueBg],
        yellow: [c.yellow, 'rgba(250,204,21,0.12)'],
        neutral: [c.textMuted, c.chip],
    } as const;
    const [fg, bg] = map[tone];
    // On a solid bright fill, dark text reads better on green/yellow, white on
    // red/blue/neutral — keeps chips legible instead of low-contrast white.
    const solidText =
        tone === 'green' || tone === 'yellow' ? '#04060c' : '#ffffff';
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.04em',
                padding: '1px 5px',
                borderRadius: 3,
                textTransform: 'uppercase',
                color: solid ? solidText : fg,
                background: solid ? fg : bg,
                border: solid ? 'none' : `1px solid ${fg}33`,
                lineHeight: 1.5,
            }}
        >
            {children}
        </span>
    );
};

// Proportion bar (allocation, fill progress, depth).
export const MiniBar: React.FC<{
    pct: number;
    color: string;
    height?: number;
    track?: boolean;
}> = ({ pct, color, height = 4, track = true }) => {
    const c = usePanelColors();
    return (
        <div
            style={{
                height,
                borderRadius: height,
                background: track ? c.surface : 'transparent',
                overflow: 'hidden',
                width: '100%',
            }}
        >
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    background: color,
                    borderRadius: height,
                    transformOrigin: 'left',
                    transform: `scaleX(${Math.max(0, Math.min(100, pct)) / 100})`,
                    transition: 'transform 0.3s ease',
                    willChange: 'transform',
                }}
            />
        </div>
    );
};

// Day-range bar: low ── marker ── high.
export const RangeBar: React.FC<{
    low: number;
    high: number;
    value: number;
    color: string;
}> = ({ low, high, value, color }) => {
    const c = usePanelColors();
    const pct =
        high > low ? ((value - low) / (high - low)) * 100 : 50;
    return (
        <div
            style={{
                position: 'relative',
                height: 3,
                borderRadius: 3,
                background: `linear-gradient(90deg, ${c.red}55, ${c.textFaint}, ${c.green}55)`,
                width: '100%',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: -1.5,
                    left: `${Math.max(0, Math.min(100, pct))}%`,
                    transform: 'translateX(-50%)',
                    width: 2,
                    height: 6,
                    borderRadius: 2,
                    background: color,
                    boxShadow: `0 0 3px ${color}`,
                }}
            />
        </div>
    );
};

export const Sparkline: React.FC<{
    prices: number[];
    color: string;
    width?: number;
    height?: number;
    fill?: boolean;
}> = ({ prices, color, width = 56, height = 20, fill = false }) => {
    // useId() contains ':' which is invalid inside an SVG url(#…) reference,
    // so strip non-alphanumerics before using it as a gradient id.
    const id = 'spk' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
    if (prices.length < 2) {
        return <div style={{ width, height, flexShrink: 0 }} />;
    }
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const pt = (p: number, i: number) => {
        const x = (i / (prices.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - 3) - 1.5;
        return [x, y] as const;
    };
    const line = prices.map((p, i) => pt(p, i).join(',')).join(' ');
    const area = `0,${height} ${line} ${width},${height}`;
    return (
        <svg width={width} height={height} style={{ flexShrink: 0, display: 'block' }}>
            {fill && (
                <>
                    <defs>
                        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <polygon points={area} fill={`url(#${id})`} />
                </>
            )}
            <polyline
                points={line}
                fill="none"
                stroke={color}
                strokeWidth={1.4}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
};
