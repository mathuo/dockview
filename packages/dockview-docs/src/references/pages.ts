export interface Page {
    title: string;
    url?: string;
    routes?: Page[];
}

export const PAGES: Page[] = [
    { title: 'Introduction', url: '/#introduction' },
    { title: 'Basics', url: '/basics/#basics' },
    { title: 'Theme', url: '/theme/#theme' },
    {
        title: 'API',
        url: '#api',
        routes: [
            {
                title: 'Splitview',
                url: '/splitview/#splitview',
            },
            {
                title: 'Gridview',
                url: '/gridview/#gridview',
            },
            {
                title: 'Dockview',
                url: '/dockview/#dockview',
            },
            {
                title: 'Paneview',
                url: '/paneview/#paneview',
            },
        ],
    },
    { title: 'Guides', url: '#guides' },
];
