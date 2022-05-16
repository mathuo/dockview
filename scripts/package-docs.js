const fs = require('fs-extra');
const path = require('path');

const output = path.join(__dirname, '../');

const docsDir = path.join(__dirname, '../packages/dockview-docs/build');

fs.copySync(docsDir, path.join(output, 'docs2'));
