const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const rootDir = path.join(__dirname, '..');

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

function shortGitHash() {
    return cp
        .execSync('git rev-parse --short HEAD', {
            cwd: rootDir,
        })
        .toString()
        .replace(/\n/g, '');
}

const version = `0.0.0-experimental-${shortGitHash()}-${formatDate()}`;

// dockview-core

const dockviewCorePath = path.join(
    rootDir,
    'packages',
    'dockview-core',
    'package.json'
);
const dockviewCorePackageJson = JSON.parse(
    fs.readFileSync(dockviewCorePath).toString()
);

dockviewCorePackageJson.version = version;

fs.writeFileSync(
    dockviewCorePath,
    JSON.stringify(dockviewCorePackageJson, null, 4)
);

// dockview

const depPackages = ['dockview', 'dockview-vue'];

for (const depPackage of depPackages) {
    const dockviewPath = path.join(
        rootDir,
        'packages',
        depPackage,
        'package.json'
    );
    const dockviewPackageJson = JSON.parse(
        fs.readFileSync(dockviewPath).toString()
    );

    dockviewPackageJson.version = version;
    dockviewPackageJson.dependencies['dockview-core'] =
        dockviewPackageJson.version;

    fs.writeFileSync(
        dockviewPath,
        JSON.stringify(dockviewPackageJson, null, 4)
    );

    // sanity check

    const dvCore = JSON.parse(fs.readFileSync(dockviewCorePath).toString());
    const dv = JSON.parse(fs.readFileSync(dockviewPath).toString());

    console.log(`dockview-core version: ${dvCore.version}`);
    console.log(
        `${depPackage} version: ${dv.version} dockview-core dependency version: ${dv.dependencies['dockview-core']}`
    );
}
