import * as React from 'react';
import { useMarket, useMarketDispatch } from './marketContext';
import { usePanelColors } from './panelTheme';

function fmtPrice(price: number): string {
    const decimals = price > 1000 ? 1 : 2;
    return price.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

export const PriceAlertPanel: React.FC = () => {
    const c = usePanelColors();
    const { selectedTicker, prices, alertThreshold, alertTriggered } = useMarket();
    const dispatch = useMarketDispatch();
    const [inputValue, setInputValue] = React.useState('');

    const currentPrice = prices[selectedTicker] ?? 0;

    // Pre-fill input when ticker changes
    React.useEffect(() => {
        setInputValue(currentPrice > 0 ? fmtPrice(currentPrice) : '');
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

    const onDismiss = () => {
        dispatch({ type: 'DISMISS_ALERT' });
    };

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
            {/* Alert banner */}
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
                        animation: 'pulse 1s ease-in-out 3',
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
                            {alertThreshold != null && (
                                <> (threshold: {fmtPrice(alertThreshold)})</>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onDismiss}
                        style={{
                            background: 'none',
                            border: `1px solid ${c.red}`,
                            color: c.red,
                            cursor: 'pointer',
                            padding: '3px 10px',
                            borderRadius: 3,
                            fontSize: 11,
                            height: 'auto',
                            outline: 'none',
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            )}

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
                <span
                    style={{
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: c.textMuted,
                    }}
                >
                    Price Alert
                </span>
                <span style={{ color: c.blue, fontSize: 11 }}>{selectedTicker}</span>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Current price */}
                <div>
                    <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Current price
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c.text, letterSpacing: '-0.5px' }}>
                        {fmtPrice(currentPrice)}
                    </div>
                </div>

                {/* Alert threshold input */}
                <div>
                    <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Alert when price reaches
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSet()}
                            placeholder={fmtPrice(currentPrice)}
                            style={{
                                flex: 1,
                                background: c.surface,
                                border: `1px solid ${c.border}`,
                                borderRadius: 3,
                                color: c.text,
                                fontFamily: 'monospace',
                                fontSize: 12,
                                padding: '5px 8px',
                                outline: 'none',
                                height: 'auto',
                            }}
                        />
                        <button
                            onClick={onSet}
                            style={{
                                background: c.blueBg,
                                border: `1px solid ${c.blue}`,
                                color: c.blue,
                                cursor: 'pointer',
                                padding: '5px 12px',
                                borderRadius: 3,
                                fontSize: 12,
                                fontFamily: 'monospace',
                                height: 'auto',
                                outline: 'none',
                                flexShrink: 0,
                            }}
                        >
                            Set
                        </button>
                    </div>
                </div>

                {/* Active alert status */}
                {alertThreshold !== null && !alertTriggered && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            background: c.blueBg,
                            border: `1px solid ${c.blue}`,
                            borderRadius: 4,
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 2 }}>
                                Alert active
                            </div>
                            <div style={{ color: c.blue, fontSize: 12 }}>
                                {fmtPrice(alertThreshold)}
                            </div>
                        </div>
                        <button
                            onClick={onClear}
                            style={{
                                background: 'none',
                                border: `1px solid ${c.border}`,
                                color: c.textMuted,
                                cursor: 'pointer',
                                padding: '3px 8px',
                                borderRadius: 3,
                                fontSize: 11,
                                fontFamily: 'monospace',
                                height: 'auto',
                                outline: 'none',
                            }}
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
