/* eslint-disable */

import { join } from 'path';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';

const packageName = require('./package.json').name;
const main = join(__dirname, './scripts/rollupEntryTarget.ts');
const mainNoStyles = join(__dirname, './src/index.ts');
const outputDir = join(__dirname, 'dist');

function outputFile(format, isMinified, withStyles) {
    let name = join(outputDir, packageName);

    if (format !== 'umd') {
        name += `.${format}`;
    }
    if (isMinified) {
        name += '.min';
    }
    if (!withStyles) {
        name += '.noStyle';
    }

    return `${name}.js`;
}

function createBundle(format, options) {
    const { withStyles, isMinified } = options;
    const input = withStyles ? main : mainNoStyles;
    const file = outputFile(format, isMinified, withStyles);

    const external = [];

    const output = {
        file,
        format,
        globals: {},
    };

    const plugins = [
        typescript({
            tsconfig: 'tsconfig.esm.json',
            incremental: false,
            tsBuildInfoFile: undefined,
            outDir: undefined,
            declaration: false,
        }),
    ];

    if (isMinified) {
        plugins.push(terser());
    }
    if (withStyles) {
        plugins.push(postcss());
    }

    if (format === 'umd') {
        output['name'] = packageName;

        // TODO: should be conditional on whether user wants the React wrappers
        output.globals['react'] = 'React';
        output.globals['react-dom'] = 'ReactDOM';
    }

    // TODO: should be conditional on whether user wants the React wrappers
    external.push('react', 'react-dom');

    return {
        input,
        output,
        plugins,
        external,
    };
}

export default [
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
