const fs = require('fs-extra');
const path = require('path');

const output = path.join(__dirname, '../output');

const docsDir = path.join(__dirname, '../packages/dockview/typedocs');
const webpackAppDir = path.join(__dirname, '../packages/dockview-demo/dist');
const storybookAppDir = path.join(
    __dirname,
    '../packages/dockview-demo/storybook-static'
);

fs.copySync(docsDir, path.join(output, 'typedocs'));
fs.copySync(webpackAppDir, path.join(output, 'build'));
fs.copySync(storybookAppDir, path.join(output, 'storybook-static'));
