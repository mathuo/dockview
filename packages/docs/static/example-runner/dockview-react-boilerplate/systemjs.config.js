/**
 * SystemJS configuration for Dockview React examples.
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
            jsx: 'react',
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

                react: 'npm:react@18.2.0/umd/react.production.min.js',
                'react-dom':
                    'npm:react-dom@18.2.0/umd/react-dom.production.min.js',
                'react-dom/client':
                    'npm:react-dom@18.2.0/umd/react-dom.production.min.js',
            },
            defined_dockview_systemJsMap
        ),
        packages: {
            app: {
                defaultExtension: 'tsx',
            },
            'dockview-core': {
                main: './dist/cjs/index.js',
                format: 'cjs',
                defaultExtension: 'js',
            },
            dockview: {
                main: './dist/cjs/index.js',
                format: 'cjs',
                defaultExtension: 'js',
            },
        },
    });
})(window);
