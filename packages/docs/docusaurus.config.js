// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.nightOwlLight;
const darkCodeTheme = themes.palenight;

// dracula
// duotoneDark
// duotoneLight
// github
// jettwaveDark
// jettwaveLight
// nightOwl
// nightOwlLight
// oceanicNext
// okaidia
// oneDark
// oneLight
// palenight
// shadesOfPurple
// synthwave84
// ultramin
// vsDark
// vsLight

const path = require('path');

console.log(`isCI: ${process.env.CI}`);

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'Dockview',
    tagline:
        'A zero dependency layout manager supporting ReactJS and Vanilla TypeScript',
    url: 'https://dockview.dev',
    baseUrl: process.env.CI ? `/` : '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/dockview_logo.ico',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'mathuo', // Usually your GitHub org/user name.
    projectName: 'dockview', // Usually your repo name.

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },
    stylesheets: [
        {
            href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
        },
    ],
    plugins: [
        'docusaurus-plugin-sass',
        (context, options) => {
            return {
                name: 'custom-webpack',
                configureWebpack: (config, isServer, utils) => {
                    return {
                        // externals: ['react', 'react-dom'],
                        devtool: 'source-map',
                        module: {
                            rules: [
                                {
                                    test: /\.js$/,
                                    enforce: 'pre',
                                    use: ['source-map-loader'],
                                },
                            ],
                        },
                        resolve: {
                            ...config.resolve,
                            alias: {
                                ...config.resolve.alias,
                                react: path.join(
                                    __dirname,
                                    '../../node_modules',
                                    'react'
                                ),
                                'react-dom': path.join(
                                    __dirname,
                                    '../../node_modules',
                                    'react-dom'
                                ),
                            },
                        },
                    };
                },
            };
        },
    ],
    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
                    versions: {
                        current: {
                            label: `Development 🚧`,
                        },
                    },
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.scss'),
                },
                gtag: process.env.CI
                    ? {
                          trackingID: 'G-KXGC1C9ZHC',
                      }
                    : undefined,
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            metadata: [
                {
                    name: 'keywords',
                    content: [
                        'react',
                        'components',
                        'typescript',
                        'drag-and-drop',
                        'reactjs',
                        'layout',
                        'drag',
                        'drop',
                        'tabs',
                        'dock',
                        'docking',
                        'splitter',
                        'docking-library',
                        'layout-manager',
                        'docking-layout',
                    ].join(' ,'),
                },
            ],
            docs: {
                sidebar: {
                    autoCollapseCategories: true,
                },
            },
            navbar: {
                title: 'Dockview',
                logo: {
                    alt: 'My Site Logo',
                    src: 'img/dockview_logo.svg',
                },
                items: [
                    {
                        type: 'doc',
                        docId: 'overview/getStarted/installation',
                        position: 'left',
                        label: 'Docs',
                    },
                    {
                        type: 'docSidebar',
                        position: 'left',
                        sidebarId: 'api',
                        label: 'API',
                    },
                    { to: '/blog', label: 'Blog', position: 'left' },
                    { to: '/demo', label: 'Demo', position: 'left' },
                    // {
                    //     to: 'https://dockview.dev/typedocs',
                    //     label: 'TSDoc',
                    //     position: 'left',
                    // },

                    {
                        type: 'docsVersionDropdown',
                        position: 'right',
                    },
                    {
                        href: 'https://github.com/mathuo/dockview',
                        position: 'right',
                        className: 'header-github-link',
                        'aria-label': 'GitHub repository',
                    },
                ],
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Learn',
                        items: [
                            {
                                label: 'Docs',
                                to: '/docs',
                            },
                        ],
                    },
                    {
                        title: 'Community',
                        items: [
                            {
                                label: 'Stack Overflow',
                                href: 'https://stackoverflow.com/questions/tagged/dockview',
                            },
                        ],
                    },
                    {
                        title: 'More',
                        items: [
                            {
                                label: 'Blog',
                                to: '/blog',
                            },
                            {
                                label: 'GitHub',
                                href: 'https://github.com/mathuo/dockview',
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} Dockview, Inc. Built with Docusaurus.`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
                additionalLanguages: ['markdown', 'latex'],
                magicComments: [
                    {
                        className: 'theme-code-block-highlighted-line',
                        line: 'highlight-next-line',
                        block: {
                            start: 'highlight-start',
                            end: 'highlight-end',
                        },
                    },
                    {
                        className: 'code-block-error-line',
                        line: 'This will error',
                    },
                ],
            },
            announcementBar: {
                id: 'announcementBar', // Increment on change
                content: `⭐️ If you like Dockview, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/mathuo/dockview">GitHub</a>`,
            },
            tableOfContents: {
                maxHeadingLevel: 5,
            },
        }),
};

module.exports = config;
