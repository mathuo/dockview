import axios from 'axios';

const EXCHANGE_URL = 'https://api.exchange.coinbase.com';

const URL = 'https://api.coinbase.com/v2';

export interface Currency {
    id: string;
    name: string;
    min_size: string;
    max_precision: string;
    status: string;
    details: {
        type: string;
        symbol: string;
        sort_order: number;
        push_payment_methods: string[];
        display_name: string;
        group_types: string[];
    };
}

export interface Price {
    data: { base: string; currency: string; amount: string };
}

export async function allCurrencies(): Promise<Currency[]> {
    try {
        const response = await axios.get<Currency[]>(
            `${EXCHANGE_URL}/currencies`,
            {
                headers: { Accept: 'application/json' },
            }
        );

        return response.data;
    } catch (err) {
        return [];
    }
}

export async function getCurrencies(id: string): Promise<Currency | null> {
    try {
        const response = await axios.get<Currency>(
            `${EXCHANGE_URL}/currencies/${id}`,
            {
                headers: { Accept: 'application/json' },
            }
        );

        return response.data;
    } catch (err) {
        return null;
    }
}

export async function getPrice(base: string, quote: string) {
    try {
        const response = await axios.get<Price>(
            `${URL}/prices/${base}-${quote}/buy`,
            {
                headers: { Accept: 'application/json' },
            }
        );

        return response.data;
    } catch (err) {
        return null;
    }
}

export const CURRENCIES = ['BTC', 'ETH', 'LTC'];
