const fs = require('fs-extra');
const path = require('path');

const output = path.join(__dirname, '../../../build');

const docsDir = path.join(__dirname, '../build');

fs.copySync(docsDir, path.join(output));
