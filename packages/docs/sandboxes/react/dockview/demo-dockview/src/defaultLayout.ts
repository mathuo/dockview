import { DockviewApi } from 'dockview-react';

export const nextId = (() => {
    let counter = 0;
    return () => counter++;
})();

export function defaultConfig(api: DockviewApi) {
    // Left column: standalone tab before the Market Data group
    const news = api.addPanel({
        id: 'news',
        component: 'default',
        title: 'News',
    });

    // Watchlist and Price Alert will be grouped under "Market Data"
    const watchlist = api.addPanel({
        id: 'watchlist',
        component: 'watchlist',
        title: 'Watchlist',
        renderer: 'always',
        position: { referencePanel: news },
    });

    const pricealert = api.addPanel({
        id: 'pricealert',
        component: 'pricealert',
        title: 'Price Alert',
        renderer: 'always',
        position: { referencePanel: watchlist },
    });

    // Standalone tab after the Market Data group
    api.addPanel({
        id: 'research',
        component: 'default',
        title: 'Research',
        position: { referencePanel: pricealert },
    });

    // Centre column: order book (top) + orders grid (bottom)
    const orderbook = api.addPanel({
        id: 'orderbook',
        component: 'orderbook',
        title: 'Order Book',
        renderer: 'always',
        position: { referencePanel: watchlist, direction: 'right' },
    });

    const orders = api.addPanel({
        id: 'orders',
        component: 'orders',
        title: 'Orders',
        renderer: 'always',
        position: { referencePanel: orderbook, direction: 'below' },
    });

    api.addPanel({
        id: 'vesselfinder',
        component: 'vesselfinder',
        title: 'VesselFinder',
        position: { referencePanel: orders },
    });

    // Right column: position summary (top) + dev panels (bottom, tabbed)
    const positionsummary = api.addPanel({
        id: 'positionsummary',
        component: 'positionsummary',
        title: 'Positions',
        renderer: 'always',
        position: { referencePanel: orderbook, direction: 'right' },
    });

    const eventlog = api.addPanel({
        id: 'eventlog',
        component: 'eventlog',
        title: 'Events',
        renderer: 'always',
        position: { referencePanel: positionsummary, direction: 'below' },
    });

    api.addPanel({
        id: 'layoutinspector',
        component: 'layoutinspector',
        title: 'Layout JSON',
        renderer: 'always',
        position: { referencePanel: eventlog },
    });

    api.addPanel({
        id: 'debuginfo',
        component: 'debuginfo',
        title: 'Panel Debug',
        renderer: 'always',
        position: { referencePanel: eventlog },
    });

    // Create a tab group in the watchlist group to demonstrate the feature
    const watchlistGroupId = watchlist.api.group.id;
    const marketData = api.createTabGroup({
        groupId: watchlistGroupId,
        label: 'Market Data',
        color: 'blue',
    });
    api.addPanelToTabGroup({
        groupId: watchlistGroupId,
        tabGroupId: marketData.id,
        panelId: 'watchlist',
    });
    api.addPanelToTabGroup({
        groupId: watchlistGroupId,
        tabGroupId: marketData.id,
        panelId: 'pricealert',
    });

    // Create a collapsed tab group in the orders/vesselfinder group
    const ordersGroupId = orders.api.group.id;
    const shipping = api.createTabGroup({
        groupId: ordersGroupId,
        label: 'Shipping',
        color: 'green',
    });
    api.addPanelToTabGroup({
        groupId: ordersGroupId,
        tabGroupId: shipping.id,
        panelId: 'orders',
    });
    api.addPanelToTabGroup({
        groupId: ordersGroupId,
        tabGroupId: shipping.id,
        panelId: 'vesselfinder',
    });
    // Create a collapsed tab group in the eventlog group for "Logs"
    const eventlogGroupId = eventlog.api.group.id;

    // Add a standalone tab before the Logs tab group
    api.addPanel({
        id: 'console',
        component: 'default',
        title: 'Console',
        position: { referencePanel: eventlog },
    });

    const logs = api.createTabGroup({
        groupId: eventlogGroupId,
        label: 'Logs',
        color: 'orange',
    });
    api.addPanelToTabGroup({
        groupId: eventlogGroupId,
        tabGroupId: logs.id,
        panelId: 'eventlog',
    });
    api.addPanelToTabGroup({
        groupId: eventlogGroupId,
        tabGroupId: logs.id,
        panelId: 'layoutinspector',
    });
    api.addPanelToTabGroup({
        groupId: eventlogGroupId,
        tabGroupId: logs.id,
        panelId: 'debuginfo',
    });
    logs.collapse();

    // Set active panels
    watchlist.api.setActive();
    orderbook.api.setActive();
    orders.api.setActive();
    positionsummary.api.setActive();
}
