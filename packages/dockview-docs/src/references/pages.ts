export interface Page {
    title: string;
    url?: string;
    routes?: Page[];
}

export const PAGES: Page[] = [
    { title: 'Introduction', url: '/#introduction' },
    { title: 'Basics', url: '/basics/#basics' },
    {
        title: 'API',
        url: '#api',
        routes: [
            {
                title: 'Dockview',
                url: '#dockview',
                routes: [
                    { title: 'Item1', url: '/item1' },
                    { title: 'Item2', url: '/item2' },
                ],
            },
            // {
            //     title: 'Gridview',
            //     url: '#gridview',
            //     routes: [
            //         { title: 'Item1', url: 'item1' },
            //         { title: 'Item2', url: 'item2' },
            //     ],
            // },
            // {
            //     title: 'Splitview',
            //     url: '#splitview',
            //     routes: [
            //         { title: 'Item1', url: 'item1' },
            //         { title: 'Item2', url: 'item2' },
            //     ],
            // },
            // {
            //     title: 'Paneview',
            //     url: '#paneivew',
            //     routes: [
            //         { title: 'Item1', url: 'item1' },
            //         { title: 'Item2', url: 'item2' },
            //     ],
            // },
        ],
    },
    { title: 'Guides', url: '#guides' },
];
