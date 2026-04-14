const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '../dist/styles');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

fs.copyFileSync(
    path.join(__dirname, '../../dockview-core/dist/styles/dockview.css'),
    path.join(outDir, 'dockview.css')
);
