const fs = require('fs');
const path = require('path');

const sourceCssDir = path.resolve(__dirname, '../../dockview-core/dist/styles');
const targetDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Copy CSS files from dockview-core styles directory
if (fs.existsSync(sourceCssDir)) {
    const files = fs.readdirSync(sourceCssDir);
    
    files.forEach(file => {
        if (file.endsWith('.css')) {
            const sourcePath = path.join(sourceCssDir, file);
            const targetPath = path.join(targetDir, file);
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`Copied ${file} to dist/`);
        }
    });
} else {
    console.warn('dockview-core styles directory not found. Make sure to build dockview-core first.');
}