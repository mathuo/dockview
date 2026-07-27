const path = require('path');
const fs = require('fs');

// Vitest's v8 coverage provider writes `SF:` paths relative to this package
// (e.g. `SF:src/dockview/dockview.vue`). SonarCloud resolves coverage paths
// from the monorepo root, so it would fail to match those files and report 0%
// coverage for dockview-vue. Rewrite each path to be repo-root-relative
// (`SF:packages/dockview-vue/src/...`) so Sonar can map them.

const prefix = 'packages/dockview-vue/';
const lcovPath = path.join(__dirname, '../coverage/lcov.info');

if (!fs.existsSync(lcovPath)) {
    console.warn(`[fix-lcov-paths] no lcov report found at ${lcovPath}`);
    process.exit(0);
}

const contents = fs.readFileSync(lcovPath, 'utf8');

const rewritten = contents.replace(/^SF:(.*)$/gm, (line, file) => {
    // Idempotent: skip paths that are already repo-root-relative.
    if (file.startsWith(prefix)) {
        return line;
    }
    return `SF:${prefix}${file}`;
});

fs.writeFileSync(lcovPath, rewritten);
console.log(`[fix-lcov-paths] rewrote SF paths in ${lcovPath}`);
