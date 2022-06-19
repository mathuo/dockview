import {
    DockviewDefaultTab,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    IDockviewGroupControlProps,
} from 'dockview';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
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
import { BrowserHeader } from '../browserHeader';

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

const headerComponents = {
    default: (props: IDockviewPanelHeaderProps) => {
        const onContextMenu = (event: React.MouseEvent) => {
            event.preventDefault();
            alert('context menu');
        };
        return <DockviewDefaultTab onContextMenu={onContextMenu} {...props} />;
    },
};

import { v4 } from 'uuid';

const Popover = (props: {
    children: React.ReactNode;
    position?: { x: number; y: number };
    close: () => void;
}) => {
    const uuid = React.useMemo(() => v4(), []);

    React.useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                props.close();
            }
        };
        const listener2 = (event: MouseEvent) => {
            let target = event.target;

            while (target) {
                if (target instanceof HTMLElement) {
                    if (target.classList.contains(uuid)) {
                        return;
                    } else {
                        target = target.parentElement;
                    }
                } else {
                    target = undefined;
                }
            }

            props.close();
        };
        window.addEventListener('keypress', listener);
        window.addEventListener('mousedown', listener2);

        return () => {
            window.removeEventListener('keypress', listener);
            window.removeEventListener('mousedown', listener2);
        };
    }, [props.close, uuid]);

    if (!props.position) {
        return;
    }

    return ReactDOM.createPortal(
        <div
            className={uuid}
            style={{
                position: 'absolute',
                top: props.position.y,
                left: props.position.x,
                background: 'white',
                border: '1px solid black',
                zIndex: 99,
                padding: '10px',
            }}
        >
            {props.children}
        </div>,
        document.body
    );
};

const Icon = (props: {
    icon: string;
    onClick?: (event: React.MouseEvent) => void;
}) => {
    return (
        <div className="action" onClick={props.onClick}>
            <span
                style={{ fontSize: 'inherit' }}
                className="material-symbols-outlined"
            >
                {props.icon}
            </span>
        </div>
    );
};

const Button = () => {
    const [position, setPosition] =
        React.useState<{ x: number; y: number } | undefined>(undefined);

    const close = () => setPosition(undefined);

    const onClick = (event: React.MouseEvent) => {
        setPosition({ x: event.pageX, y: event.pageY });
    };

    return (
        <>
            <Icon icon="more_vert" onClick={onClick} />
            {position && (
                <Popover position={position} close={close}>
                    <div>hello</div>
                </Popover>
            )}
        </>
    );
};

const groupControlsComponents = {
    panel_1: () => {
        return <Icon icon="file_download" />;
    },
};

const GroupControls = (props: IDockviewGroupControlProps) => {
    const Component = React.useMemo(() => {
        if (!props.isGroupActive || !props.activePanel) {
            return null;
        }

        return groupControlsComponents[props.activePanel.id];
    }, [props.isGroupActive, props.activePanel]);

    return (
        <div
            className="group-control"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0px 8px',
                height: '100%',
                color: 'var(--dv-activegroup-visiblepanel-tab-color)',
            }}
        >
            {props.isGroupActive && <Icon icon="star" />}
            {Component && <Component />}
            <Button />
        </div>
    );
};

export const DockviewDemo = () => {
    const onReady = (event: DockviewReadyEvent) => {
        const d = localStorage.getItem('test');

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

        event.api.addEmptyGroup();

        event.api.getPanel('panel_1').api.setActive();
    };

    return (
        <div
            id="homepage-dockview-demo"
            style={{
                height: '530px',
                margin: '40px 0px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <BrowserHeader />
            <div style={{ flexGrow: 1 }}>
                <DockviewReact
                    components={components}
                    defaultTabComponent={headerComponents.default}
                    groupControlComponent={GroupControls}
                    onReady={onReady}
                    className="dockview-theme-abyss"
                />
            </div>
        </div>
    );
};
