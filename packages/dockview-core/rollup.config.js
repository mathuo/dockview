/* eslint-disable */

const { join } = require('path');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const postcss = require('rollup-plugin-postcss');

const { name: fullName, version, homepage, license } = require('./package.json');
const name = fullName.split('/').pop(); // Extract 'dockview-core' from '@samelie/dockview-core'
const main = join(__dirname, './scripts/rollupEntryTarget.ts');
const mainNoStyles = join(__dirname, './src/index.ts');
const outputDir = join(__dirname, 'dist');

function outputFile(format, isMinified, withStyles) {
    let filename = join(outputDir, name);

    if (format !== 'umd') {
        filename += `.${format}`;
    }
    if (isMinified) {
        filename += '.min';
    }
    if (!withStyles) {
        filename += '.noStyle';
    }

    return `${filename}.js`;
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
            ` * ${fullName}`,
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
    // amd
    createBundle('amd', { withStyles: false, isMinified: false }),
    createBundle('amd', { withStyles: true, isMinified: false }),
    createBundle('amd', { withStyles: false, isMinified: true }),
    createBundle('amd', { withStyles: true, isMinified: true }),
    // umd
    createBundle('umd', { withStyles: false, isMinified: false }),
    createBundle('umd', { withStyles: true, isMinified: false }),
    createBundle('umd', { withStyles: false, isMinified: true }),
    createBundle('umd', { withStyles: true, isMinified: true }),
    // cjs
    createBundle('cjs', { withStyles: true, isMinified: false }),
    // esm
    createBundle('esm', { withStyles: true, isMinified: false }),
    createBundle('esm', { withStyles: true, isMinified: true }),
];
