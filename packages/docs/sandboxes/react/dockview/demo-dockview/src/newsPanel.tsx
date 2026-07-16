import * as React from 'react';
import { usePanelColors } from './panelTheme';
import { PanelShell, PanelHeader, Chip, tnum } from './panelKit';

type Tone = 'green' | 'red' | 'neutral';
type Headline = {
    ago: string;
    ticker?: string;
    tone: Tone;
    text: string;
    source: string;
};

// Illustrative feed: static headlines, styled to read like a live tape.
const HEADLINES: Headline[] = [
    { ago: '00:12', ticker: 'BTC/USD', tone: 'green', text: 'Bitcoin breaks above $67K as spot ETF inflows accelerate for a fourth session', source: 'Reuters' },
    { ago: '01:48', ticker: 'NVDA', tone: 'green', text: 'NVIDIA lifts data-centre guidance; analysts raise targets on AI demand', source: 'Bloomberg' },
    { ago: '03:05', tone: 'neutral', text: 'Fed minutes: officials split on timing of first rate cut, stress data dependence', source: 'WSJ' },
    { ago: '05:22', ticker: 'TSLA', tone: 'red', text: 'Tesla deliveries miss estimates; margin pressure weighs on shares pre-market', source: 'CNBC' },
    { ago: '07:39', ticker: 'AAPL', tone: 'green', text: 'Apple services revenue hits record; buyback expanded by $110B', source: 'Reuters' },
    { ago: '09:14', tone: 'red', text: 'Crude slips 2% as OPEC+ signals output normalisation into Q3', source: 'Reuters' },
    { ago: '11:50', ticker: 'MSFT', tone: 'green', text: 'Microsoft Azure growth reaccelerates; Copilot seat adoption ahead of plan', source: 'Bloomberg' },
    { ago: '14:03', tone: 'neutral', text: 'Treasury yields steady ahead of $44B 7-year note auction', source: 'MarketWatch' },
    { ago: '16:41', ticker: 'BTC/USD', tone: 'red', text: 'Funding rates cool as leveraged longs unwind into resistance', source: 'CoinDesk' },
    { ago: '19:27', tone: 'green', text: 'Dollar softens as risk sentiment improves across G10 FX', source: 'FT' },
    { ago: '22:10', ticker: 'NVDA', tone: 'neutral', text: 'Supply-chain checks point to steady H200 shipments through year-end', source: 'Nikkei' },
    { ago: '25:55', ticker: 'AAPL', tone: 'red', text: 'Regulators open probe into App Store fees in two jurisdictions', source: 'WSJ' },
    { ago: '29:32', tone: 'neutral', text: 'VIX holds near 13 as index realised vol compresses to multi-month low', source: 'Bloomberg' },
    { ago: '33:08', ticker: 'MSFT', tone: 'green', text: 'Cloud backlog climbs to record as enterprise AI contracts convert', source: 'Reuters' },
];

export const NewsPanel: React.FC = () => {
    const c = usePanelColors();
    return (
        <PanelShell>
            <PanelHeader pad="8px 12px 7px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 6,
                            background: c.red,
                            boxShadow: `0 0 5px ${c.red}`,
                        }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Newswire</span>
                    <span
                        style={{
                            fontSize: 9,
                            letterSpacing: '0.08em',
                            color: c.textFaint,
                            textTransform: 'uppercase',
                        }}
                    >
                        Live
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: c.textFaint, ...tnum }}>
                        {HEADLINES.length} stories
                    </span>
                </div>
            </PanelHeader>

            <div className="dv-trade-scroll" style={{ flex: 1, overflow: 'auto' }}>
                {HEADLINES.map((h, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            gap: 9,
                            padding: '8px 12px',
                            borderBottom: `1px solid ${c.borderSubtle}`,
                            borderLeft: `2px solid ${
                                h.tone === 'green'
                                    ? c.green
                                    : h.tone === 'red'
                                    ? c.red
                                    : 'transparent'
                            }`,
                        }}
                    >
                        <span
                            style={{
                                ...tnum,
                                fontSize: 10,
                                color: c.textFaint,
                                width: 34,
                                flexShrink: 0,
                                paddingTop: 1,
                            }}
                        >
                            {h.ago}
                        </span>
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginBottom: 3,
                                }}
                            >
                                {h.ticker && (
                                    <Chip tone={h.tone === 'neutral' ? 'blue' : h.tone}>
                                        {h.ticker}
                                    </Chip>
                                )}
                                <span style={{ fontSize: 9.5, color: c.textFaint }}>
                                    {h.source}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: 11.5,
                                    lineHeight: 1.4,
                                    color: c.textSecondary,
                                }}
                            >
                                {h.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </PanelShell>
    );
};
