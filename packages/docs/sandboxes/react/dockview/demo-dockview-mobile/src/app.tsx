import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    DockviewTheme,
    themeAbyss,
} from 'dockview-react';
import * as React from 'react';

// Touch-tuned demo: 3 panels in 1 group at launch. Visitor creates
// multi-group state by long-pressing and dragging a tab.

interface Ticker {
    symbol: string;
    name: string;
    price: number;
    change: number;
}

const TICKERS: Ticker[] = [
    { symbol: 'AAPL', name: 'Apple', price: 192.34, change: 1.21 },
    { symbol: 'NVDA', name: 'Nvidia', price: 481.16, change: 3.84 },
    { symbol: 'MSFT', name: 'Microsoft', price: 412.27, change: -0.43 },
    { symbol: 'GOOG', name: 'Alphabet', price: 138.51, change: 0.62 },
    { symbol: 'TSLA', name: 'Tesla', price: 248.92, change: -1.55 },
    { symbol: 'AMZN', name: 'Amazon', price: 175.12, change: 0.84 },
];

const fmt = (n: number, d = 2) =>
    n.toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    });

const panelStyle: React.CSSProperties = {
    height: '100%',
    overflow: 'auto',
    boxSizing: 'border-box',
    padding: 12,
    color: 'var(--dv-activegroup-visiblepanel-tab-color)',
    fontSize: 14,
};

const WatchlistPanel: React.FC<IDockviewPanelProps> = () => {
    return (
        <div style={panelStyle}>
            {TICKERS.map((t) => {
                const up = t.change >= 0;
                return (
                    <div
                        key={t.symbol}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 4px',
                            borderBottom: '1px solid rgba(128,128,128,0.18)',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{t.symbol}</span>
                            <span style={{ fontSize: 11, opacity: 0.6 }}>
                                {t.name}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                            }}
                        >
                            <span>{fmt(t.price)}</span>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: up ? '#3da45e' : '#d8403a',
                                }}
                            >
                                {up ? '+' : ''}
                                {fmt(t.change)}%
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Simple SVG sparkline. Deterministic so re-mounts don't reflow content
// during demonstration drags.
const ChartPanel: React.FC<IDockviewPanelProps> = () => {
    const W = 320;
    const H = 180;
    const points = React.useMemo(() => {
        const pts: { x: number; y: number }[] = [];
        let v = 100;
        for (let i = 0; i < 80; i++) {
            v += Math.sin(i * 0.7) * 2 + Math.cos(i * 0.31) * 1.5;
            pts.push({ x: (i / 79) * W, y: H - ((v - 80) / 40) * H });
        }
        return pts;
    }, []);
    const path = points.map((p, i) =>
        i === 0
            ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}`
            : `L${p.x.toFixed(1)},${p.y.toFixed(1)}`
    ).join(' ');

    return (
        <div style={panelStyle}>
            <div style={{ marginBottom: 8, opacity: 0.7, fontSize: 12 }}>
                AAPL · 1D · Intraday
            </div>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: 180 }}
            >
                <path
                    d={path}
                    fill="none"
                    stroke="#3da45e"
                    strokeWidth={1.5}
                />
            </svg>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginTop: 12,
                    fontSize: 13,
                }}
            >
                <div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>Open</div>
                    <div>192.10</div>
                </div>
                <div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>High</div>
                    <div>193.84</div>
                </div>
                <div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>Low</div>
                    <div>191.22</div>
                </div>
                <div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>Volume</div>
                    <div>54.2M</div>
                </div>
            </div>
        </div>
    );
};

const ORDERS = [
    { side: 'BUY', symbol: 'AAPL', qty: 50, price: 192.10, status: 'Filled' },
    { side: 'SELL', symbol: 'TSLA', qty: 25, price: 250.30, status: 'Filled' },
    { side: 'BUY', symbol: 'NVDA', qty: 10, price: 480.50, status: 'Open' },
    { side: 'SELL', symbol: 'MSFT', qty: 30, price: 414.00, status: 'Open' },
    { side: 'BUY', symbol: 'GOOG', qty: 40, price: 137.60, status: 'Cancelled' },
];

const OrdersPanel: React.FC<IDockviewPanelProps> = () => {
    return (
        <div style={panelStyle}>
            {ORDERS.map((o, i) => {
                const buy = o.side === 'BUY';
                return (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '10px 4px',
                            borderBottom: '1px solid rgba(128,128,128,0.18)',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span
                                style={{
                                    fontWeight: 600,
                                    color: buy ? '#3da45e' : '#d8403a',
                                }}
                            >
                                {o.side} {o.symbol}
                            </span>
                            <span style={{ fontSize: 11, opacity: 0.6 }}>
                                {o.qty} @ {fmt(o.price)}
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: 11,
                                alignSelf: 'center',
                                opacity: 0.7,
                            }}
                        >
                            {o.status}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const components = {
    watchlist: WatchlistPanel,
    chart: ChartPanel,
    orders: OrdersPanel,
};

export interface AppProps {
    theme?: DockviewTheme;
}

const App: React.FC<AppProps> = (props) => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'watchlist',
            component: 'watchlist',
            title: 'Watchlist',
        });
        event.api.addPanel({
            id: 'chart',
            component: 'chart',
            title: 'Chart',
            position: { referencePanel: 'watchlist', direction: 'within' },
        });
        event.api.addPanel({
            id: 'orders',
            component: 'orders',
            title: 'Orders',
            position: { referencePanel: 'watchlist', direction: 'within' },
        });
        event.api.getPanel('watchlist')?.api.setActive();
    };

    return (
        <DockviewReact
            components={components}
            onReady={onReady}
            theme={props.theme ?? themeAbyss}
        />
    );
};

export default App;
