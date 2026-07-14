import { defineConfig } from 'rolldown';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { cssInject } from '../../scripts/rolldown-css-inject.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { name, version, homepage, license } = require('./package.json');
const banner = ['/**', ` * ${name}`, ` * @version ${version}`, ` * @link ${homepage}`, ` * @license ${license}`, ' */'].join('\n');
const outDir = join(__dirname, 'dist');
const withStylesEntry = join(__dirname, 'scripts/bundleEntryTarget.ts');
const noStylesEntry = join(__dirname, 'src/index.ts');
const target = 'es2015';

// UMD inlines dockview-core (self-contained CDN build); package builds
// externalize it so consumers share a single instance.
const umdExternal = ['react', 'react-dom'];
const pkgExternal = ['react', 'react-dom', 'dockview-core', /^dockview-core\//];
const umdGlobals = { react: 'React', 'react-dom': 'ReactDOM' };

function umd(min) {
    return {
        input: withStylesEntry,
        external: umdExternal,
        plugins: [cssInject()],
        transform: { target },
        output: { file: join(outDir, `${name}${min ? '.min' : ''}.js`), format: 'umd', name, banner, minify: min, esModule: true, globals: umdGlobals },
    };
}
function pkg(fmt, min) {
    const ext = fmt === 'esm' ? 'mjs' : 'js';
    return {
        input: noStylesEntry,
        external: pkgExternal,
        transform: { target },
        output: { file: join(outDir, 'package', `main.${fmt}${min ? '.min' : ''}.${ext}`), format: fmt, banner, minify: min, esModule: true },
    };
}
export default defineConfig([umd(false), umd(true), pkg('cjs', false), pkg('cjs', true), pkg('esm', false), pkg('esm', true)]);
