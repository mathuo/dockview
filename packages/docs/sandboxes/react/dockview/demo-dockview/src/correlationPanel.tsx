import * as React from 'react';
import { usePanelColors } from './panelTheme';
import {
    PanelShell,
    PanelHeader,
    tint,
    hashStr,
    pseudo,
    useTick,
    tnum,
} from './panelKit';

const ASSETS = ['BTC', 'ETH', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'SPX', 'GOLD'];

// Symmetric, deterministic correlation in [-1, 1] with a small live drift.
function corr(a: number, b: number, tick: number): number {
    if (a === b) return 1;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const base = pseudo(hashStr(`${lo}-${hi}`) * 0.7) * 1.8 - 0.9;
    const drift = Math.sin(tick * 0.4 + lo * 3 + hi) * 0.06;
    return Math.max(-1, Math.min(1, base + drift));
}

export const CorrelationPanel: React.FC = () => {
    const c = usePanelColors();
    const tick = useTick(1500);
    const n = ASSETS.length;

    return (
        <PanelShell>
            <PanelHeader pad="8px 12px 7px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Correlation</span>
                    <span style={{ fontSize: 9.5, color: c.textFaint }}>
                        30d rolling
                    </span>
                    <div
                        style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 9,
                            color: c.textFaint,
                        }}
                    >
                        <span>−1</span>
                        <span
                            style={{
                                width: 60,
                                height: 8,
                                borderRadius: 2,
                                background: `linear-gradient(90deg, ${c.red}, ${c.surface}, ${c.green})`,
                            }}
                        />
                        <span>+1</span>
                    </div>
                </div>
            </PanelHeader>

            <div style={{ flex: 1, overflow: 'auto', padding: 8 }} className="dv-trade-scroll">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `44px repeat(${n}, 1fr)`,
                        gap: 2,
                        minWidth: 420,
                    }}
                >
                    <span />
                    {ASSETS.map((a) => (
                        <span
                            key={a}
                            style={{
                                ...tnum,
                                fontSize: 9.5,
                                fontWeight: 600,
                                textAlign: 'center',
                                color: c.textMuted,
                                paddingBottom: 2,
                            }}
                        >
                            {a}
                        </span>
                    ))}

                    {ASSETS.map((rowA, i) => (
                        <React.Fragment key={rowA}>
                            <span
                                style={{
                                    ...tnum,
                                    fontSize: 9.5,
                                    fontWeight: 600,
                                    color: c.textMuted,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {rowA}
                            </span>
                            {ASSETS.map((colA, j) => {
                                const v = corr(i, j, tick);
                                const pos = v >= 0;
                                const base = pos ? c.green : c.red;
                                const self = i === j;
                                return (
                                    <div
                                        key={colA}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: 30,
                                            borderRadius: 3,
                                            ...tnum,
                                            fontSize: 10,
                                            fontWeight: self ? 700 : 500,
                                            color: self
                                                ? c.textSecondary
                                                : Math.abs(v) > 0.55
                                                ? '#fff'
                                                : c.textSecondary,
                                            background: self
                                                ? c.surface
                                                : tint(base, 0.15 + Math.abs(v) * 0.7),
                                        }}
                                    >
                                        {v.toFixed(2)}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </PanelShell>
    );
};
