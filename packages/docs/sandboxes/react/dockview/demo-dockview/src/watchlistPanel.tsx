import * as React from 'react';
import { useMarket, useMarketDispatch, WATCHLIST_TICKERS } from './marketContext';
import { usePanelColors } from './panelTheme';
import {
    PanelShell,
    PanelHeader,
    Chip,
    Sparkline,
    RangeBar,
    useFlash,
    tnum,
    fmtPrice,
    fmtNum,
    fmtSigned,
    fmtCompact,
} from './panelKit';

const META: Record<string, { name: string; vol: number }> = {
    'BTC/USD': { name: 'Bitcoin', vol: 2.4e10 },
    AAPL: { name: 'Apple Inc.', vol: 5.1e10 },
    MSFT: { name: 'Microsoft', vol: 3.3e10 },
    NVDA: { name: 'NVIDIA Corp.', vol: 4.7e10 },
    TSLA: { name: 'Tesla Inc.', vol: 2.9e10 },
};

const WatchRow: React.FC<{ ticker: string }> = ({ ticker }) => {
    const c = usePanelColors();
    const { selectedTicker, prices, histories } = useMarket();
    const dispatch = useMarketDispatch();

    const price = prices[ticker] ?? 0;
    const history = histories[ticker] ?? [price];
    const open = history[0] ?? price;
    const change = price - open;
    const changePct = open > 0 ? (change / open) * 100 : 0;
    const up = change >= 0;
    const isSel = ticker === selectedTicker;
    const low = Math.min(...history);
    const high = Math.max(...history);
    const flash = useFlash(price);

    const [hover, setHover] = React.useState(false);
    const meta = META[ticker] ?? { name: ticker, vol: 0 };

    return (
        <div
            onClick={() => dispatch({ type: 'SELECT_TICKER', ticker })}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                padding: '7px 10px 6px',
                cursor: 'pointer',
                borderBottom: `1px solid ${c.borderSubtle}`,
                borderLeft: `2px solid ${isSel ? c.accent : 'transparent'}`,
                background: isSel
                    ? c.accentBg
                    : hover
                    ? c.surface
                    : 'transparent',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            ...tnum,
                            fontSize: 12,
                            fontWeight: 600,
                            color: isSel ? c.accent : c.text,
                        }}
                    >
                        {ticker}
                    </div>
                    <div
                        style={{
                            fontSize: 9.5,
                            color: c.textFaint,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {meta.name}
                    </div>
                </div>

                <Sparkline
                    prices={history.slice(-40)}
                    color={up ? c.green : c.red}
                    width={54}
                    height={22}
                    fill
                />

                <div style={{ textAlign: 'right', minWidth: 74 }}>
                    <div
                        style={{
                            ...tnum,
                            fontSize: 12,
                            fontWeight: 600,
                            color: up ? c.green : c.red,
                            padding: '0 3px',
                            borderRadius: 3,
                            display: 'inline-block',
                            background:
                                flash === 'up'
                                    ? c.posStrong
                                    : flash === 'down'
                                    ? c.negStrong
                                    : 'transparent',
                            transition: 'background 0.3s ease',
                        }}
                    >
                        {fmtPrice(price)}
                    </div>
                    <div style={{ ...tnum, fontSize: 10, color: up ? c.green : c.red }}>
                        {fmtSigned(changePct)}%
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 5,
                }}
            >
                <span style={{ fontSize: 8.5, color: c.textFaint, width: 26 }}>
                    {fmtNum(low, low >= 1000 ? 0 : 2)}
                </span>
                <div style={{ flex: 1 }}>
                    <RangeBar
                        low={low}
                        high={high}
                        value={price}
                        color={up ? c.green : c.red}
                    />
                </div>
                <span
                    style={{
                        fontSize: 8.5,
                        color: c.textFaint,
                        width: 26,
                        textAlign: 'right',
                    }}
                >
                    {fmtNum(high, high >= 1000 ? 0 : 2)}
                </span>
                <span
                    style={{
                        ...tnum,
                        fontSize: 8.5,
                        color: c.textFaint,
                        width: 40,
                        textAlign: 'right',
                    }}
                >
                    ${fmtCompact(meta.vol)}
                </span>
            </div>
        </div>
    );
};

export const WatchlistPanel: React.FC = () => {
    const c = usePanelColors();
    const { prices, histories } = useMarket();

    let adv = 0;
    let dec = 0;
    for (const t of WATCHLIST_TICKERS) {
        const h = histories[t] ?? [prices[t] ?? 0];
        if ((prices[t] ?? 0) >= (h[0] ?? 0)) {
            adv++;
        } else {
            dec++;
        }
    }

    return (
        <PanelShell>
            <PanelHeader pad="8px 12px 7px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Watchlist</span>
                    <span style={{ ...tnum, fontSize: 10, color: c.textFaint }}>
                        {WATCHLIST_TICKERS.length} symbols
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                        <Chip tone="green">▲ {adv}</Chip>
                        <Chip tone="red">▼ {dec}</Chip>
                    </div>
                </div>
            </PanelHeader>

            <div className="dv-trade-scroll" style={{ flex: 1, overflow: 'auto' }}>
                {WATCHLIST_TICKERS.map((ticker) => (
                    <WatchRow key={ticker} ticker={ticker} />
                ))}
            </div>
        </PanelShell>
    );
};
