// const remarkFrontmatter = import('remark-frontmatter');
// const rehypePrismPlus = import('rehype-prism-plus');
// const remarkPrism = import('remark-prism');
// const transpile = require('next-transpile-modules');
// import mdx from '@next/mdx';

import transpile from 'next-transpile-modules';
import slugs from 'rehype-slug';
import autoLinkHeadings from 'rehype-autolink-headings';
import mdx from '@next/mdx';

const withTM = transpile(['dockview']);

const withMDX = mdx({
    extension: /\.mdx$/,
    options: {
        remarkPlugins: [],
        rehypePlugins: [
            slugs,
            [
                autoLinkHeadings,
                {
                    behavior: 'append',
                },
            ],
        ],
        providerImportSource: '@mdx-js/react',
    },
});

export default withTM(
    withMDX({
        pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
        experimental: {
            externalDir: true,
        },
    })
);
