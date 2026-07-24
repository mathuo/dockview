import * as React from 'react';
import { usePanelColors } from './panelTheme';
import { PanelShell, PanelHeader, heatColor, useTick, tnum } from './panelKit';

const TENORS = ['1W', '2W', '1M', '2M', '3M', '6M', '1Y'];
const DELTAS = ['10dP', '25dP', 'ATM', '25dC', '10dC'];

// Implied vol (%) with a smile across delta and a term structure across tenor,
// plus a gentle live drift. Illustrative.
function iv(tenorIdx: number, deltaIdx: number, tick: number): number {
    const atm = 9 + tenorIdx * 1.4; // rising term structure
    // Smile: wings (10d) richer than ATM.
    const skew = [4.5, 1.8, 0, 1.4, 3.8][deltaIdx];
    const drift = Math.sin(tick * 0.5 + tenorIdx + deltaIdx * 2) * 0.6;
    return atm + skew + drift;
}

export const VolSurfacePanel: React.FC = () => {
    const c = usePanelColors();
    const tick = useTick(1500);

    const values = TENORS.map((_, t) => DELTAS.map((__, d) => iv(t, d, tick)));
    const flat = values.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);
    const range = max - min || 1;

    return (
        <PanelShell>
            <PanelHeader pad="8px 12px 7px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Vol Surface</span>
                    <span style={{ fontSize: 9.5, color: c.textFaint }}>
                        implied vol · by delta / tenor
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
                        <span>{min.toFixed(0)}</span>
                        <span
                            style={{
                                width: 60,
                                height: 8,
                                borderRadius: 2,
                                background: `linear-gradient(90deg, ${heatColor(
                                    0
                                )}, ${heatColor(0.5)}, ${heatColor(1)})`,
                            }}
                        />
                        <span>{max.toFixed(0)}%</span>
                    </div>
                </div>
            </PanelHeader>

            <div style={{ flex: 1, overflow: 'auto', padding: 8 }} className="dv-trade-scroll">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `40px repeat(${DELTAS.length}, 1fr)`,
                        gap: 2,
                        minWidth: 340,
                        height: '100%',
                    }}
                >
                    <span />
                    {DELTAS.map((d) => (
                        <span
                            key={d}
                            style={{
                                ...tnum,
                                fontSize: 9.5,
                                fontWeight: 600,
                                textAlign: 'center',
                                color: c.textMuted,
                                paddingBottom: 2,
                            }}
                        >
                            {d}
                        </span>
                    ))}

                    {TENORS.map((tenor, t) => (
                        <React.Fragment key={tenor}>
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
                                {tenor}
                            </span>
                            {DELTAS.map((d, di) => {
                                const v = values[t][di];
                                return (
                                    <div
                                        key={d}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 3,
                                            ...tnum,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: '#fff',
                                            textShadow: '0 1px 1px rgba(0,0,0,0.35)',
                                            background: heatColor((v - min) / range),
                                        }}
                                    >
                                        {v.toFixed(1)}
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
