import { defineConfig } from 'rolldown';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { name, version, homepage, license } = require('./package.json');
const banner = ['/**', ` * ${name}`, ` * @version ${version}`, ` * @link ${homepage}`, ` * @license ${license}`, ' */'].join('\n');
const outDir = join(__dirname, 'dist');
const input = join(__dirname, 'src/index.ts');
const target = 'es2015';

// `dockview` (the free base package) is always externalized — the bundle ships
// only the enterprise module implementations.
const external = ['dockview', /^dockview\//];
const umdGlobals = { dockview: 'dockview' };

// Stamp the build date into releaseDate.ts so license validation is
// version-based: `__DOCKVIEW_RELEASE_DATE__` becomes the day this bundle built.
function stampReleaseDate() {
    const iso = new Date().toISOString().slice(0, 10);
    return {
        name: 'stamp-release-date',
        transform(code, id) {
            if (id.replace(/\\/g, '/').endsWith('/src/releaseDate.ts') && code.includes('__DOCKVIEW_RELEASE_DATE__')) {
                return { code: code.replace(/__DOCKVIEW_RELEASE_DATE__/g, iso), map: null };
            }
            return null;
        },
    };
}

function umd(min) {
    return {
        input,
        external,
        plugins: [stampReleaseDate()],
        transform: { target },
        output: { file: join(outDir, `${name}${min ? '.min' : ''}.js`), format: 'umd', name, banner, minify: min, esModule: true, globals: umdGlobals },
    };
}
function pkg(fmt, min) {
    const ext = fmt === 'esm' ? 'mjs' : 'js';
    return {
        input,
        external,
        plugins: [stampReleaseDate()],
        transform: { target },
        output: { file: join(outDir, 'package', `main.${fmt}${min ? '.min' : ''}.${ext}`), format: fmt, banner, minify: min, esModule: true },
    };
}
export default defineConfig([umd(false), umd(true), pkg('cjs', false), pkg('cjs', true), pkg('esm', false), pkg('esm', true)]);
