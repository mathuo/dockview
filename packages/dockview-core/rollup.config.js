/* eslint-disable */

const { join } = require('path');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const postcss = require('rollup-plugin-postcss');

const { name, version, homepage, license } = require('./package.json');
const main = join(__dirname, './scripts/rollupEntryTarget.ts');
const mainNoStyles = join(__dirname, './src/index.ts');
const outputDir = join(__dirname, 'dist');

function outputFile(format, isMinified, withStyles) {
    if (format === 'umd') {
        // Browser bundles go to dist/{name}[.min][.noStyle].js
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
    const { withStyles, isMinified, isReact } = options;
    const input = getInput(options);
    const file = outputFile(format, isMinified, withStyles, isReact);

    const external = [];

    const output = {
        file,
        format,
        sourcemap: true,
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
        typescript({
            tsconfig: 'tsconfig.esm.json',
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
    createBundle('umd', { withStyles: false, isMinified: false }),
    createBundle('umd', { withStyles: false, isMinified: true }),
    // Package bundles — dist/package/
    createBundle('cjs', { withStyles: true, isMinified: false }),
    createBundle('cjs', { withStyles: true, isMinified: true }),
    createBundle('esm', { withStyles: true, isMinified: false }),
    createBundle('esm', { withStyles: true, isMinified: true }),
];
