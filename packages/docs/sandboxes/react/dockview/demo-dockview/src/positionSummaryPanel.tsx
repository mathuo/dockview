import * as React from 'react';
import { useMarket, useMarketDispatch, WATCHLIST_TICKERS } from './marketContext';
import { rowData } from './ordersPanel';
import { usePanelColors } from './panelTheme';
import {
    PanelShell,
    PanelHeader,
    StatStrip,
    Stat,
    Chip,
    MiniBar,
    tnum,
    fmtNum,
    fmtCompact,
    fmtSigned,
} from './panelKit';

// Deterministic per-ticker drift so marks (for symbols without a live feed) are
// stable across renders — the data is illustrative, not real.
function hashDrift(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return -0.06 + ((Math.abs(h) % 1000) / 1000) * 0.15;
}

type Position = {
    ticker: string;
    netQty: number;
    long: boolean;
    avgCost: number;
    mark: number;
    uPnl: number;
    notional: number;
    roi: number;
};

const watchlistSet = new Set<string>(WATCHLIST_TICKERS);
const COLS = '58px 40px 1fr 1fr 1fr 40px';

export const PositionSummaryPanel: React.FC = () => {
    const c = usePanelColors();
    const { selectedTicker, prices } = useMarket();
    const dispatch = useMarketDispatch();

    const positions = React.useMemo<Position[]>(() => {
        const agg = new Map<
            string,
            { bq: number; bn: number; sq: number; sn: number }
        >();
        for (const o of rowData) {
            if (o.status !== 'Filled') continue;
            const e = agg.get(o.ticker) ?? { bq: 0, bn: 0, sq: 0, sn: 0 };
            if (o.side === 'Buy') {
                e.bq += o.quantity;
                e.bn += o.notional;
            } else {
                e.sq += o.quantity;
                e.sn += o.notional;
            }
            agg.set(o.ticker, e);
        }
        const list: Position[] = [];
        agg.forEach((e, ticker) => {
            const netQty = e.bq - e.sq;
            if (netQty === 0) return;
            const long = netQty > 0;
            const avgCost = long
                ? e.bq
                    ? e.bn / e.bq
                    : 0
                : e.sq
                ? e.sn / e.sq
                : 0;
            const mark = prices[ticker] ?? avgCost * (1 + hashDrift(ticker));
            const uPnl = (mark - avgCost) * netQty;
            const roi = avgCost
                ? ((mark - avgCost) / avgCost) * 100 * (long ? 1 : -1)
                : 0;
            list.push({
                ticker,
                netQty,
                long,
                avgCost,
                mark,
                uPnl,
                notional: Math.abs(netQty) * mark,
                roi,
            });
        });
        return list.sort((a, b) => Math.abs(b.uPnl) - Math.abs(a.uPnl));
    }, [prices]);

    const totalUPnl = positions.reduce((s, p) => s + p.uPnl, 0);
    const equity = positions.reduce((s, p) => s + p.notional, 0);
    const longExp = positions
        .filter((p) => p.long)
        .reduce((s, p) => s + p.notional, 0);
    const marginUsed = equity * 0.32;
    const maxNotional = Math.max(1, ...positions.map((p) => p.notional));
    const pnlColor = totalUPnl >= 0 ? c.green : c.red;

    return (
        <PanelShell>
            <PanelHeader pad="7px 12px 6px">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            fontSize: 9,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            color: c.textMuted,
                        }}
                    >
                        Net Liq
                    </span>
                    <span
                        style={{
                            ...tnum,
                            fontSize: 17,
                            fontWeight: 700,
                            letterSpacing: '-0.5px',
                            marginLeft: 'auto',
                        }}
                    >
                        ${fmtCompact(equity)}
                    </span>
                    <span style={{ ...tnum, fontSize: 12, fontWeight: 700, color: pnlColor }}>
                        {fmtSigned(totalUPnl)}
                    </span>
                    <Chip tone="blue">{positions.length}</Chip>
                </div>
            </PanelHeader>

            <StatStrip cols={3}>
                <Stat
                    label="Long Exp"
                    value={`$${fmtCompact(longExp)}`}
                    color={c.green}
                />
                <Stat
                    label="Short Exp"
                    value={`$${fmtCompact(equity - longExp)}`}
                    color={c.red}
                />
                <Stat
                    label="Margin"
                    value={`$${fmtCompact(marginUsed)}`}
                    color={c.textSecondary}
                />
            </StatStrip>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: COLS,
                    gap: '0 8px',
                    padding: '4px 10px',
                    fontSize: 9,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: c.textFaint,
                    background: c.bgSubtle,
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    flexShrink: 0,
                }}
            >
                <span>Symbol</span>
                <span>Side</span>
                <span style={{ textAlign: 'right' }}>Avg → Mark</span>
                <span style={{ textAlign: 'right' }}>uPnL</span>
                <span style={{ textAlign: 'right' }}>ROI</span>
                <span style={{ textAlign: 'right' }}>Wt</span>
            </div>

            <div className="dv-trade-scroll" style={{ flex: 1, overflow: 'auto' }}>
                {positions.map((p) => {
                    const isSel = p.ticker === selectedTicker;
                    const pc = p.uPnl >= 0 ? c.green : c.red;
                    const clickable = watchlistSet.has(p.ticker);
                    return (
                        <div
                            key={p.ticker}
                            onClick={() =>
                                clickable &&
                                dispatch({ type: 'SELECT_TICKER', ticker: p.ticker })
                            }
                            style={{
                                display: 'grid',
                                gridTemplateColumns: COLS,
                                gap: '0 8px',
                                alignItems: 'center',
                                padding: '6px 10px',
                                fontSize: 11,
                                cursor: clickable ? 'pointer' : 'default',
                                background: isSel ? c.accentBg : 'transparent',
                                borderLeft: `2px solid ${p.long ? c.green : c.red}`,
                                borderBottom: `1px solid ${c.borderSubtle}`,
                            }}
                        >
                            <span
                                style={{
                                    ...tnum,
                                    fontWeight: 600,
                                    color: isSel ? c.accent : c.text,
                                }}
                            >
                                {p.ticker}
                            </span>
                            <Chip tone={p.long ? 'green' : 'red'}>
                                {p.long ? 'L' : 'S'}
                            </Chip>
                            <span
                                style={{
                                    ...tnum,
                                    textAlign: 'right',
                                    color: c.textMuted,
                                    fontSize: 10,
                                }}
                            >
                                {fmtNum(p.avgCost)}
                                <span style={{ color: c.textFaint }}> → </span>
                                <span style={{ color: c.textSecondary }}>
                                    {fmtNum(p.mark)}
                                </span>
                            </span>
                            <span style={{ ...tnum, textAlign: 'right', color: pc, fontWeight: 600 }}>
                                {fmtSigned(p.uPnl, 0)}
                            </span>
                            <span style={{ ...tnum, textAlign: 'right', color: pc }}>
                                {fmtSigned(p.roi)}%
                            </span>
                            <div style={{ paddingLeft: 4 }}>
                                <MiniBar
                                    pct={(p.notional / maxNotional) * 100}
                                    color={c.accent}
                                    height={4}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </PanelShell>
    );
};
