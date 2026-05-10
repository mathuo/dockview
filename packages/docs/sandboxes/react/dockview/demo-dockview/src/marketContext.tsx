import * as React from 'react';

export const WATCHLIST_TICKERS = ['BTC/USD', 'AAPL', 'MSFT', 'NVDA', 'TSLA'] as const;
export type WatchlistTicker = typeof WATCHLIST_TICKERS[number];

const INITIAL_PRICES: Record<string, number> = {
    'BTC/USD': 67432.5,
    'AAPL': 182.5,
    'MSFT': 415.2,
    'NVDA': 875.4,
    'TSLA': 248.3,
};

const HISTORY_LEN = 80;
export const TICK_INTERVAL = 500;

export type Trade = {
    id: number;
    price: number;
    size: number;
    side: 'buy' | 'sell';
    ms: number;
};

export interface MarketState {
    selectedTicker: string;
    prices: Record<string, number>;
    histories: Record<string, number[]>;
    trades: Trade[];
    alertThreshold: number | null;
    alertTriggered: boolean;
}

export type MarketAction =
    | { type: 'SELECT_TICKER'; ticker: string }
    | { type: 'TICK'; deltas: Record<string, number>; trade: Trade | null }
    | { type: 'SET_ALERT'; threshold: number | null }
    | { type: 'DISMISS_ALERT' };

function roundPrice(price: number): number {
    const fixed = price > 1000 ? 1 : price > 10 ? 2 : 4;
    return parseFloat(price.toFixed(fixed));
}

function reducer(state: MarketState, action: MarketAction): MarketState {
    switch (action.type) {
        case 'SELECT_TICKER': {
            return {
                ...state,
                selectedTicker: action.ticker,
                trades: [],
                alertTriggered: false,
                alertThreshold: null,
            };
        }
        case 'TICK': {
            const newPrices = { ...state.prices };
            const newHistories = { ...state.histories };

            for (const ticker of WATCHLIST_TICKERS) {
                const delta = action.deltas[ticker] ?? 0;
                newPrices[ticker] = roundPrice(Math.max(0.01, newPrices[ticker] + delta));
                const hist = [...(newHistories[ticker] ?? [newPrices[ticker]]), newPrices[ticker]];
                newHistories[ticker] = hist.length > HISTORY_LEN ? hist.slice(-HISTORY_LEN) : hist;
            }

            const selectedPrice = newPrices[state.selectedTicker];
            const alertTriggered =
                state.alertThreshold !== null &&
                !state.alertTriggered &&
                selectedPrice >= state.alertThreshold;

            const newTrades = action.trade
                ? [action.trade, ...state.trades].slice(0, 30)
                : state.trades;

            return {
                ...state,
                prices: newPrices,
                histories: newHistories,
                trades: newTrades,
                alertTriggered: state.alertTriggered || alertTriggered,
            };
        }
        case 'SET_ALERT': {
            return { ...state, alertThreshold: action.threshold, alertTriggered: false };
        }
        case 'DISMISS_ALERT': {
            return { ...state, alertTriggered: false };
        }
        default:
            return state;
    }
}

const initialHistories: Record<string, number[]> = {};
for (const ticker of WATCHLIST_TICKERS) {
    initialHistories[ticker] = [INITIAL_PRICES[ticker]];
}

const initialState: MarketState = {
    selectedTicker: 'BTC/USD',
    prices: { ...INITIAL_PRICES },
    histories: initialHistories,
    trades: [],
    alertThreshold: null,
    alertTriggered: false,
};

export const MarketContext = React.createContext<MarketState>(initialState);
export const MarketDispatchContext = React.createContext<React.Dispatch<MarketAction>>(() => {});

export const useMarket = () => React.useContext(MarketContext);
export const useMarketDispatch = () => React.useContext(MarketDispatchContext);

function weightedSize() {
    return parseFloat((Math.pow(Math.random(), 1.8) * 6 + 0.02).toFixed(4));
}

let tradeId = 0;

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = React.useReducer(reducer, initialState);
    const stateRef = React.useRef(state);
    stateRef.current = state;

    React.useEffect(() => {
        const interval = setInterval(() => {
            const s = stateRef.current;
            const deltas: Record<string, number> = {};
            for (const ticker of WATCHLIST_TICKERS) {
                const price = s.prices[ticker];
                // ~0.024% max drift per tick, scaled by price
                deltas[ticker] = (Math.random() - 0.495) * price * 0.00048;
            }
            const selectedPrice = s.prices[s.selectedTicker];
            const selectedDelta = deltas[s.selectedTicker] ?? 0;
            let trade: Trade | null = null;
            if (Math.random() < 0.6) {
                trade = {
                    id: tradeId++,
                    price: selectedPrice,
                    size: weightedSize(),
                    side: selectedDelta >= 0 ? 'buy' : 'sell',
                    ms: Date.now(),
                };
            }
            dispatch({ type: 'TICK', deltas, trade });
        }, TICK_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    return (
        <MarketContext.Provider value={state}>
            <MarketDispatchContext.Provider value={dispatch}>
                {children}
            </MarketDispatchContext.Provider>
        </MarketContext.Provider>
    );
};
