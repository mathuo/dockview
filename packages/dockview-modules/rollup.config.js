/* eslint-disable */

const { join } = require('path');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');

const { name, version, homepage, license } = require('./package.json');
const input = join(__dirname, './src/index.ts');
const outputDir = join(__dirname, 'dist');

function outputFile(format, isMinified) {
    if (format === 'umd') {
        let filename = join(outputDir, name);
        if (isMinified) {
            filename += '.min';
        }
        return `${filename}.js`;
    }

    const ext = format === 'esm' ? 'mjs' : 'js';
    let filename = join(outputDir, 'package', `main.${format}`);
    if (isMinified) {
        filename += '.min';
    }
    return `${filename}.${ext}`;
}

// dockview-core (and its deep internal paths) is a declared dependency and is
// always externalized — the bundle ships only the module implementations.
const isCoreExternal = (id) =>
    id === 'dockview-core' || id.startsWith('dockview-core/');

function createBundle(format, options) {
    const { isMinified } = options;
    const file = outputFile(format, isMinified);

    const output = {
        file,
        format,
        sourcemap: isMinified && format === 'umd',
        globals: { 'dockview-core': 'DockviewCore' },
        banner: [
            `/**`,
            ` * ${name}`,
            ` * @version ${version}`,
            ` * @link ${homepage}`,
            ` * @license ${license}`,
            ` */`,
        ].join('\n'),
    };

    if (format === 'umd') {
        output['name'] = name;
    }

    const plugins = [
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

    return {
        input,
        output,
        plugins,
        external: isCoreExternal,
    };
}

module.exports = [
    createBundle('umd', { isMinified: false }),
    createBundle('umd', { isMinified: true }),
    createBundle('cjs', { isMinified: false }),
    createBundle('cjs', { isMinified: true }),
    createBundle('esm', { isMinified: false }),
    createBundle('esm', { isMinified: true }),
];
