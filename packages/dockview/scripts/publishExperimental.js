const cp = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const publishDir = path.join(rootDir, '__publish__');

cp.execSync('npm run clean', { cwd: rootDir, stdio: 'inherit' });
cp.execSync('npm run test', { cwd: __dirname, stdio: 'inherit' });
cp.execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

if (fs.existsSync(publishDir)) {
    fs.removeSync(publishDir);
}
fs.mkdirSync(publishDir);

if (!fs.existsSync(path.join(publishDir, 'dist'))) {
    fs.mkdirSync(path.join(publishDir, 'dist'));
}

const package = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json')).toString()
);

for (const file of package.files) {
    fs.copySync(path.join(rootDir, file), path.join(publishDir, file));
}

const result = cp
    .execSync('git rev-parse --short HEAD', {
        cwd: rootDir,
    })
    .toString()
    .replace(/\n/g, '');

function formatDate() {
    const date = new Date();

    function pad(value) {
        if (value.toString().length === 1) {
            return `0${value}`;
        }
        return value;
    }

    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
        date.getDate()
    )}`;
}

package.version = `0.0.0-experimental-${result}-${formatDate()}`;
package.dependencies['dockview-core'] = package.version;
package.scripts = {};

fs.writeFileSync(
    path.join(publishDir, 'package.json'),
    JSON.stringify(package, null, 4)
);

const command = 'npm publish --tag experimental';

cp.execSync(command, { cwd: publishDir, stdio: 'inherit' });

fs.removeSync(publishDir);
