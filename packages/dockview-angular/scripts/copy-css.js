const fs = require('fs');
const path = require('path');

const sourceCssDir = path.resolve(__dirname, '../../dockview-core/dist/styles');
// Match the other framework packages (dockview-react / dockview-vue) and the
// documented import path: styles live under `dist/styles`, not the dist root.
const targetDir = path.resolve(__dirname, '../dist/styles');

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
            console.log(`Copied ${file} to dist/styles/`);
        }
    });
} else {
    console.warn('dockview-core styles directory not found. Make sure to build dockview-core first.');
}