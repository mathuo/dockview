// Compile every non-partial SCSS file under src/ and concatenate the results
// into dist/styles/dockview.css. Replaces the previous gulp + gulp-sass +
// gulp-concat pipeline with a direct sass-embedded call.
const sass = require('sass-embedded');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const outDir = path.join(__dirname, '..', 'dist', 'styles');

function findScss(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...findScss(p));
        // dart-sass convention: files starting with `_` are partials
        else if (entry.name.endsWith('.scss') && !entry.name.startsWith('_'))
            out.push(p);
    }
    return out;
}

// Deterministic alphabetical order (gulp's stream order was async and unstable).
const files = findScss(srcDir).sort();
const css = files
    .map((f) => sass.compile(f).css)
    // Strip per-file `@charset` so the concatenated file has none (the old
    // gulp-sass pipeline used `{ charset: false }`); it is invalid mid-file.
    .map((c) => c.replace(/^@charset "UTF-8";\n/, ''))
    .join('\n');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'dockview.css'), css);
