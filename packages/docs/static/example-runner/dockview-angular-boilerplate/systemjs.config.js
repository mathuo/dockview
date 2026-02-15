/**
 * SystemJS configuration for Dockview Angular examples.
 * Uses plugin-typescript with decorator support for browser-side transpilation.
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
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
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

                '@angular/core':
                    'npm:@angular/core@17.0.0/fesm2022/core.mjs',
                '@angular/common':
                    'npm:@angular/common@17.0.0/fesm2022/common.mjs',
                '@angular/compiler':
                    'npm:@angular/compiler@17.0.0/fesm2022/compiler.mjs',
                '@angular/platform-browser':
                    'npm:@angular/platform-browser@17.0.0/fesm2022/platform-browser.mjs',
                '@angular/platform-browser-dynamic':
                    'npm:@angular/platform-browser-dynamic@17.0.0/fesm2022/platform-browser-dynamic.mjs',
                rxjs: 'npm:rxjs@7.8.1/dist/bundles/rxjs.umd.min.js',
                'rxjs/operators':
                    'npm:rxjs@7.8.1/dist/bundles/rxjs.umd.min.js',
                'zone.js': 'npm:zone.js@0.14.3/dist/zone.min.js',
            },
            defined_dockview_systemJsMap
        ),
        packages: {
            app: {
                defaultExtension: 'ts',
            },
            'dockview-core': {
                main: './dist/cjs/index.js',
                defaultExtension: 'js',
            },
            'dockview-angular': {
                main: './dist/cjs/index.js',
                defaultExtension: 'js',
            },
        },
    });
})(window);
