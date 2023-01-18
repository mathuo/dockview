/* eslint-disable */

import { join } from 'path';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';

const { name, version, homepage, license } = require('./package.json');
const reactMain = join(__dirname, './scripts/rollupEntryTarget-react.ts');
const reactMainNoStyles = join(__dirname, './src/index.ts');
const main = join(__dirname, './scripts/rollupEntryTarget-core.ts');
const mainNoStyles = join(__dirname, './src/core.ts');
const outputDir = join(__dirname, 'dist');

function outputFile(format, isMinified, withStyles, isReact) {
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

    if (!isReact) {
        filename += '.corejs';
    }

    return `${filename}.js`;
}

function getInput(options) {
    const { withStyles, isReact } = options;

    if (withStyles) {
        return isReact ? reactMain : main;
    }

    return isReact ? reactMainNoStyles : mainNoStyles;
}

function createBundle(format, options) {
    const { withStyles, isMinified, isReact } = options;
    const input = getInput(options);
    const file = outputFile(format, isMinified, withStyles, isReact);

    const external = [];

    const output = {
        file,
        format,
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
        output['name'] = name;
    }

    if (isReact) {
        // TODO: should be conditional on whether user wants the React wrappers
        external.push('react', 'react-dom');

        if (format === 'umd') {
            // TODO: should be conditional on whether user wants the React wrappers
            output.globals['react'] = 'React';
            output.globals['react-dom'] = 'ReactDOM';
        }
    }

    return {
        input,
        output,
        plugins,
        external,
        // manualChunks(id) {
        //     if (id.includes('src/react/')) {
        //         return 'react';
        //     }
        // },
    };
}

export default [
    // amd
    createBundle('amd', {
        withStyles: false,
        isMinified: false,
        isReact: true,
    }),
    createBundle('amd', { withStyles: true, isMinified: false, isReact: true }),
    createBundle('amd', { withStyles: false, isMinified: true, isReact: true }),
    createBundle('amd', { withStyles: true, isMinified: true, isReact: true }),
    // umd
    createBundle('umd', {
        withStyles: false,
        isMinified: false,
        isReact: true,
    }),
    createBundle('umd', { withStyles: true, isMinified: false, isReact: true }),
    createBundle('umd', { withStyles: false, isMinified: true, isReact: true }),
    createBundle('umd', { withStyles: true, isMinified: true, isReact: true }),
    // cjs
    createBundle('cjs', { withStyles: true, isMinified: false, isReact: true }),
    // esm
    createBundle('esm', { withStyles: true, isMinified: false, isReact: true }),
    createBundle('esm', { withStyles: true, isMinified: true, isReact: true }),
    // react extensions
    createBundle('umd', {
        withStyles: true,
        isMinified: false,
        isReact: false,
    }),
];
