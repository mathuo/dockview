import * as React from 'react';
import {
    useMarket,
    useMarketDispatch,
    WATCHLIST_TICKERS,
} from './marketContext';
import { usePanelColors } from './panelTheme';
import {
    PanelShell,
    PanelHeader,
    Chip,
    MiniBar,
    tnum,
    fmtNum,
    fmtCompact,
} from './panelKit';

// Realistic-ish reference prices so order fills, blotter prices and derived
// position P&L land in a believable range (illustrative, not live).
const BASE_PRICES: Record<string, number> = {
    AAPL: 182, GOOGL: 141, MSFT: 415, AMZN: 178, META: 485,
    TSLA: 248, NVDA: 875, JPM: 195, BAC: 38, GS: 425,
    NFLX: 610, AMD: 165, INTC: 43, ORCL: 118, CRM: 285,
};
const TICKERS = Object.keys(BASE_PRICES);

const STATUSES = ['Filled', 'Partially Filled', 'Pending', 'Cancelled'] as const;
const SIDES = ['Buy', 'Sell'] as const;
const TYPES = ['LMT', 'MKT', 'STP', 'LMT', 'LMT'] as const;
const VENUES = ['ARCA', 'NSDQ', 'EDGX', 'BATS', 'IEX'] as const;

export type Order = {
    id: number;
    ticker: string;
    side: string;
    type: string;
    venue: string;
    quantity: number;
    filledQty: number;
    price: number;
    notional: number;
    status: string;
    trader: string;
    time: string;
    ms: number;
};

function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrders(count: number): Order[] {
    return Array.from({ length: count }, (_, i) => {
        const ticker = pick(TICKERS);
        // Fills land within a few percent of the symbol's reference price so
        // derived positions show believable P&L.
        const price = parseFloat(
            (BASE_PRICES[ticker] * (1 + (Math.random() - 0.5) * 0.06)).toFixed(2)
        );
        const quantity = Math.floor(rand(10, 2000));
        const status = pick(STATUSES);
        const filledQty =
            status === 'Filled'
                ? quantity
                : status === 'Partially Filled'
                ? Math.floor(quantity * rand(0.2, 0.8))
                : 0;
        const ms = Date.now() - rand(0, 86400000 * 5);
        const time = new Date(ms).toISOString().replace('T', ' ').slice(0, 19);
        return {
            id: 100000 + i,
            ticker,
            side: pick(SIDES),
            type: pick(TYPES),
            venue: pick(VENUES),
            quantity,
            filledQty,
            price,
            notional: parseFloat((price * quantity).toFixed(2)),
            status,
            trader: pick(['Desk A', 'Desk B', 'Algo', 'PM-1', 'PM-2']),
            time,
            ms,
        };
    }).sort((a, b) => b.ms - a.ms);
}

export const rowData = generateOrders(80);

const STATUS_TONE: Record<string, 'green' | 'yellow' | 'neutral' | 'red'> = {
    Filled: 'green',
    'Partially Filled': 'yellow',
    Pending: 'neutral',
    Cancelled: 'red',
};

const STATUS_SHORT: Record<string, string> = {
    Filled: 'Filled',
    'Partially Filled': 'Partial',
    Pending: 'Working',
    Cancelled: 'Cancel',
};

const watchlistSet = new Set<string>(WATCHLIST_TICKERS);

const COLS = '46px 62px 34px 1fr 1fr 74px 68px 60px';

export const OrdersPanel: React.FC = () => {
    const c = usePanelColors();
    const { selectedTicker } = useMarket();
    const dispatch = useMarketDispatch();

    const working = rowData.filter(
        (o) => o.status === 'Pending' || o.status === 'Partially Filled'
    ).length;
    const filled = rowData.filter((o) => o.status === 'Filled').length;
    const grossNotional = rowData.reduce((s, o) => s + o.notional, 0);

    const HeaderCell: React.FC<{ children: React.ReactNode; right?: boolean }> = ({
        children,
        right,
    }) => (
        <span
            style={{
                fontSize: 9,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: c.textFaint,
                textAlign: right ? 'right' : 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </span>
    );

    return (
        <PanelShell>
            <PanelHeader pad="8px 12px 7px">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <span style={{ fontSize: 11, fontWeight: 600 }}>
                        Order Blotter
                    </span>
                    <Chip tone="yellow">{working} working</Chip>
                    <Chip tone="green">{filled} filled</Chip>
                    <span
                        style={{
                            marginLeft: 'auto',
                            ...tnum,
                            fontSize: 11,
                            color: c.textMuted,
                        }}
                    >
                        Gross ${fmtCompact(grossNotional)}
                    </span>
                </div>
            </PanelHeader>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: COLS,
                    gap: '0 8px',
                    padding: '4px 10px',
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    background: c.bgSubtle,
                    flexShrink: 0,
                }}
            >
                <HeaderCell>Side</HeaderCell>
                <HeaderCell>Symbol</HeaderCell>
                <HeaderCell>Typ</HeaderCell>
                <HeaderCell right>Price</HeaderCell>
                <HeaderCell right>Notional</HeaderCell>
                <HeaderCell>Fill</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell right>Time</HeaderCell>
            </div>

            <div className="dv-trade-scroll" style={{ flex: 1, overflow: 'auto' }}>
                {rowData.map((o, i) => {
                    const buy = o.side === 'Buy';
                    const isSel = o.ticker === selectedTicker;
                    const fillPct =
                        o.quantity > 0 ? (o.filledQty / o.quantity) * 100 : 0;
                    const clickable = watchlistSet.has(o.ticker);
                    return (
                        <div
                            key={o.id}
                            onClick={() =>
                                clickable &&
                                dispatch({
                                    type: 'SELECT_TICKER',
                                    ticker: o.ticker,
                                })
                            }
                            style={{
                                display: 'grid',
                                gridTemplateColumns: COLS,
                                gap: '0 8px',
                                alignItems: 'center',
                                padding: '4px 10px',
                                fontSize: 11,
                                cursor: clickable ? 'pointer' : 'default',
                                borderLeft: `2px solid ${
                                    buy ? c.green : c.red
                                }`,
                                background: isSel
                                    ? c.accentBg
                                    : i % 2
                                    ? c.bgSubtle
                                    : 'transparent',
                                borderBottom: `1px solid ${c.borderSubtle}`,
                            }}
                        >
                            <Chip tone={buy ? 'green' : 'red'}>{o.side}</Chip>
                            <span
                                style={{
                                    ...tnum,
                                    fontWeight: 600,
                                    color: isSel ? c.accent : c.text,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {o.ticker}
                            </span>
                            <span style={{ ...tnum, color: c.textMuted, fontSize: 10 }}>
                                {o.type}
                            </span>
                            <span
                                style={{
                                    ...tnum,
                                    textAlign: 'right',
                                    color: c.textSecondary,
                                }}
                            >
                                {fmtNum(o.price)}
                            </span>
                            <span
                                style={{
                                    ...tnum,
                                    textAlign: 'right',
                                    color: c.textSecondary,
                                }}
                            >
                                {fmtCompact(o.notional)}
                            </span>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                }}
                            >
                                <MiniBar
                                    pct={fillPct}
                                    color={buy ? c.green : c.red}
                                    height={3}
                                />
                                <span
                                    style={{
                                        ...tnum,
                                        fontSize: 9,
                                        color: c.textFaint,
                                        width: 22,
                                        textAlign: 'right',
                                    }}
                                >
                                    {Math.round(fillPct)}%
                                </span>
                            </div>
                            <Chip tone={STATUS_TONE[o.status]}>
                                {STATUS_SHORT[o.status]}
                            </Chip>
                            <span
                                style={{
                                    ...tnum,
                                    fontSize: 10,
                                    color: c.textFaint,
                                    textAlign: 'right',
                                }}
                            >
                                {o.time.slice(11, 16)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </PanelShell>
    );
};
