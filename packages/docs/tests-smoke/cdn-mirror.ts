import type { BrowserContext } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR =
    process.env.DOCKVIEW_SMOKE_CDN_CACHE ||
    path.join(os.tmpdir(), 'dockview-smoke-cdn-cache');

function cachePathFor(url: string): string {
    const hash = crypto.createHash('sha1').update(url).digest('hex');
    const ext = path.extname(new URL(url).pathname) || '.bin';
    return path.join(CACHE_DIR, hash + ext);
}

async function fetchThroughNode(url: string): Promise<{
    body: Buffer;
    status: number;
    contentType: string;
}> {
    const file = cachePathFor(url);
    const meta = `${file}.meta`;
    if (fs.existsSync(file) && fs.existsSync(meta)) {
        return {
            body: fs.readFileSync(file),
            ...(JSON.parse(fs.readFileSync(meta, 'utf8')) as {
                status: number;
                contentType: string;
            }),
        };
    }
    const res = await fetch(url, { redirect: 'follow' });
    const body = Buffer.from(await res.arrayBuffer());
    const contentType =
        res.headers.get('content-type') || 'application/octet-stream';
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    // Write atomically so parallel workers never read a half-written file.
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, body);
    fs.renameSync(tmp, file);
    fs.writeFileSync(meta, JSON.stringify({ status: res.status, contentType }));
    return { body, status: res.status, contentType };
}

/**
 * Serve the external CDN dependencies (SystemJS, TypeScript, React, Vue,
 * Angular) through Node's `fetch` with an on-disk cache instead of letting each
 * page hit the network directly. Two reasons:
 *   - every unique asset is fetched once per run, not once per example page, so
 *     a full sweep stays fast and does not hammer the CDN;
 *   - it works behind an HTTPS proxy or on a restricted network where the
 *     browser cannot reach the CDN but Node (which honours HTTPS_PROXY) can.
 *
 * Requests to our own localhost servers pass straight through. If Node cannot
 * reach the CDN either, the request falls back to the browser's own network so
 * behaviour on an unrestricted machine is unchanged.
 */
export async function installCdnMirror(context: BrowserContext): Promise<void> {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    await context.route('**/*', async (route) => {
        const url = route.request().url();
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            return route.continue();
        }
        // Google Fonts is cosmetic and not always reachable; stub it out.
        if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url)) {
            return route.fulfill({
                status: 200,
                contentType: 'text/css',
                body: '',
            });
        }
        try {
            const { body, status, contentType } = await fetchThroughNode(url);
            await route.fulfill({ status, contentType, body });
        } catch {
            await route.continue();
        }
    });
}
