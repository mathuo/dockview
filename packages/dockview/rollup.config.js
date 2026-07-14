const { join } = require('path');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const postcss = require('rollup-plugin-postcss');
const nodeResolve = require('@rollup/plugin-node-resolve');

const { name, version, homepage, license } = require('./package.json');
const main = join(__dirname, './scripts/rollupEntryTarget.ts');
const mainNoStyles = join(__dirname, './src/index.ts');
const outputDir = join(__dirname, 'dist');

function outputFile(format, isMinified, withStyles) {
    if (format === 'umd') {
        // Browser bundles go to dist/{name}[.min].js
        let filename = join(outputDir, name);
        if (isMinified) {
            filename += '.min';
        }
        if (!withStyles) {
            filename += '.noStyle';
        }
        return `${filename}.js`;
    }

    // Package bundles go to dist/package/main.{cjs|esm}[.min].{js|mjs}
    const ext = format === 'esm' ? 'mjs' : 'js';
    let filename = join(outputDir, 'package', `main.${format}`);
    if (isMinified) {
        filename += '.min';
    }
    return `${filename}.${ext}`;
}

function getInput(options) {
    const { withStyles } = options;

    if (withStyles) {
        return main;
    }

    return mainNoStyles;
}

function createBundle(format, options) {
    const { withStyles, isMinified } = options;
    const input = getInput(options);
    const file = outputFile(format, isMinified, withStyles);

    const isUMD = format === 'umd';

    // dockview-core is published: externalize it in the package builds, but
    // inline it in the UMD bundle so the CDN build is self-contained. (The
    // enterprise feature modules now live in the separately-published
    // dockview-enterprise package and are no longer bundled here.)
    const external = isUMD
        ? ['react', 'react-dom']
        : ['react', 'react-dom', 'dockview-core', /^dockview-core\//];

    const output = {
        file,
        format,
        // Emit the `__esModule` marker so interop-sensitive consumers (e.g.
        // SystemJS, legacy AMD loaders) see the named exports.
        esModule: true,
        // No source maps: the only maps emitted were for the minified UMD
        // bundles and they are not published (see package.json `files`), which
        // otherwise leaves a dangling sourceMappingURL in the shipped bundle.
        sourcemap: false,
        globals: {},
        banner: [
            `/**`,
            ` * ${name}`,
            ` * @version ${version}`,
            ` * @link ${homepage}`,
            ` * @license ${license}`,
            ` */`,
        ].join('\n'),
    };

    const plugins = [
        nodeResolve({
            // UMD is self-contained: bundle dockview-core in. Package builds
            // externalize dockview-core, so nothing needs bundling from
            // node_modules there.
            include: isUMD ? ['node_modules/dockview-core/**'] : [],
        }),
        typescript({
            tsconfig: 'tsconfig.esm.json',
            outDir: outputDir,
            declaration: false,
            declarationMap: false,
        }),
    ];

    if (isMinified) {
        plugins.push(terser());
    }
    if (withStyles) {
        plugins.push(postcss());
    }

    if (format === 'umd') {
        output['name'] = name;
        output.globals['react'] = 'React';
        output.globals['react-dom'] = 'ReactDOM';
    }

    return {
        input,
        output,
        plugins,
        external,
    };
}

module.exports = [
    // Browser bundles (UMD) — dist/
    createBundle('umd', { withStyles: true, isMinified: false }),
    createBundle('umd', { withStyles: true, isMinified: true }),
    // Package bundles — dist/package/ (no auto-injected CSS; consumers
    // import 'dockview/dist/styles/dockview.css' explicitly)
    // Both plain and minified package bundles are shipped; the minified
    // variants are published for direct consumption (e.g. CDN / unpkg URLs).
    createBundle('cjs', { withStyles: false, isMinified: false }),
    createBundle('cjs', { withStyles: false, isMinified: true }),
    createBundle('esm', { withStyles: false, isMinified: false }),
    createBundle('esm', { withStyles: false, isMinified: true }),
];
