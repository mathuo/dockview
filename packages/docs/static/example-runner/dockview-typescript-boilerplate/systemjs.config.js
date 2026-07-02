/**
 * SystemJS configuration for Dockview TypeScript examples.
 *
 * Expects the following globals to be set before this script loads:
 *   - window.defined_dockview_systemJsMap  (package URL map, local or CDN)
 *   - window.defined_dockview_appLocation  (base URL for example source files)
 */
(function (global) {
    var defined_dockview_systemJsMap = global.defined_dockview_systemJsMap;
    var defined_dockview_appLocation = global.defined_dockview_appLocation;

    System.config({
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es2015',
            module: 'system',
            moduleResolution: 'node',
        },
        meta: {
            typescript: {
                exports: 'ts',
            },
            '*.css': { loader: 'css' },
        },
        paths: {
            'npm:': 'https://cdn.jsdelivr.net/npm/',
        },
        map: Object.assign(
            {
                css: '/example-runner/css.js',
                ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
                typescript: 'npm:typescript@5.4.5/lib/typescript.min.js',

                app: defined_dockview_appLocation,
            },
            defined_dockview_systemJsMap
        ),
        packages: {
            app: {
                defaultExtension: 'ts',
            },
            'dockview-core': {
                main: './dist/cjs/index.js',
                format: 'cjs',
                defaultExtension: 'js',
            },
            // Examples import from `dockview` directly. Point it at the
            // self-contained rollup bundle (which inlines the private
            // `dockview-modules` package) rather than the tsc `dist/cjs` build,
            // whose dangling `require('dockview-modules')` can't be resolved
            // here. Without a `main`, SystemJS would request the bare package
            // directory — a 404 (previously a fatal EISDIR) in the dev server.
            dockview: {
                main: './dist/package/main.cjs.js',
                format: 'cjs',
                defaultExtension: 'js',
            },
        },
    });
})(window);
