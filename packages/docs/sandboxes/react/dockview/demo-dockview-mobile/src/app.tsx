import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    DockviewTheme,
    themeAbyss,
    IContextMenuItemComponentProps,
    GetTabContextMenuItemsParams,
    GetTabGroupChipContextMenuItemsParams,
    DEFAULT_TAB_GROUP_COLORS,
} from 'dockview-react';
// Registers the enterprise modules (edge groups, tab-group chips, context menu,
// …) + sets the docs licence. The docs load this module directly (not
// index.tsx), so both must happen here or the mobile demo loses enterprise
// features / shows the "Unlicensed" watermark on a mobile-only load.
import { LicenseManager } from 'dockview-enterprise';
import * as React from 'react';

LicenseManager.setLicenseKey(
    '[KeyId:DOCKVIEW-DOCS]_[Company:Dockview]_[Plan:team]_[AppName:Dockview_Docs]_[Email:enterprise@dockview.dev]_[ValidFrom:01_Jan_2025]_[ValidUntil:01_Jan_2099]__aaa294ecec1eed47'
);

const FloatMenuItem = ({
    panel,
    api,
    close,
}: IContextMenuItemComponentProps) => {
    return (
        <div
            className="dv-context-menu-item"
            onClick={() => {
                api.addFloatingGroup(panel);
                close();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
            Float tab
        </div>
    );
};

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
                        <div
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
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
    const path = points
        .map((p, i) =>
            i === 0
                ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}`
                : `L${p.x.toFixed(1)},${p.y.toFixed(1)}`
        )
        .join(' ');

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
                <path d={path} fill="none" stroke="#3da45e" strokeWidth={1.5} />
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
    { side: 'BUY', symbol: 'AAPL', qty: 50, price: 192.1, status: 'Filled' },
    { side: 'SELL', symbol: 'TSLA', qty: 25, price: 250.3, status: 'Filled' },
    { side: 'BUY', symbol: 'NVDA', qty: 10, price: 480.5, status: 'Open' },
    { side: 'SELL', symbol: 'MSFT', qty: 30, price: 414.0, status: 'Open' },
    { side: 'BUY', symbol: 'GOOG', qty: 40, price: 137.6, status: 'Cancelled' },
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
                        <div
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
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

const FILES = [
    { name: 'portfolio.json', kind: 'json' },
    { name: 'strategy.ts', kind: 'ts' },
    { name: 'README.md', kind: 'md' },
    { name: 'screener.csv', kind: 'csv' },
    { name: 'notes.txt', kind: 'txt' },
];

const FilesPanel: React.FC<IDockviewPanelProps> = () => {
    return (
        <div style={panelStyle}>
            <div style={{ marginBottom: 8, opacity: 0.7, fontSize: 12 }}>
                WORKSPACE
            </div>
            {FILES.map((f) => (
                <div
                    key={f.name}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 4px',
                        fontSize: 13,
                    }}
                >
                    <span
                        style={{
                            display: 'inline-block',
                            minWidth: 28,
                            padding: '1px 4px',
                            borderRadius: 3,
                            fontSize: 9,
                            textAlign: 'center',
                            background: 'rgba(128,128,128,0.18)',
                            opacity: 0.85,
                        }}
                    >
                        {f.kind}
                    </span>
                    <span>{f.name}</span>
                </div>
            ))}
        </div>
    );
};

const POSITIONS = [
    { symbol: 'AAPL', qty: 120, value: 23080.8, pnl: 412.5 },
    { symbol: 'NVDA', qty: 30, value: 14434.8, pnl: 1145.2 },
    { symbol: 'MSFT', qty: 50, value: 20613.5, pnl: -210.0 },
];

const PositionsPanel: React.FC<IDockviewPanelProps> = () => {
    const total = POSITIONS.reduce((s, p) => s + p.value, 0);
    return (
        <div style={panelStyle}>
            <div style={{ marginBottom: 8, opacity: 0.7, fontSize: 12 }}>
                TOTAL · ${fmt(total, 0)}
            </div>
            {POSITIONS.map((p) => {
                const up = p.pnl >= 0;
                return (
                    <div
                        key={p.symbol}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 4px',
                            borderBottom: '1px solid rgba(128,128,128,0.18)',
                            fontSize: 13,
                        }}
                    >
                        <div>
                            <span style={{ fontWeight: 600 }}>{p.symbol}</span>
                            <span
                                style={{
                                    marginLeft: 8,
                                    opacity: 0.6,
                                    fontSize: 11,
                                }}
                            >
                                {p.qty} sh
                            </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div>${fmt(p.value, 0)}</div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: up ? '#3da45e' : '#d8403a',
                                }}
                            >
                                {up ? '+' : ''}${fmt(p.pnl, 0)}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const NEWS = [
    {
        time: '09:42',
        source: 'Reuters',
        headline: 'Fed minutes signal patience on rate path',
    },
    {
        time: '09:15',
        source: 'Bloomberg',
        headline: 'Nvidia tops $480 ahead of earnings',
    },
    {
        time: '08:58',
        source: 'WSJ',
        headline: 'Apple sets event for new accessory line',
    },
    {
        time: '08:22',
        source: 'FT',
        headline: 'Tesla cuts vehicle prices in three markets',
    },
];

const NewsPanel: React.FC<IDockviewPanelProps> = () => {
    return (
        <div style={panelStyle}>
            {NEWS.map((n, i) => (
                <div
                    key={i}
                    style={{
                        padding: '10px 4px',
                        borderBottom: '1px solid rgba(128,128,128,0.18)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            fontSize: 11,
                            opacity: 0.6,
                        }}
                    >
                        <span>{n.time}</span>
                        <span>·</span>
                        <span>{n.source}</span>
                    </div>
                    <div style={{ fontSize: 13, marginTop: 2 }}>
                        {n.headline}
                    </div>
                </div>
            ))}
        </div>
    );
};

const SEARCH_RESULTS = [
    { file: 'strategy.ts', line: 42, text: 'function rebalance(portfolio)' },
    { file: 'strategy.ts', line: 87, text: '// portfolio drift threshold' },
    { file: 'README.md', line: 12, text: 'Portfolio rebalancing policies' },
];

const SearchPanel: React.FC<IDockviewPanelProps> = () => {
    return (
        <div style={panelStyle}>
            <input
                type="text"
                defaultValue="portfolio"
                style={{
                    width: '100%',
                    padding: '8px 10px',
                    boxSizing: 'border-box',
                    border: '1px solid rgba(128,128,128,0.3)',
                    borderRadius: 6,
                    background: 'transparent',
                    color: 'inherit',
                    fontSize: 14,
                    marginBottom: 12,
                }}
            />
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>
                {SEARCH_RESULTS.length} results
            </div>
            {SEARCH_RESULTS.map((r, i) => (
                <div
                    key={i}
                    style={{
                        padding: '8px 4px',
                        borderBottom: '1px solid rgba(128,128,128,0.18)',
                    }}
                >
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {r.file}:{r.line}
                    </div>
                    <div style={{ fontSize: 13, fontFamily: 'monospace' }}>
                        {r.text}
                    </div>
                </div>
            ))}
        </div>
    );
};

const components = {
    watchlist: WatchlistPanel,
    chart: ChartPanel,
    orders: OrdersPanel,
    positions: PositionsPanel,
    news: NewsPanel,
    files: FilesPanel,
    search: SearchPanel,
};

export interface AppProps {
    theme?: DockviewTheme;
    onReady?: () => void;
}

const App: React.FC<AppProps> = (props) => {
    const [api, setApi] = React.useState<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        const api = event.api;
        setApi(api);

        // Create the left edge group empty here; panels are added later, after
        // the main area is populated. Adding panels with
        // `position: { referenceGroup }` marks the target as the active
        // group, so populating the edge first causes subsequent
        // position-less `addPanel` calls to land in the edge group too.
        const leftEdge = api.addEdgeGroup('left', {
            id: 'left-edge',
            initialSize: 200,
            minimumSize: 140,
            collapsedSize: 32,
            collapsed: true,
        });

        // Primary dockview: the top group is a 4-tab tab group with the
        // trading panels, bottom group is a standalone News panel. The mix
        // demonstrates both a tab group and a single-panel group in the
        // primary area. Portrait phones have far more height than width, so
        // a vertical split is the only one that doesn't crush each region
        // below readability at 375px wide.
        api.addPanel({
            id: 'watchlist',
            component: 'watchlist',
            title: 'Watchlist',
        });
        api.addPanel({
            id: 'chart',
            component: 'chart',
            title: 'Chart',
            position: { referencePanel: 'watchlist', direction: 'within' },
        });
        api.addPanel({
            id: 'orders',
            component: 'orders',
            title: 'Orders',
            position: { referencePanel: 'watchlist', direction: 'within' },
        });
        api.addPanel({
            id: 'positions',
            component: 'positions',
            title: 'Positions',
            position: { referencePanel: 'watchlist', direction: 'within' },
        });

        // `direction: 'below'` against the watchlist panel creates a new
        // group sized via initialHeight so the top stays ~65% on a typical
        // phone viewport. News sits alone as a single-panel group.
        api.addPanel({
            id: 'news',
            component: 'news',
            title: 'News',
            position: { referencePanel: 'watchlist', direction: 'below' },
            initialHeight: 220,
        });

        // Sub-group Orders + Positions into a "Trades" coloured tab group
        // inside the primary top group, demonstrating the tab-group feature
        // alongside the standalone Watchlist / Chart tabs.
        const tradingGroupId = api.getPanel('watchlist')!.api.group.id;
        const tradesTabGroup = api.createTabGroup({
            groupId: tradingGroupId,
            label: 'Trades',
            color: 'green',
        });
        api.addPanelToTabGroup({
            groupId: tradingGroupId,
            tabGroupId: tradesTabGroup.id,
            panelId: 'orders',
        });
        api.addPanelToTabGroup({
            groupId: tradingGroupId,
            tabGroupId: tradesTabGroup.id,
            panelId: 'positions',
        });

        // Populate the edge group last (mirrors the desktop demo's order)
        // so the active-group side-effect of `addPanel({referenceGroup})`
        // doesn't pull the main panels into the edge.
        api.addPanel({
            id: 'files',
            component: 'files',
            title: 'Files',
            position: { referenceGroup: leftEdge.id },
        });
        api.addPanel({
            id: 'search',
            component: 'search',
            title: 'Search',
            position: { referenceGroup: leftEdge.id },
        });

        api.getPanel('watchlist')?.api.setActive();

        props.onReady?.();
    };

    const getTabContextMenuItems = React.useCallback(
        ({ panel, group }: GetTabContextMenuItemsParams) => {
            const items: (
                | 'close'
                | 'closeOthers'
                | 'closeAll'
                | 'closeLeft'
                | 'closeRight'
                | 'maximize'
                | 'separator'
                | { component: React.FC<IContextMenuItemComponentProps> }
                | { label: string; action: () => void }
            )[] = [
                'close',
                'closeOthers',
                'closeAll',
                'closeLeft',
                'closeRight',
                'separator',
                'maximize',
                'separator',
                { component: FloatMenuItem },
            ];

            if (api) {
                const groupId = group.id;
                const panelId = panel.id;
                const tabGroup = api.getTabGroupForPanel({ groupId, panelId });
                const allTabGroups = api.getTabGroups({ groupId });
                const otherTabGroups = allTabGroups.filter(
                    (tg) => tg.id !== tabGroup?.id
                );

                items.push('separator');

                if (tabGroup) {
                    items.push({
                        label: `Remove from "${tabGroup.label || tabGroup.id}"`,
                        action: () =>
                            api.removePanelFromTabGroup({ groupId, panelId }),
                    });
                }

                for (const tg of otherTabGroups) {
                    items.push({
                        label: `Add to "${tg.label || tg.id}"`,
                        action: () =>
                            api.addPanelToTabGroup({
                                groupId,
                                tabGroupId: tg.id,
                                panelId,
                            }),
                    });
                }

                items.push({
                    label: 'Add to new group',
                    action: () => {
                        const label = window.prompt('Group name:') || '';
                        const colors = DEFAULT_TAB_GROUP_COLORS;
                        const color =
                            colors[Math.floor(Math.random() * colors.length)]
                                .id;
                        const newGroup = api.createTabGroup({
                            groupId,
                            label,
                            color,
                        });
                        api.addPanelToTabGroup({
                            groupId,
                            tabGroupId: newGroup.id,
                            panelId,
                        });
                    },
                });
            }

            return items;
        },
        [api]
    );

    const getTabGroupChipContextMenuItems = React.useCallback(
        ({ group, tabGroup }: GetTabGroupChipContextMenuItemsParams) => {
            const items: (
                | 'colorPicker'
                | 'rename'
                | 'collapse'
                | 'close'
                | 'separator'
                | { label: string; action: () => void }
            )[] = ['rename', 'colorPicker', 'collapse', 'close'];

            if (api) {
                items.push(
                    'separator',
                    {
                        label: 'Float group',
                        action: () => api.addFloatingGroup(group),
                    },
                    'separator',
                    {
                        label: 'Dissolve group',
                        action: () =>
                            api.dissolveTabGroup({
                                groupId: group.id,
                                tabGroupId: tabGroup.id,
                            }),
                    }
                );
            }

            return items;
        },
        [api]
    );

    // Fill wrapper: the docs load this module directly (not index.tsx, which
    // wraps it in a height:100% div), so give DockviewReact a sized parent or it
    // collapses to a ~100px intrinsic height. `height: 0` + `flexGrow: 1` (as the
    // desktop demo does) gives a *definite* height so DockviewReact's own
    // `height:100%` root resolves instead of collapsing inside a flex parent.
    return (
        <div
            style={{
                flexGrow: 1,
                height: 0,
                minHeight: 0,
                display: 'flex',
            }}
        >
            <DockviewReact
                components={components}
                onReady={onReady}
                getTabContextMenuItems={getTabContextMenuItems}
                getTabGroupChipContextMenuItems={getTabGroupChipContextMenuItems}
                theme={props.theme ?? themeAbyss}
            />
        </div>
    );
};

export default App;
