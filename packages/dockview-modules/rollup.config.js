/* eslint-disable */

const { join } = require('path');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');

const { name, version, homepage, license } = require('./package.json');
const input = join(__dirname, './src/index.ts');
const outputDir = join(__dirname, 'dist');

// Stamp the build date into `releaseDate.ts` so license validation is
// version-based: the `__DOCKVIEW_RELEASE_DATE__` token becomes the day this
// bundle was built. Runs before the typescript transform so it operates on the
// raw source. Zero-dependency (an inline transform, not @rollup/plugin-replace).
function stampReleaseDate() {
    const iso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    return {
        name: 'stamp-release-date',
        transform(code, id) {
            if (
                id.replace(/\\/g, '/').endsWith('/src/releaseDate.ts') &&
                code.includes('__DOCKVIEW_RELEASE_DATE__')
            ) {
                return {
                    code: code.replace(/__DOCKVIEW_RELEASE_DATE__/g, iso),
                    map: null,
                };
            }
            return null;
        },
    };
}

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
        stampReleaseDate(),
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
