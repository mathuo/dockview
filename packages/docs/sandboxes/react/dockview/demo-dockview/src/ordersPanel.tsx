import * as React from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    ModuleRegistry,
    ClientSideRowModelModule,
    ColDef,
    ValueFormatterParams,
    CellClassParams,
    RowClickedEvent,
} from 'ag-grid-community';
import { useMarket, useMarketDispatch, WATCHLIST_TICKERS } from './marketContext';
import { usePanelColors } from './panelTheme';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const TICKERS = [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META',
    'TSLA', 'NVDA', 'JPM', 'BAC', 'GS',
    'NFLX', 'AMD', 'INTC', 'ORCL', 'CRM',
];

const STATUSES = ['Filled', 'Partially Filled', 'Pending', 'Cancelled'];
const SIDES = ['Buy', 'Sell'];
const TRADERS = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'];

type Order = {
    id: number;
    ticker: string;
    side: string;
    quantity: number;
    price: number;
    notional: number;
    status: string;
    trader: string;
    time: string;
};

function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrders(count: number): Order[] {
    return Array.from({ length: count }, (_, i) => {
        const price = parseFloat(rand(20, 800).toFixed(2));
        const quantity = Math.floor(rand(10, 2000));
        const time = new Date(Date.now() - rand(0, 86400000 * 5));
        return {
            id: i + 1,
            ticker: pick(TICKERS),
            side: pick(SIDES),
            quantity,
            price,
            notional: parseFloat((price * quantity).toFixed(2)),
            status: pick(STATUSES),
            trader: pick(TRADERS),
            time: time.toISOString().replace('T', ' ').slice(0, 19),
        };
    });
}

export const rowData = generateOrders(80);

const columnDefs: ColDef[] = [
    { field: 'id', headerName: '#', width: 60, sortable: true },
    { field: 'ticker', width: 90, sortable: true, filter: true },
    {
        field: 'side',
        width: 75,
        sortable: true,
        filter: true,
        cellStyle: (p: CellClassParams) => ({
            color: p.value === 'Buy' ? '#4ade80' : '#f87171',
            fontWeight: 600,
        }),
    },
    { field: 'quantity', width: 100, sortable: true },
    {
        field: 'price',
        width: 95,
        sortable: true,
        valueFormatter: (p: ValueFormatterParams) =>
            `$${(p.value as number).toFixed(2)}`,
    },
    {
        field: 'notional',
        headerName: 'Notional',
        width: 120,
        sortable: true,
        valueFormatter: (p: ValueFormatterParams) =>
            `$${(p.value as number).toLocaleString()}`,
    },
    {
        field: 'status',
        width: 130,
        sortable: true,
        filter: true,
        cellStyle: (p: CellClassParams) => {
            const colors: Record<string, string> = {
                Filled: '#4ade80',
                'Partially Filled': '#facc15',
                Pending: '#94a3b8',
                Cancelled: '#f87171',
            };
            return { color: colors[p.value as string] ?? 'inherit' };
        },
    },
    { field: 'trader', width: 100, sortable: true, filter: true },
    { field: 'time', headerName: 'Time', flex: 1, sortable: true },
];

const defaultColDef: ColDef = {
    resizable: true,
};

const watchlistSet = new Set<string>(WATCHLIST_TICKERS);

export const OrdersPanel: React.FC = () => {
    const { selectedTicker } = useMarket();
    const { isDark } = usePanelColors();
    const dispatch = useMarketDispatch();

    const onRowClicked = React.useCallback(
        (event: RowClickedEvent) => {
            const ticker = (event.data as Order).ticker;
            if (watchlistSet.has(ticker)) {
                dispatch({ type: 'SELECT_TICKER', ticker });
            }
        },
        [dispatch]
    );

    const getRowStyle = React.useCallback(
        (params: { data?: Order }) => {
            if (params.data?.ticker === selectedTicker) {
                return { background: 'rgba(96,165,250,0.08)' };
            }
            return undefined;
        },
        [selectedTicker]
    );

    return (
        <div
            className={isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}
            style={{ height: '100%', width: '100%' }}
        >
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowHeight={24}
                headerHeight={28}
                onRowClicked={onRowClicked}
                getRowStyle={getRowStyle}
            />
        </div>
    );
};
