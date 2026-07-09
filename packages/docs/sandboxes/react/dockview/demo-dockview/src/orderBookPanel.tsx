import * as React from 'react';
import { useMarket, Trade } from './marketContext';
import { usePanelColors } from './panelTheme';
import {
    PanelShell,
    PanelHeader,
    StatStrip,
    Stat,
    SectionLabel,
    Sparkline,
    useFlash,
    tnum,
    fmtPrice,
    fmtNum,
    fmtCompact,
} from './panelKit';

const TICK = 0.5;
const LEVELS = 11;

type Level = { price: number; size: number; total: number };

function weightedSize() {
    return parseFloat((Math.pow(Math.random(), 1.8) * 6 + 0.02).toFixed(4));
}

function buildBook(mid: number): { asks: Level[]; bids: Level[] } {
    const make = (dir: 1 | -1): Level[] => {
        const out: Level[] = [];
        let t = 0;
        for (let i = 0; i < LEVELS; i++) {
            const price = parseFloat((mid + dir * (i + 0.5) * TICK).toFixed(1));
            const size = weightedSize();
            t = parseFloat((t + size).toFixed(4));
            out.push({ price, size, total: t });
        }
        return out;
    };
    return { asks: make(1), bids: make(-1) };
}

const BookRow: React.FC<{
    level: Level;
    maxTotal: number;
    maxSize: number;
    side: 'ask' | 'bid';
}> = ({ level, maxTotal, maxSize, side }) => {
    const c = usePanelColors();
    const depthPct = Math.min((level.total / maxTotal) * 100, 100);
    const sizePct = Math.min((level.size / maxSize) * 100, 100);
    const color = side === 'ask' ? c.red : c.green;
    const bg = side === 'ask' ? c.redBg : c.greenBg;
    return (
        <div
            style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                alignItems: 'center',
                padding: '0 10px',
                height: 17,
                fontSize: 10.5,
                ...tnum,
            }}
        >
            {/* cumulative depth wall — animated via transform:scaleX so it
                composites on the GPU (no per-frame layout/paint). */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: bg,
                    transformOrigin: 'right',
                    transform: `scaleX(${depthPct / 100})`,
                    transition: 'transform 0.3s ease',
                    willChange: 'transform',
                }}
            />
            {/* per-level size intensity */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: bg,
                    opacity: 0.5,
                    transformOrigin: 'right',
                    transform: `scaleX(${sizePct / 100})`,
                    willChange: 'transform',
                }}
            />
            <span style={{ color, zIndex: 1 }}>{fmtPrice(level.price, 1)}</span>
            <span style={{ textAlign: 'right', zIndex: 1, color: c.textSecondary }}>
                {level.size.toFixed(3)}
            </span>
            <span style={{ textAlign: 'right', zIndex: 1, color: c.textFaint }}>
                {level.total.toFixed(2)}
            </span>
        </div>
    );
};

// Memoised: the tape prepends new trades, so existing rows keep the same
// `trade` reference and skip re-rendering on each tick.
const TradeRow: React.FC<{ trade: Trade }> = React.memo(({ trade }) => {
    const c = usePanelColors();
    const [flash, setFlash] = React.useState(true);
    React.useEffect(() => {
        const t = setTimeout(() => setFlash(false), 400);
        return () => clearTimeout(t);
    }, []);
    const color = trade.side === 'buy' ? c.green : c.red;
    const time = new Date(trade.ms).toISOString().slice(11, 19);
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                padding: '1.5px 10px',
                fontSize: 10.5,
                ...tnum,
                background: flash
                    ? trade.side === 'buy'
                        ? c.greenBg
                        : c.redBg
                    : 'transparent',
                transition: 'background 0.4s',
            }}
        >
            <span style={{ color: c.textMuted }}>{time}</span>
            <span style={{ color, textAlign: 'right' }}>{fmtPrice(trade.price, 1)}</span>
            <span style={{ color: c.textSecondary, textAlign: 'right' }}>
                {trade.size.toFixed(3)}
            </span>
        </div>
    );
});

export const OrderBookPanel: React.FC = () => {
    const c = usePanelColors();
    const { selectedTicker, prices, histories, trades } = useMarket();
    const mid = prices[selectedTicker] ?? 0;
    const history = histories[selectedTicker] ?? [mid];
    const prev = history.length > 1 ? history[history.length - 2] : mid;
    const up = mid >= prev;
    const flash = useFlash(mid);

    const book = React.useMemo(() => buildBook(mid), [mid]);
    const maxTotal = Math.max(
        book.asks[LEVELS - 1]?.total ?? 1,
        book.bids[LEVELS - 1]?.total ?? 1
    );
    const maxSize = Math.max(
        ...book.asks.map((l) => l.size),
        ...book.bids.map((l) => l.size)
    );
    const spread =
        book.asks[0] && book.bids[0] ? book.asks[0].price - book.bids[0].price : 0;

    const open = history[0] ?? mid;
    const changePct = open > 0 ? ((mid - open) / open) * 100 : 0;
    const dayHigh = Math.max(...history);
    const dayLow = Math.min(...history);
    const index = mid * 1.0002;
    const funding = up ? 0.0092 : -0.0041;
    // Illustrative, stable-ish derived book stats.
    const vol24 = mid * 1850;
    const oi = mid * 640;

    return (
        <PanelShell alt>
            <PanelHeader>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 2,
                            }}
                        >
                            <span style={{ ...tnum, fontSize: 12, fontWeight: 600 }}>
                                {selectedTicker}
                            </span>
                            <span
                                style={{
                                    fontSize: 8.5,
                                    color: c.textFaint,
                                    border: `1px solid ${c.border}`,
                                    borderRadius: 3,
                                    padding: '0 4px',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                PERP
                            </span>
                        </div>
                        <div
                            style={{
                                ...tnum,
                                fontSize: 22,
                                fontWeight: 700,
                                color: up ? c.green : c.red,
                                letterSpacing: '-0.5px',
                                lineHeight: 1,
                                display: 'inline-block',
                                padding: '0 4px',
                                marginLeft: -4,
                                borderRadius: 3,
                                background:
                                    flash === 'up'
                                        ? c.posStrong
                                        : flash === 'down'
                                        ? c.negStrong
                                        : 'transparent',
                                transition: 'background 0.3s ease',
                            }}
                        >
                            {fmtPrice(mid, 1)}
                        </div>
                        <div style={{ ...tnum, fontSize: 10, color: c.textMuted, marginTop: 3 }}>
                            Index {fmtPrice(index, 1)}
                            <span style={{ color: up ? c.green : c.red, marginLeft: 8 }}>
                                {changePct >= 0 ? '+' : ''}
                                {changePct.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <Sparkline
                        prices={history}
                        color={up ? c.green : c.red}
                        width={96}
                        height={38}
                        fill
                    />
                </div>
            </PanelHeader>

            <StatStrip>
                <Stat label="24h High" value={fmtPrice(dayHigh, 1)} color={c.textSecondary} />
                <Stat label="24h Low" value={fmtPrice(dayLow, 1)} color={c.textSecondary} />
                <Stat label="24h Vol" value={fmtCompact(vol24)} color={c.textSecondary} />
                <Stat label="Open Int" value={fmtCompact(oi)} color={c.textSecondary} />
                <Stat
                    label="Funding"
                    value={`${funding >= 0 ? '+' : ''}${funding.toFixed(4)}%`}
                    color={funding >= 0 ? c.green : c.red}
                />
            </StatStrip>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    padding: '4px 10px',
                    fontSize: 9,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: c.textFaint,
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    flexShrink: 0,
                    ...tnum,
                }}
            >
                <span>Price</span>
                <span style={{ textAlign: 'right' }}>Size</span>
                <span style={{ textAlign: 'right' }}>Total</span>
            </div>

            {/* Book + tape share the remaining height so the ladder always
                shows some depth, even when the panel is short. */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    style={{
                        flex: 3,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        minHeight: 0,
                    }}
                >
                    {[...book.asks].reverse().map((l, i) => (
                        <BookRow
                            key={i}
                            level={l}
                            maxTotal={maxTotal}
                            maxSize={maxSize}
                            side="ask"
                        />
                    ))}
                </div>

                {/* Mid / spread */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 10px',
                        ...tnum,
                        background: c.bgSubtle,
                        borderTop: `1px solid ${c.borderSubtle}`,
                        borderBottom: `1px solid ${c.borderSubtle}`,
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: up ? c.green : c.red,
                        }}
                    >
                        {up ? '▲' : '▼'} {fmtPrice(mid, 1)}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: c.textMuted }}>
                        Spread{' '}
                        <span style={{ color: c.text }}>{fmtNum(spread, 1)}</span>
                        <span style={{ color: c.textFaint }}>
                            {' '}
                            ({((spread / mid) * 100).toFixed(3)}%)
                        </span>
                    </span>
                </div>

                <div style={{ flex: 3, overflow: 'hidden', minHeight: 0 }}>
                    {book.bids.map((l, i) => (
                        <BookRow
                            key={i}
                            level={l}
                            maxTotal={maxTotal}
                            maxSize={maxSize}
                            side="bid"
                        />
                    ))}
                </div>

                <div
                    style={{
                        flex: 2,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    <SectionLabel right="Time · Price · Size">
                        Time &amp; Sales
                    </SectionLabel>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {trades.slice(0, 8).map((t) => (
                            <TradeRow key={t.id} trade={t} />
                        ))}
                    </div>
                </div>
            </div>
        </PanelShell>
    );
};
