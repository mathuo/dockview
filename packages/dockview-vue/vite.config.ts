import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],

    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/__tests__/**/*.spec.ts'],
        alias: {
            dockview: resolve(__dirname, '../dockview/src/index.ts'),
            'dockview-core': resolve(
                __dirname,
                '../dockview-core/src/index.ts'
            ),
            'dockview-enterprise': resolve(
                __dirname,
                '../dockview-enterprise/src/index.ts'
            ),
        },
        setupFiles: ['src/__tests__/__mocks__/resizeObserver.vitest.ts'],
    },

    build: {
        minify: false,
        lib: {
            // src/indext.ts is where we have exported the component(s)
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'dockview-vue',
            // The package is `"type": "module"`, so the ESM output keeps `.js`
            // (interpreted as ESM) while the UMD/require output gets `.cjs` so
            // Node resolves it as CommonJS. A plain `.umd.js` would be read as
            // ESM and fail for `require()` consumers.
            fileName: (format) =>
                `dockview-vue.${format}.${format === 'es' ? 'js' : 'cjs'}`,
            // `es` (module/import) + `umd` (main/require) are the only formats
            // referenced by package.json exports; a `cjs` build would be dead
            // output.
            formats: ['es', 'umd'],
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            external: ['vue', 'dockview', 'dockview-core'],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    vue: 'Vue',
                    dockview: 'dockview',
                    ['dockview-core']: 'DockviewCore',
                },
            },
        },
    },
});
