import * as React from 'react';
import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    themeAbyss,
    themeLight,
} from 'dockview-react';
import { usePanelColors } from './panelTheme';
import { MONO, UI } from './panelKit';
import { ThemeContext } from './app';

type Pair = { sym: string; base: string; price: number; decimals: number };

// Nested dockview: one group, a tab per desk category; each category tab shows
// a grid of live FX quote tiles.
const CATEGORIES: { id: string; label: string; pairs: Pair[] }[] = [
    {
        id: 'g10',
        label: 'G10',
        pairs: [
            { sym: 'EUR/USD', base: 'EUR', price: 1.0832, decimals: 4 },
            { sym: 'GBP/USD', base: 'GBP', price: 1.2638, decimals: 4 },
            { sym: 'USD/JPY', base: 'USD', price: 149.21, decimals: 2 },
            { sym: 'USD/CHF', base: 'USD', price: 0.8842, decimals: 4 },
            { sym: 'USD/CAD', base: 'USD', price: 1.3541, decimals: 4 },
            { sym: 'AUD/USD', base: 'AUD', price: 0.6584, decimals: 4 },
            { sym: 'NZD/USD', base: 'NZD', price: 0.6521, decimals: 4 },
            { sym: 'EUR/JPY', base: 'EUR', price: 161.6, decimals: 2 },
        ],
    },
    {
        id: 'em',
        label: 'EM',
        pairs: [
            { sym: 'USD/CNH', base: 'USD', price: 7.241, decimals: 4 },
            { sym: 'USD/SGD', base: 'USD', price: 1.3452, decimals: 4 },
            { sym: 'USD/INR', base: 'USD', price: 83.21, decimals: 2 },
            { sym: 'USD/MXN', base: 'USD', price: 17.05, decimals: 2 },
            { sym: 'USD/ZAR', base: 'USD', price: 18.62, decimals: 2 },
            { sym: 'USD/TRY', base: 'USD', price: 32.15, decimals: 2 },
        ],
    },
    {
        id: 'crosses',
        label: 'Crosses',
        pairs: [
            { sym: 'EUR/GBP', base: 'EUR', price: 0.8577, decimals: 4 },
            { sym: 'GBP/JPY', base: 'GBP', price: 188.6, decimals: 2 },
            { sym: 'EUR/CHF', base: 'EUR', price: 0.9581, decimals: 4 },
            { sym: 'AUD/JPY', base: 'AUD', price: 98.25, decimals: 2 },
        ],
    },
];

const ALL_PAIRS: Record<string, Pair> = {};
for (const cat of CATEGORIES) {
    for (const p of cat.pairs) {
        ALL_PAIRS[p.sym] = p;
    }
}

type Quote = { bid: number; ask: number; dir: 1 | -1; fracB: number; fracA: number };

const FxQuotesContext = React.createContext<Record<string, Quote>>({});

function splitQuote(value: number, decimals: number) {
    const s = value.toFixed(decimals);
    return { head: s.slice(0, -2), pips: s.slice(-2) };
}

const BigQuote: React.FC<{
    value: number;
    decimals: number;
    frac: number;
    color: string;
}> = ({ value, decimals, frac, color }) => {
    const c = usePanelColors();
    const { head, pips } = splitQuote(value, decimals);
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                fontFamily: MONO,
                lineHeight: 1,
            }}
        >
            <span style={{ fontSize: 14, color: c.textSecondary, fontWeight: 500 }}>
                {head}
            </span>
            <span style={{ fontSize: 34, fontWeight: 700, color, letterSpacing: '-1px' }}>
                {pips}
            </span>
            <span style={{ fontSize: 12, color: c.textMuted, marginLeft: 2 }}>
                {frac}
            </span>
        </div>
    );
};

const FxTile: React.FC<{ pair: Pair; quote: Quote }> = ({ pair, quote }) => {
    const c = usePanelColors();
    const dirColor = quote.dir > 0 ? c.green : c.red;
    const label: React.CSSProperties = { fontSize: 10, color: c.textMuted, fontFamily: UI };
    const foot: React.CSSProperties = {
        fontSize: 8.5,
        color: c.textFaint,
        fontFamily: MONO,
        letterSpacing: '0.03em',
    };
    const sizeChip: React.CSSProperties = {
        fontSize: 8.5,
        fontFamily: MONO,
        color: c.textMuted,
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 2,
        padding: '1px 4px',
    };
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                background: c.bgAlt,
                border: `1px solid ${c.border}`,
                borderRadius: 4,
                overflow: 'hidden',
                minWidth: 0,
                boxShadow: c.shadow,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 7px',
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    background: c.headerGrad,
                }}
            >
                <span style={{ color: dirColor, fontSize: 11 }}>▸</span>
                <span
                    style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: c.text }}
                >
                    {pair.sym}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 8.5, color: c.textFaint }}>
                    Demo Account
                </span>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    padding: '6px 8px 7px',
                    gap: 4,
                    flex: 1,
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={label}>Sell {pair.base}</div>
                    <BigQuote
                        value={quote.bid}
                        decimals={pair.decimals}
                        frac={quote.fracB}
                        color={dirColor}
                    />
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '0 2px',
                    }}
                >
                    <div style={{ display: 'flex', gap: 3 }}>
                        <span style={sizeChip}>200M</span>
                        <span style={sizeChip}>200M</span>
                    </div>
                    <span
                        style={{
                            fontSize: 9,
                            fontFamily: MONO,
                            color: c.textSecondary,
                            background: c.surface,
                            borderRadius: 2,
                            padding: '1px 5px',
                        }}
                    >
                        {(
                            (quote.ask - quote.bid) *
                            (pair.decimals === 2 ? 100 : 10000)
                        ).toFixed(1)}
                    </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={label}>Buy {pair.base}</div>
                    <BigQuote
                        value={quote.ask}
                        decimals={pair.decimals}
                        frac={quote.fracA}
                        color={dirColor}
                    />
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '3px 8px',
                    borderTop: `1px solid ${c.borderSubtle}`,
                }}
            >
                <span style={foot}>SW · SPOT</span>
                <span style={foot}>1,000,000</span>
                <span style={foot}>08 Feb</span>
            </div>
        </div>
    );
};

// A category tab in the nested dockview — a grid of tiles for its pairs.
const FxCategoryPanel: React.FC<IDockviewPanelProps<{ categoryId: string }>> = (
    props
) => {
    const c = usePanelColors();
    const quotes = React.useContext(FxQuotesContext);
    const cat = CATEGORIES.find((x) => x.id === props.params.categoryId);
    if (!cat) {
        return null;
    }
    return (
        <div
            className="dv-trade-scroll"
            style={{
                height: '100%',
                overflow: 'auto',
                padding: 8,
                boxSizing: 'border-box',
                // Only a top border: the outer FX card (fxTilesPanel wrapper)
                // already frames the other three sides, so a full border here
                // would double up against it. This top edge is the header
                // divider under the G10/EM/Crosses tabs — matching a normal
                // panel's `PanelHeader` divider inside its card.
                borderTop: `1px solid ${c.border}`,
                background: c.bg,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(186px, 1fr))',
                gridAutoRows: '108px',
                gap: 8,
            }}
        >
            {cat.pairs.map((p) => {
                const q = quotes[p.sym];
                return q ? <FxTile key={p.sym} pair={p} quote={q} /> : null;
            })}
        </div>
    );
};

const nestedComponents = { fxcat: FxCategoryPanel };

export const FxTilesPanel: React.FC = () => {
    const c = usePanelColors();
    // Use the parent demo's live theme so the nested dockview follows the theme
    // picker / builder exactly (not just a light/dark approximation).
    const parentTheme = React.useContext(ThemeContext);
    const theme = parentTheme ?? (c.isDark ? themeAbyss : themeLight);

    const [quotes, setQuotes] = React.useState<Record<string, Quote>>(() => {
        const q: Record<string, Quote> = {};
        for (const sym of Object.keys(ALL_PAIRS)) {
            const p = ALL_PAIRS[sym];
            const spread = (p.decimals === 2 ? 0.03 : 0.0003) * (0.6 + Math.random());
            q[sym] = {
                bid: p.price - spread / 2,
                ask: p.price + spread / 2,
                dir: 1,
                fracB: 5,
                fracA: 2,
            };
        }
        return q;
    });

    React.useEffect(() => {
        const id = setInterval(() => {
            setQuotes((prev) => {
                const next: Record<string, Quote> = {};
                for (const sym of Object.keys(ALL_PAIRS)) {
                    const p = ALL_PAIRS[sym];
                    const cur = prev[sym];
                    const mid = (cur.bid + cur.ask) / 2;
                    const step = p.decimals === 2 ? 0.02 : 0.0002;
                    const delta = (Math.random() - 0.5) * step * 3;
                    const newMid = mid + delta;
                    const spread =
                        (p.decimals === 2 ? 0.03 : 0.0003) * (0.6 + Math.random());
                    next[sym] = {
                        bid: newMid - spread / 2,
                        ask: newMid + spread / 2,
                        dir: delta >= 0 ? 1 : -1,
                        fracB: Math.floor(Math.random() * 10),
                        fracA: Math.floor(Math.random() * 10),
                    };
                }
                return next;
            });
        }, 900);
        return () => clearInterval(id);
    }, []);

    const onReady = React.useCallback((event: DockviewReadyEvent) => {
        const api = event.api;
        CATEGORIES.forEach((cat, i) => {
            api.addPanel({
                id: cat.id,
                component: 'fxcat',
                title: cat.label,
                params: { categoryId: cat.id },
                position:
                    i === 0
                        ? undefined
                        : { referencePanel: CATEGORIES[0].id, direction: 'within' },
            });
        });
        api.getPanel(CATEGORIES[0].id)?.api.setActive();
    }, []);

    return (
        <FxQuotesContext.Provider value={quotes}>
            <div
                style={{
                    height: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    background: c.bg,
                    // Match every other panel's `PanelShell`: a full hairline
                    // card border (+ the same subtle top highlight) around the
                    // panel content — here the nested dockview — so the FX panel
                    // reads as a card like the rest.
                    border: `1px solid ${c.border}`,
                    boxShadow: `inset 0 1px 0 ${
                        c.isDark
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(255,255,255,0.7)'
                    }`,
                }}
            >
                <DockviewReact
                    components={nestedComponents}
                    onReady={onReady}
                    theme={theme}
                />
            </div>
        </FxQuotesContext.Provider>
    );
};
