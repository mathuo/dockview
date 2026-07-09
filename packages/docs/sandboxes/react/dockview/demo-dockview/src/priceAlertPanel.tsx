import * as React from 'react';
import { useMarket, useMarketDispatch } from './marketContext';
import { usePanelColors } from './panelTheme';
import {
    PanelShell,
    PanelHeader,
    Chip,
    useFlash,
    tnum,
    fmtPrice,
} from './panelKit';

export const PriceAlertPanel: React.FC = () => {
    const c = usePanelColors();
    const { selectedTicker, prices, alertThreshold, alertTriggered } = useMarket();
    const dispatch = useMarketDispatch();
    const [inputValue, setInputValue] = React.useState('');

    const currentPrice = prices[selectedTicker] ?? 0;
    const flash = useFlash(currentPrice);

    React.useEffect(() => {
        setInputValue(currentPrice > 0 ? fmtPrice(currentPrice) : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTicker]);

    const onSet = () => {
        const val = parseFloat(inputValue.replace(/,/g, ''));
        if (!isNaN(val) && val > 0) {
            dispatch({ type: 'SET_ALERT', threshold: val });
        }
    };
    const onClear = () => {
        dispatch({ type: 'SET_ALERT', threshold: null });
        setInputValue('');
    };

    const hasTarget = alertThreshold !== null && !alertTriggered;
    const distancePct =
        alertThreshold && currentPrice
            ? ((alertThreshold - currentPrice) / currentPrice) * 100
            : 0;

    // Gauge range spans current price and target with a little padding.
    const lo = alertThreshold
        ? Math.min(currentPrice, alertThreshold) * 0.995
        : currentPrice * 0.985;
    const hi = alertThreshold
        ? Math.max(currentPrice, alertThreshold) * 1.005
        : currentPrice * 1.015;
    const posFor = (v: number) =>
        Math.max(2, Math.min(98, ((v - lo) / (hi - lo || 1)) * 100));

    const input: React.CSSProperties = {
        flex: 1,
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        color: c.text,
        fontFamily: tnum.fontFamily,
        fontSize: 12,
        padding: '6px 9px',
        outline: 'none',
        height: 'auto',
        minWidth: 0,
    };

    return (
        <PanelShell>
            {alertTriggered && (
                <div
                    style={{
                        padding: '10px 14px',
                        background: c.redBg,
                        borderBottom: `1px solid ${c.red}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flexShrink: 0,
                    }}
                >
                    <span style={{ fontSize: 16 }}>🔔</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: c.red, fontWeight: 700, fontSize: 12 }}>
                            Alert triggered
                        </div>
                        <div style={{ color: c.textMuted, fontSize: 11, marginTop: 1 }}>
                            {selectedTicker} reached{' '}
                            <span style={{ color: c.red }}>{fmtPrice(currentPrice)}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'DISMISS_ALERT' })}
                        style={{
                            background: 'none',
                            border: `1px solid ${c.red}`,
                            color: c.red,
                            cursor: 'pointer',
                            padding: '3px 10px',
                            borderRadius: 4,
                            fontSize: 11,
                            height: 'auto',
                            outline: 'none',
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <PanelHeader pad="8px 12px 7px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Price Alert</span>
                    <Chip tone="blue">{selectedTicker}</Chip>
                    {hasTarget && (
                        <span style={{ marginLeft: 'auto' }}>
                            <Chip tone="yellow">Armed</Chip>
                        </span>
                    )}
                </div>
            </PanelHeader>

            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                        <div
                            style={{
                                fontSize: 9,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: c.textMuted,
                                marginBottom: 4,
                            }}
                        >
                            Last price
                        </div>
                        <div
                            style={{
                                ...tnum,
                                fontSize: 24,
                                fontWeight: 700,
                                letterSpacing: '-0.5px',
                                padding: '0 4px',
                                marginLeft: -4,
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
                            {fmtPrice(currentPrice)}
                        </div>
                    </div>
                    {hasTarget && (
                        <div style={{ textAlign: 'right' }}>
                            <div
                                style={{
                                    fontSize: 9,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: c.textMuted,
                                    marginBottom: 4,
                                }}
                            >
                                To target
                            </div>
                            <div
                                style={{
                                    ...tnum,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: distancePct >= 0 ? c.green : c.red,
                                }}
                            >
                                {distancePct >= 0 ? '+' : ''}
                                {distancePct.toFixed(2)}%
                            </div>
                        </div>
                    )}
                </div>

                {hasTarget && (
                    <div style={{ position: 'relative', height: 26 }}>
                        <div
                            style={{
                                position: 'absolute',
                                top: 11,
                                left: 0,
                                right: 0,
                                height: 4,
                                borderRadius: 4,
                                background: c.surface,
                            }}
                        />
                        {/* current price marker */}
                        <Marker
                            posPct={posFor(currentPrice)}
                            color={c.text}
                            label="now"
                        />
                        {/* target marker */}
                        <Marker
                            posPct={posFor(alertThreshold!)}
                            color={c.yellow}
                            label="target"
                            up
                        />
                    </div>
                )}

                <div>
                    <div
                        style={{
                            fontSize: 9,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: c.textMuted,
                            marginBottom: 6,
                        }}
                    >
                        Alert when price reaches
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSet()}
                            placeholder={fmtPrice(currentPrice)}
                            style={input}
                        />
                        <button
                            onClick={onSet}
                            style={{
                                background: c.accentBg,
                                border: `1px solid ${c.accent}`,
                                color: c.accent,
                                cursor: 'pointer',
                                padding: '6px 14px',
                                borderRadius: 4,
                                fontSize: 12,
                                fontFamily: tnum.fontFamily,
                                height: 'auto',
                                outline: 'none',
                                flexShrink: 0,
                            }}
                        >
                            Set
                        </button>
                    </div>
                </div>

                {hasTarget && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            background: c.accentBg,
                            border: `1px solid ${c.accent}`,
                            borderRadius: 6,
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 9, color: c.textMuted, marginBottom: 2 }}>
                                Alert armed at
                            </div>
                            <div style={{ ...tnum, color: c.accent, fontSize: 13, fontWeight: 600 }}>
                                {fmtPrice(alertThreshold!)}
                            </div>
                        </div>
                        <button
                            onClick={onClear}
                            style={{
                                background: 'none',
                                border: `1px solid ${c.border}`,
                                color: c.textMuted,
                                cursor: 'pointer',
                                padding: '4px 10px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontFamily: tnum.fontFamily,
                                height: 'auto',
                                outline: 'none',
                            }}
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>
        </PanelShell>
    );
};

const Marker: React.FC<{
    posPct: number;
    color: string;
    label: string;
    up?: boolean;
}> = ({ posPct, color, label, up }) => {
    const c = usePanelColors();
    return (
        <div
            style={{
                position: 'absolute',
                top: up ? 0 : 7,
                left: `${posPct}%`,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: up ? 'column' : 'column-reverse',
                alignItems: 'center',
            }}
        >
            {up && (
                <span style={{ fontSize: 8, color, ...tnum, marginBottom: 1 }}>
                    {label}
                </span>
            )}
            <div
                style={{
                    width: 2,
                    height: 12,
                    background: color,
                    borderRadius: 2,
                    boxShadow: `0 0 4px ${color}`,
                }}
            />
            {!up && (
                <span style={{ fontSize: 8, color: c.textFaint, ...tnum, marginTop: 1 }}>
                    {label}
                </span>
            )}
        </div>
    );
};
