const fs = require('fs-extra');
const path = require('path');
const { DEPLOY_PATH } = require('./constants');

const output = path.join(__dirname, '../../');

const docsDir = path.join(__dirname, '../build');

fs.copySync(docsDir, path.join(output, DEPLOY_PATH));
