// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const path = require('path');

console.log(`isCI: ${process.env.CI}`);

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'Dockview',
    tagline: 'Zero dependency layout manager for React',
    url: 'https://dockview.dev',
    baseUrl: process.env.CI ? `/` : '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',

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
    plugins: [
        'docusaurus-plugin-sass',
        (context, options) => {
            return {
                name: 'webpack',
                configureWebpack: (config, isServer, utils) => {
                    return {
                        // externals: ['react', 'react-dom'],
                        devtool: 'source-map',
                        resolve: {
                            alias: {
                                react: path.join(
                                    __dirname,
                                    'node_modules',
                                    'react'
                                ),
                                'react-dom': path.join(
                                    __dirname,
                                    'node_modules',
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
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
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
            navbar: {
                title: 'Dockview',
                logo: {
                    alt: 'My Site Logo',
                    src: 'img/logo.svg',
                },
                items: [
                    {
                        type: 'doc',
                        docId: 'index',
                        position: 'left',
                        label: 'Docs',
                    },
                    { to: '/blog', label: 'Blog', position: 'left' },
                    {
                        href: 'https://github.com/mathuo/dockview',
                        label: 'GitHub',
                        position: 'right',
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
                additionalLanguages: ['java', 'markdown', 'latex'],
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
        }),
};

module.exports = config;
