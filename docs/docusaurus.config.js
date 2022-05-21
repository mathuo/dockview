// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const path = require('path');

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'Dockview',
    tagline: 'Zero dependency layout manager for React',
    url: 'https://your-docusaurus-test-site.com',
    baseUrl: '/',
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
    // plugins: [
    //     (context, options) => {
    //         return {
    //             name: 'webpack',
    //             configureWebpack: (config, isServer, utils) => {
    //                 if (isServer) {
    //                     return {
    //                         externals: [
    //                             'react',
    //                             'react-dom',
    //                             ...(config.externals || []),
    //                         ],
    //                     };
    //                 }
    //                 return {
    //                     // externals: ['react', 'react-dom'],
    //                     resolve: {
    //                         alias: {
    //                             react: path.join(
    //                                 __dirname,
    //                                 'node_modules',
    //                                 'react'
    //                             ),
    //                             'react-dom': path.join(
    //                                 __dirname,
    //                                 'node_modules',
    //                                 'react-dom'
    //                             ),
    //                         },
    //                     },
    //                 };
    //             },
    //         };
    //     },
    // ],
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
            navbar: {
                title: 'Dockview Documentation',
                logo: {
                    alt: 'My Site Logo',
                    src: 'img/logo.svg',
                },
                items: [
                    {
                        type: 'doc',
                        docId: 'intro',
                        position: 'left',
                        label: 'Tutorial',
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
                        title: 'Docs',
                        items: [
                            {
                                label: 'Tutorial',
                                to: '/docs/intro',
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
                            {
                                label: 'Discord',
                                href: 'https://discordapp.com/invite/docusaurus',
                            },
                            {
                                label: 'Twitter',
                                href: 'https://twitter.com/docusaurus',
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
