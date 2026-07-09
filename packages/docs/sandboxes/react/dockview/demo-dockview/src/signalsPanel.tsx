import * as React from 'react';
import { usePanelColors } from './panelTheme';
import {
    PanelShell,
    PanelHeader,
    Chip,
    tint,
    hashStr,
    pseudo,
    useTick,
    tnum,
    MONO,
} from './panelKit';

const INSTRUMENTS = [
    'BTC/USD', 'ETH/USD', 'AAPL', 'MSFT', 'NVDA', 'TSLA',
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'WTI', 'SPX',
];
const TFS = ['1D', '1W', '1M'];

// Momentum score in [-100, 100], deterministic per instrument+timeframe with a
// gentle shimmer so the board feels live.
function momentum(inst: string, tf: string, tick: number): number {
    const base = (pseudo(hashStr(inst + tf) * 0.5) * 2 - 1) * 88;
    const drift = Math.sin(tick * 0.5 + hashStr(inst + tf)) * 12;
    return Math.max(-100, Math.min(100, base + drift));
}

const COLS = '1.4fr repeat(3, 1fr) 1.1fr';

const SignalCell: React.FC<{ m: number }> = ({ m }) => {
    const c = usePanelColors();
    const bull = m > 15;
    const bear = m < -15;
    const color = bull ? c.green : bear ? c.red : c.textMuted;
    const label = bull ? 'Bull' : bear ? 'Bear' : 'Flat';
    const strength = Math.abs(m) / 100;
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                padding: '5px 2px',
                background: tint(color, 0.1 + strength * 0.6),
                borderRadius: 3,
            }}
        >
            <span style={{ fontSize: 10, fontWeight: 700, color }}>
                {bull ? '▲' : bear ? '▼' : '■'} {label}
            </span>
            <span style={{ ...tnum, fontSize: 9, color: c.textFaint }}>
                {m >= 0 ? '+' : ''}
                {m.toFixed(0)}
            </span>
        </div>
    );
};

export const SignalsPanel: React.FC = () => {
    const c = usePanelColors();
    const tick = useTick(1500);

    let bulls = 0;
    let bears = 0;
    const rows = INSTRUMENTS.map((inst) => {
        const scores = TFS.map((tf) => momentum(inst, tf, tick));
        const bias = scores.reduce((s, x) => s + x, 0) / scores.length;
        if (bias > 15) bulls++;
        else if (bias < -15) bears++;
        return { inst, scores, bias };
    });

    const HeaderCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <span
            style={{
                fontSize: 9,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: c.textFaint,
                textAlign: 'center',
            }}
        >
            {children}
        </span>
    );

    return (
        <PanelShell>
            <PanelHeader pad="8px 12px 7px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Tech View</span>
                    <span style={{ fontSize: 9.5, color: c.textFaint }}>
                        multi-timeframe bias
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                        <Chip tone="green">{bulls} bull</Chip>
                        <Chip tone="red">{bears} bear</Chip>
                    </div>
                </div>
            </PanelHeader>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: COLS,
                    gap: '0 6px',
                    padding: '5px 10px',
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    background: c.bgSubtle,
                    flexShrink: 0,
                }}
            >
                <HeaderCell>Instrument</HeaderCell>
                {TFS.map((tf) => (
                    <HeaderCell key={tf}>{tf}</HeaderCell>
                ))}
                <HeaderCell>Bias</HeaderCell>
            </div>

            <div className="dv-trade-scroll" style={{ flex: 1, overflow: 'auto', padding: '3px 6px' }}>
                {rows.map((r) => (
                    <div
                        key={r.inst}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: COLS,
                            gap: '0 6px',
                            alignItems: 'stretch',
                            padding: '2px 4px',
                        }}
                    >
                        <span
                            style={{
                                ...tnum,
                                fontSize: 11,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                fontFamily: MONO,
                            }}
                        >
                            {r.inst}
                        </span>
                        {r.scores.map((m, i) => (
                            <SignalCell key={i} m={m} />
                        ))}
                        <SignalCell m={r.bias} />
                    </div>
                ))}
            </div>
        </PanelShell>
    );
};
