import { readFileSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';

// Replaces rollup-plugin-postcss for the with-styles UMD bundles: rewrite a
// `.css` import to a virtual JS module (so rolldown's extension-based CSS
// handling never engages) that injects a <style> element at runtime — matching
// the old postcss `inject` behaviour.
const PREFIX = '\0cssinject:';
const SUFFIX = '.mjs';

export function cssInject() {
    return {
        name: 'css-inject',
        resolveId(id, importer) {
            if (id.endsWith('.css')) {
                const abs = isAbsolute(id)
                    ? id
                    : join(dirname(importer || ''), id);
                // Virtual id must NOT end in `.css`, or rolldown treats it as CSS.
                return PREFIX + abs + SUFFIX;
            }
        },
        load(id) {
            if (id.startsWith(PREFIX)) {
                const file = id.slice(PREFIX.length, -SUFFIX.length);
                const css = readFileSync(file, 'utf8');
                return `if (typeof document !== 'undefined') { const s = document.createElement('style'); s.textContent = ${JSON.stringify(
                    css
                )}; document.head.appendChild(s); }\nexport default undefined;`;
            }
        },
    };
}
