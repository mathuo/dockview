import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';
import { CURRENCIES, Currency, getCurrencies, getPrice } from './api';
import './demo.scss';

const CurrencyRow = (props: { currency: Currency }) => {
    const [price, setPrice] = React.useState<number>();

    React.useEffect(() => {
        getPrice(props.currency.id, 'USD').then((result) => {
            setPrice(Number(result.data.amount));
        });
    }, [props.currency]);

    return (
        <>
            <div>{props.currency.id}</div>
            <div>{`${typeof price === 'number' ? `$${price}` : '-'}`}</div>
        </>
    );
};

const Currencies = () => {
    const [currencies, setCurrencies] = React.useState<Currency[]>([]);

    React.useEffect(() => {
        Promise.all(CURRENCIES.map(getCurrencies)).then((results) => {
            setCurrencies(results.filter(Boolean));
        });
    }, []);

    return (
        <div
            style={{
                height: '100%',
                overflow: 'auto',
                margin: '10px',
            }}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 100px',
                    justifyItems: 'start',
                }}
            >
                {currencies.map((currency) => (
                    <CurrencyRow key={currency.id} currency={currency} />
                ))}
            </div>
        </div>
    );
};

import axios from 'axios';

type Article = {
    id: 15255;
    title: string;
    url: string;
    imageUrl: string;
    newsSite: string;
    summary: string;
    publishedAt: string;
    updatedAt: string;
    featured: boolean;
    launches: any[];
    events: any[];
};

async function getStories(): Promise<Article[]> {
    const response = await axios.get<Article[]>(
        'https://api.spaceflightnewsapi.net/v3/articles'
    );

    return response.data;
}

const News = () => {
    const [stories, setStories] = React.useState<Article[]>([]);

    React.useEffect(() => {
        getStories().then(setStories);
    }, []);

    return (
        <div className="news-panel">
            {stories.map((story) => {
                return (
                    <div className="story">
                        <div className="metadata">
                            <span>{story.title}</span>
                        </div>
                        <div className="link">
                            <a href={story.url}>{story.url.substring(0, 10)}</a>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return <div style={{ padding: '20px' }}>{props.params.title}</div>;
    },
    currencies: Currencies,
    news: News,
};

export const DockviewDemo = () => {
    const onReady = (event: DockviewReadyEvent) => {
        // event.api.addPanel({
        //     id: 'currencies',
        //     component: 'currencies',
        //     title: 'Prices',
        // });

        // event.api.addPanel({
        //     id: 'news',
        //     component: 'news',
        //     title: 'News',
        // });

        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
        });
        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
        });
        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            title: 'Panel 4',
            position: { referencePanel: 'panel_3', direction: 'right' },
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            title: 'Panel 5',
            position: { referencePanel: 'panel_4', direction: 'within' },
        });
        const panel6 = event.api.addPanel({
            id: 'panel_6',
            component: 'default',
            title: 'Panel 6',
            position: { referencePanel: 'panel_4', direction: 'below' },
        });
        panel6.group.locked = true;
        panel6.group.header.hidden = true;
        event.api.addPanel({
            id: 'panel_7',
            component: 'default',
            title: 'Panel 7',
            position: { referencePanel: 'panel_6', direction: 'right' },
        });
        event.api.addPanel({
            id: 'panel_8',
            component: 'default',
            title: 'Panel 8',
            position: { referencePanel: 'panel_7', direction: 'within' },
        });
    };

    return (
        <DockviewReact
            components={components}
            onReady={onReady}
            className="dockview-theme-dark"
        />
    );
};
