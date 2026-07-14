const path = require('path');
const fs = require('fs');

// tsdown + vue-sfc-transformer emit a transpiled `<name>.vue` file alongside the
// `.d.vue.ts` / `.vue.d.ts` declarations for each SFC. The runtime code ships as
// the Vite-built bundles (`build:js`), so these SFC transpiles are not needed in
// the published `dist/types` tree — remove them, keeping only declarations.
const typesDir = path.join(__dirname, '../dist/types');

function walk(dir) {
    if (!fs.existsSync(dir)) {
        return;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (entry.name.endsWith('.vue')) {
            // matches `foo.vue`, never `foo.d.vue.ts` (that ends in `.ts`)
            fs.rmSync(full);
        }
    }
}

walk(typesDir);
