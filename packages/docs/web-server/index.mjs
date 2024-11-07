import http from 'http';
import path, { dirname } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const PORT = 1111;
const HOST = 'localhost';

const __dirname = dirname(fileURLToPath(import.meta.url));

const packagesPath = path.join(__dirname, '..', '..');

function write(res, file) {
    const route = path.join(packagesPath, ...file);

    if (!fs.existsSync(route)) {
        res.writeHead(404);
        res.end('');
        return;
    }

    if (file[file.length - 1].endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }

    const content = fs.readFileSync(route).toString();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Max-Age', 60 * 60 * 24 * 30);
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.writeHead(200);
    res.end(content);
}

http.createServer((req, res) => {
    const route = req.url.split('/').slice(1);
    if (route.includes('..')) {
        res.writeHead(403);
        res.end('');
        return;
    }
    write(res, route);
}).listen(PORT, HOST);
