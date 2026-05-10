import * as React from 'react';
import { useMarket, useMarketDispatch, WATCHLIST_TICKERS } from './marketContext';
import { usePanelColors } from './panelTheme';

const Sparkline: React.FC<{ prices: number[]; color: string }> = ({ prices, color }) => {
    const W = 56;
    const H = 20;
    if (prices.length < 2) return <div style={{ width: W, height: H }} />;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const pts = prices
        .map((p, i) => {
            const x = (i / (prices.length - 1)) * W;
            const y = H - ((p - min) / range) * (H - 4) - 2;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    return (
        <svg width={W} height={H} style={{ flexShrink: 0 }}>
            <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
};

function fmtPrice(price: number): string {
    const decimals = price > 1000 ? 1 : 2;
    return price.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

export const WatchlistPanel: React.FC = () => {
    const c = usePanelColors();
    const { selectedTicker, prices, histories } = useMarket();
    const dispatch = useMarketDispatch();

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: c.bg,
                color: c.text,
                userSelect: 'none',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '6px 12px',
                    borderBottom: `1px solid ${c.border}`,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: c.textMuted,
                    flexShrink: 0,
                }}
            >
                Watchlist
            </div>

            {/* Column headers */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '0 8px',
                    padding: '4px 12px',
                    fontSize: 10,
                    color: c.textFaint,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    flexShrink: 0,
                }}
            >
                <span>Symbol</span>
                <span style={{ textAlign: 'right' }}>Price</span>
                <span style={{ textAlign: 'right' }}>Chg%</span>
                <span />
            </div>

            {/* Rows */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {WATCHLIST_TICKERS.map((ticker) => {
                    const price = prices[ticker] ?? 0;
                    const history = histories[ticker] ?? [price];
                    const open = history[0] ?? price;
                    const change = price - open;
                    const changePct = open > 0 ? ((change / open) * 100) : 0;
                    const up = change >= 0;
                    const isSelected = ticker === selectedTicker;

                    return (
                        <div
                            key={ticker}
                            onClick={() => dispatch({ type: 'SELECT_TICKER', ticker })}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto auto auto',
                                gap: '0 8px',
                                padding: '7px 12px',
                                alignItems: 'center',
                                cursor: 'pointer',
                                borderBottom: `1px solid ${c.bgSubtle}`,
                                background: isSelected
                                    ? c.blueBg
                                    : 'transparent',
                                borderLeft: isSelected
                                    ? `2px solid ${c.blue}`
                                    : '2px solid transparent',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    (e.currentTarget as HTMLElement).style.background =
                                        c.surface;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    (e.currentTarget as HTMLElement).style.background =
                                        'transparent';
                                }
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    fontFamily: 'monospace',
                                    color: isSelected ? c.blue : c.text,
                                }}
                            >
                                {ticker}
                            </span>
                            <span
                                style={{
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    color: up ? c.green : c.red,
                                    textAlign: 'right',
                                }}
                            >
                                {fmtPrice(price)}
                            </span>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontFamily: 'monospace',
                                    color: up ? c.green : c.red,
                                    textAlign: 'right',
                                    minWidth: 52,
                                }}
                            >
                                {up ? '+' : ''}{changePct.toFixed(2)}%
                            </span>
                            <Sparkline prices={history.slice(-30)} color={up ? c.green : c.red} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
