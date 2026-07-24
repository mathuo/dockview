import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The canonical `llms.txt` / `llms-full.txt` live at the repository root so
// they sit alongside the packages and are easy to keep in sync with the code.
// Docusaurus serves them at https://dockview.dev/llms.txt by copying them into
// the docs `static/` directory at build time. They are intentionally NOT
// committed under `packages/docs/static` (see docs .gitignore) — this script is
// the single source that puts them there.
const ROOT = path.resolve(__dirname, '..', '..', '..');
const STATIC = path.resolve(__dirname, '..', 'static');

const files = ['llms.txt', 'llms-full.txt'];

for (const file of files) {
    const from = path.join(ROOT, file);
    const to = path.join(STATIC, file);
    fs.mkdirSync(STATIC, { recursive: true });
    fs.copyFileSync(from, to);
    console.log(`[copyLlms] ${file} -> static/${file}`);
}
