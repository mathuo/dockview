(function (global) {
    System.config({
        transpiler: 'ts',
        typescriptOptions: {
            module: 'system',
            moduleResolution: 'node',
            target: 'es2015',
            noImplicitAny: false,
            sourceMap: true,
            jsx: 'react',
            lib: ['es2015', 'dom'],
        },
        paths: {
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
        },
        map: {
            css: 'npm:systemjs-plugin-css@0.1.37/css.js',

            // react
            react: 'npm:react@18.2.0',
            'react-dom': 'npm:react-dom@18.2.0',
            'react-dom/client': 'npm:react-dom@18.2.0',
            redux: 'npm:redux@4.2.1',
            'react-redux': 'npm:react-redux@8.0.5',
            'prop-types': 'npm:prop-types@15.8.1',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            typescript: 'npm:typescript@4.3.5/lib/typescript.min.js',
            // systemJsMap comes from index.html
            ...systemJsMap,
        },
        packages: {
            css: {},
            react: {
                main: './umd/react.development.js',
            },
            'react-dom': {
                main: './umd/react-dom.development.js',
            },
            app: {
                main: './index.tsx',
                defaultExtension: 'tsx',
            },
            dockview: {
                main: './dist/dockview.cjs.js',
                defaultExtension: 'js',
            },
            'dockview-core': {
                main: './dist/dockview-core.cjs.js',
                defaultExtension: 'js',
            },
        },
        meta: {
            typescript: {
                exports: 'ts',
            },
            '*.css': { loader: 'css' },
        },
    });
})(this);

window.addEventListener('error', (e) => {
    console.error('ERROR', e.message, e.filename);
});
