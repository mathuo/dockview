import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],

    build: {
        minify: false,
        lib: {
            // src/indext.ts is where we have exported the component(s)
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'dockview-vue',
            // the name of the output files when the build is run
            fileName: (format) => `dockview-vue.${format}.js`,
            formats: ['es', 'umd', 'cjs'],
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            external: ['vue', 'dockview-core'],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    vue: 'Vue',
                    ['dockview-core']: 'DockviewCore',
                },
            },
        },
    },
});
