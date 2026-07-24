import * as React from 'react';
import { useMarket } from './marketContext';
import { usePanelColors } from './panelTheme';
import {
    PanelShell,
    PanelHeader,
    StatStrip,
    Stat,
    useFlash,
    tnum,
    fmtPrice,
    fmtCompact,
} from './panelKit';

type Candle = {
    o: number;
    h: number;
    l: number;
    c: number;
    up: boolean;
    vol: number;
};

// The market model keeps a flat price history; bucket it into OHLC candles with
// a fabricated volume so the chart reads like a terminal, not a line.
function buildCandles(history: number[], bucket = 4): Candle[] {
    const candles: Candle[] = [];
    for (let i = 0; i < history.length; i += bucket) {
        const slice = history.slice(i, i + bucket);
        if (slice.length === 0) continue;
        const o = slice[0];
        const close = slice[slice.length - 1];
        const h = Math.max(...slice);
        const l = Math.min(...slice);
        candles.push({
            o,
            c: close,
            h,
            l,
            up: close >= o,
            vol: (h - l) * 1200 + 40 + (i % 5) * 30,
        });
    }
    return candles;
}

function useSize() {
    const ref = React.useRef<HTMLDivElement>(null);
    const [size, setSize] = React.useState({ w: 0, h: 0 });
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return [ref, size] as const;
}

export const ChartPanel: React.FC = () => {
    const c = usePanelColors();
    const { selectedTicker, prices, histories } = useMarket();
    const price = prices[selectedTicker] ?? 0;
    const history = histories[selectedTicker] ?? [price];
    const candles = React.useMemo(() => buildCandles(history), [history]);
    const [wrapRef, size] = useSize();
    const flash = useFlash(price);

    const open = history[0] ?? price;
    const high = Math.max(...history);
    const low = Math.min(...history);
    const vwap = history.reduce((s, p) => s + p, 0) / (history.length || 1);
    const change = price - open;
    const changePct = open > 0 ? (change / open) * 100 : 0;
    const up = change >= 0;
    const lastColor = up ? c.green : c.red;

    const padL = 6;
    const padR = 54;
    const padT = 8;
    const padB = 4;
    const { w: W, h: H } = size;
    const volH = Math.min(46, Math.max(28, H * 0.22));
    const plotW = Math.max(0, W - padL - padR);
    const priceH = Math.max(0, H - padT - padB - volH - 6);

    const highs = candles.map((k) => k.h);
    const lows = candles.map((k) => k.l);
    const allHigh = highs.length ? Math.max(...highs) : price;
    const allLow = lows.length ? Math.min(...lows) : price;
    const pad = (allHigh - allLow || 1) * 0.08;
    const min = allLow - pad;
    const max = allHigh + pad;
    const span = max - min || 1;
    const yFor = (v: number) => padT + (1 - (v - min) / span) * priceH;

    const maxVol = Math.max(1, ...candles.map((k) => k.vol));
    const volTop = padT + priceH + 6;
    const slot = plotW / (candles.length || 1);
    const bodyW = Math.max(1, Math.min(slot * 0.62, 11));
    const lastY = yFor(price);
    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * span);

    return (
        <PanelShell alt>
            <PanelHeader>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ ...tnum, fontSize: 12, fontWeight: 600 }}>
                        {selectedTicker}
                    </span>
                    <span
                        style={{
                            ...tnum,
                            fontSize: 18,
                            fontWeight: 700,
                            color: lastColor,
                            letterSpacing: '-0.5px',
                            padding: '0 4px',
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
                        {fmtPrice(price)}
                    </span>
                    <span style={{ ...tnum, fontSize: 11, color: lastColor }}>
                        {up ? '+' : ''}
                        {changePct.toFixed(2)}%
                    </span>
                    <span
                        style={{
                            marginLeft: 'auto',
                            fontSize: 9.5,
                            color: c.textMuted,
                            ...tnum,
                        }}
                    >
                        1m · OHLC
                    </span>
                </div>
            </PanelHeader>

            <StatStrip cols={5}>
                <Stat label="Open" value={fmtPrice(open)} color={c.textSecondary} />
                <Stat label="High" value={fmtPrice(high)} color={c.green} />
                <Stat label="Low" value={fmtPrice(low)} color={c.red} />
                <Stat label="VWAP" value={fmtPrice(vwap)} color={c.blue} />
                <Stat
                    label="Vol"
                    value={fmtCompact(candles.reduce((s, k) => s + k.vol, 0))}
                    color={c.textSecondary}
                />
            </StatStrip>

            <div ref={wrapRef} style={{ flex: 1, minHeight: 0 }}>
                {W > 0 && H > 0 && (
                    <svg width={W} height={H} style={{ display: 'block' }}>
                        {grid.map((g, i) => {
                            const y = yFor(g);
                            return (
                                <g key={`g${i}`}>
                                    <line
                                        x1={padL}
                                        y1={y}
                                        x2={padL + plotW}
                                        y2={y}
                                        stroke={c.gridLine}
                                        strokeWidth={1}
                                    />
                                    <text
                                        x={W - padR + 5}
                                        y={y + 3}
                                        fontSize={9}
                                        fontFamily="monospace"
                                        fill={c.textMuted}
                                    >
                                        {fmtPrice(g)}
                                    </text>
                                </g>
                            );
                        })}

                        {/* volume histogram */}
                        {candles.map((k, i) => {
                            const cx = padL + i * slot + slot / 2;
                            const h = (k.vol / maxVol) * volH;
                            return (
                                <rect
                                    key={`v${i}`}
                                    x={cx - bodyW / 2}
                                    y={volTop + (volH - h)}
                                    width={bodyW}
                                    height={h}
                                    fill={k.up ? c.green : c.red}
                                    opacity={0.35}
                                />
                            );
                        })}

                        {/* candles */}
                        {candles.map((k, i) => {
                            const cx = padL + i * slot + slot / 2;
                            const color = k.up ? c.green : c.red;
                            const top = Math.min(yFor(k.o), yFor(k.c));
                            const bodyH = Math.max(1, Math.abs(yFor(k.c) - yFor(k.o)));
                            return (
                                <g key={`c${i}`}>
                                    <line
                                        x1={cx}
                                        y1={yFor(k.h)}
                                        x2={cx}
                                        y2={yFor(k.l)}
                                        stroke={color}
                                        strokeWidth={1}
                                    />
                                    <rect
                                        x={cx - bodyW / 2}
                                        y={top}
                                        width={bodyW}
                                        height={bodyH}
                                        fill={color}
                                    />
                                </g>
                            );
                        })}

                        {/* VWAP line */}
                        <line
                            x1={padL}
                            y1={yFor(vwap)}
                            x2={padL + plotW}
                            y2={yFor(vwap)}
                            stroke={c.blue}
                            strokeWidth={1}
                            strokeDasharray="2 4"
                            opacity={0.55}
                        />

                        {/* last price */}
                        <line
                            x1={padL}
                            y1={lastY}
                            x2={padL + plotW}
                            y2={lastY}
                            stroke={lastColor}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            opacity={0.8}
                        />
                        <rect
                            x={W - padR}
                            y={lastY - 8}
                            width={padR}
                            height={16}
                            fill={lastColor}
                        />
                        <text
                            x={W - padR + 4}
                            y={lastY + 3}
                            fontSize={9}
                            fontFamily="monospace"
                            fontWeight={700}
                            fill="#ffffff"
                        >
                            {fmtPrice(price)}
                        </text>
                    </svg>
                )}
            </div>
        </PanelShell>
    );
};
