const fs = require('fs');
const path = require('path');

function* readAllFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        if (file.isDirectory()) {
            yield* readAllFiles(path.join(dir, file.name));
        } else {
            yield path.join(dir, file.name);
        }
    }
}

console.log(
    Array.from(
        readAllFiles(path.join(__dirname, '..', 'dockview-core', 'src'))
    ).filter((file) => file.endsWith('.scss'))
);
