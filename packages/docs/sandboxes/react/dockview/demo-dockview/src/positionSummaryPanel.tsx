import * as React from 'react';
import { useMarket } from './marketContext';
import { rowData } from './ordersPanel';
import { usePanelColors } from './panelTheme';

function fmtPrice(price: number): string {
    const decimals = price > 1000 ? 1 : 2;
    return price.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function fmtCcy(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const PositionSummaryPanel: React.FC = () => {
    const c = usePanelColors();
    const { selectedTicker, prices } = useMarket();

    // Normalize ticker for matching: watchlist uses e.g. 'AAPL', orders use 'AAPL'
    // BTC/USD won't match any orders (which is fine)
    const filledOrders = React.useMemo(
        () => rowData.filter((o) => o.ticker === selectedTicker && o.status === 'Filled'),
        [selectedTicker]
    );

    const currentPrice = prices[selectedTicker] ?? null;

    const stats = React.useMemo(() => {
        if (filledOrders.length === 0) return null;
        const buys = filledOrders.filter((o) => o.side === 'Buy');
        const sells = filledOrders.filter((o) => o.side === 'Sell');
        const buyQty = buys.reduce((s, o) => s + o.quantity, 0);
        const sellQty = sells.reduce((s, o) => s + o.quantity, 0);
        const buyNotional = buys.reduce((s, o) => s + o.notional, 0);
        const sellNotional = sells.reduce((s, o) => s + o.notional, 0);
        const avgBuy = buyQty > 0 ? buyNotional / buyQty : 0;
        const avgSell = sellQty > 0 ? sellNotional / sellQty : 0;
        const netQty = buyQty - sellQty;
        const pnl =
            currentPrice !== null
                ? buys.reduce((s, o) => s + o.quantity * (currentPrice - o.price), 0) +
                  sells.reduce((s, o) => s + o.quantity * (o.price - currentPrice), 0)
                : null;
        const totalNotional = filledOrders.reduce((s, o) => s + o.notional, 0);
        return { buyQty, sellQty, avgBuy, avgSell, netQty, pnl, totalNotional };
    }, [filledOrders, currentPrice]);

    const rows: { label: string; value: React.ReactNode }[] = currentPrice !== null && stats !== null
        ? [
              { label: 'Current price', value: <span style={{ color: c.text }}>{fmtPrice(currentPrice)}</span> },
              { label: 'Filled orders', value: <span style={{ color: c.text }}>{filledOrders.length}</span> },
              { label: 'Buy qty', value: <span style={{ color: c.green }}>{stats.buyQty.toLocaleString()}</span> },
              { label: 'Sell qty', value: <span style={{ color: c.red }}>{stats.sellQty.toLocaleString()}</span> },
              { label: 'Net position', value: <span style={{ color: stats.netQty >= 0 ? c.green : c.red }}>{stats.netQty >= 0 ? '+' : ''}{stats.netQty.toLocaleString()}</span> },
              { label: 'Avg buy price', value: <span style={{ color: c.textSecondary }}>${fmtCcy(stats.avgBuy)}</span> },
              { label: 'Avg sell price', value: <span style={{ color: c.textSecondary }}>${fmtCcy(stats.avgSell)}</span> },
              { label: 'Total notional', value: <span style={{ color: c.textSecondary }}>${fmtCcy(stats.totalNotional)}</span> },
              {
                  label: 'Unrealised P&L',
                  value: stats.pnl !== null
                      ? <span style={{ color: stats.pnl >= 0 ? c.green : c.red, fontWeight: 700 }}>
                            {stats.pnl >= 0 ? '+' : ''}${fmtCcy(stats.pnl)}
                        </span>
                      : <span style={{ color: c.textFaint }}>—</span>,
              },
          ]
        : [];

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: c.bg,
                color: c.text,
                fontFamily: 'monospace',
                fontSize: 12,
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '6px 12px',
                    borderBottom: `1px solid ${c.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.textMuted }}>
                    Positions
                </span>
                <span style={{ color: c.blue, fontSize: 11 }}>{selectedTicker}</span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {stats === null || currentPrice === null ? (
                    <div style={{ padding: '20px 14px', color: c.textFaint, fontSize: 11, textAlign: 'center' }}>
                        {currentPrice === null
                            ? 'No price data for selected ticker'
                            : `No filled orders for ${selectedTicker}`}
                    </div>
                ) : (
                    <>
                        {/* P&L hero */}
                        {stats.pnl !== null && (
                            <div
                                style={{
                                    padding: '14px',
                                    borderBottom: `1px solid ${c.borderSubtle}`,
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Unrealised P&amp;L
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: stats.pnl >= 0 ? c.green : c.red }}>
                                    {stats.pnl >= 0 ? '+' : ''}${fmtCcy(stats.pnl)}
                                </div>
                            </div>
                        )}

                        {/* Stats rows */}
                        {rows.slice(0, -1).map((row) => (
                            <div
                                key={row.label}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '5px 14px',
                                    borderBottom: `1px solid ${c.borderSubtle}`,
                                }}
                            >
                                <span style={{ color: c.textMuted, fontSize: 11 }}>{row.label}</span>
                                <span>{row.value}</span>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
