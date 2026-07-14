import { defineConfig } from 'tsdown';
import { vueSfcPlugin } from 'vue-sfc-transformer/rolldown';

// dockview-vue ships hand-authored ESM/UMD/CJS bundles built by Vite (`build:js`).
// This tsdown config only generates the TypeScript declarations for `dist/types`,
// using vue-sfc-transformer + oxc so that `isolatedDeclarations` is honoured for
// `.vue` SFCs (vue-tsc cannot emit isolatedDeclarations-compatible SFC types).
export default defineConfig({
    entry: ['./src/index.ts'],
    platform: 'neutral',
    outDir: 'dist/types',
    unbundle: true,
    plugins: [
        vueSfcPlugin({ srcDir: 'src', emitLegacyDeclarationAlias: true }),
    ],
    dts: { emitDtsOnly: true },
    external: ['vue', 'dockview', 'dockview-core', 'dockview-enterprise'],
    tsconfig: 'tsconfig.build-types.json',
});
