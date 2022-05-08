import transpile from 'next-transpile-modules';
import slugs from 'rehype-slug';
import autoLinkHeadings from 'rehype-autolink-headings';
import mdx from '@next/mdx';
import remarkGfm from 'remark-gfm';

const withTM = transpile(['dockview', 'dockview-demo'], {
    resolveSymlinks: true,
});

const withMDX = mdx({
    extension: /\.mdx$/,
    options: {
        remarkPlugins: [remarkGfm],
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

console.log(`CI=${process.env.CI}`);

const extraParams = process.env.CI
    ? {
          basePath: '/dockview/docs',
          assetPrefix: '/dockview/docs/',
      }
    : {};

export default withTM(
    withMDX({
        ...extraParams,
        reactStrictMode: true,
        pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
        experimental: {
            externalDir: true,
        },
        webpack(config, options) {
            if (options.isServer) {
                config.externals = ['react', 'react-dom', ...config.externals];
            }

            config.module.rules.push({
                test: /\.tsx?|\.ts?$/,
                use: [options.defaultLoaders.babel],
            });
            // config.resolve.alias['react'] = path.resolve(
            //     __dirname,
            //     '.',
            //     'node_modules',
            //     'react-dom'
            // );
            // config.resolve.alias['react-dom'] = path.resolve(
            //     __dirname,
            //     '.',
            //     'node_modules',
            //     'react-dom'
            // );
            return config;
        },
    })
);
