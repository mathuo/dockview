const fs = require('fs-extra');
const path = require('path');

const output = path.join(__dirname, '../build');

const websiteDir = path.join(__dirname, '../packages/docs/build');

const docsDir = path.join(__dirname, '../docs');

fs.copySync(websiteDir, output);
fs.copySync(docsDir, path.join(output, 'typedocs'));
