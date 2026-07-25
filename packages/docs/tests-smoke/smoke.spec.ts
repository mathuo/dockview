import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { installCdnMirror } from './cdn-mirror';

const TEMPLATES_ROOT = path.join(__dirname, '..', 'static', 'templates');

// The mounted root element for each component kind.
const ROOT_SELECTOR: Record<string, string> = {
    dockview: '.dv-dockview',
    splitview: '.dv-split-view-container',
    gridview: '.dv-grid-view',
    paneview: '.dv-pane-container',
};

const FRAMEWORKS = ['react', 'typescript', 'vue', 'angular'];

// Pre-existing example-source issues, unrelated to module resolution or the
// blank-render class this suite guards. Skipped with a reason so the run stays
// honest instead of silently green. Each is tracked as its own follow-up.
const KNOWN_ISSUES: Record<string, string> = {
    'dockview/full-width-tab/react':
        'example uses `import * as React`; the React UMD interop under SystemJS drops createElement',
    'dockview/iframe/react':
        'example uses `import * as React`; same interop as full-width-tab',
    'dockview/layout-history/angular':
        'Angular NG0202: decorator metadata is dropped by the in-browser TypeScript transpiler',
};

// The two failure classes we assert on. Framework dev-mode chatter (e.g. Vue's
// production-build hint) is deliberately not one of them.
const RESOLUTION_ERROR = [
    /is not a function/i,
    /cannot find module/i,
    /is not defined/i,
    /failed to fetch dynamically imported/i,
    /unexpected token/i,
];

type Example = {
    component: string;
    id: string;
    framework: string;
    key: string;
    urlPath: string;
};

function discover(): Example[] {
    const out: Example[] = [];
    for (const component of Object.keys(ROOT_SELECTOR)) {
        const dir = path.join(TEMPLATES_ROOT, component);
        if (!fs.existsSync(dir)) {
            continue;
        }
        for (const id of fs.readdirSync(dir)) {
            // demo-dockview is the special react+angular /demo example, not a
            // standard CodeRunner template; it is exercised elsewhere.
            if (id === 'demo-dockview') {
                continue;
            }
            for (const framework of FRAMEWORKS) {
                const index = path.join(dir, id, framework, 'index.html');
                if (!fs.existsSync(index)) {
                    continue;
                }
                out.push({
                    component,
                    id,
                    framework,
                    key: `${component}/${id}/${framework}`,
                    urlPath: `/templates/${component}/${id}/${framework}/index.html`,
                });
            }
        }
    }
    return out.sort((a, b) => a.key.localeCompare(b.key));
}

const examples = discover();

if (examples.length === 0) {
    throw new Error(
        'No generated templates found under static/templates. Run `npm run build-templates:local` first.'
    );
}

test.beforeEach(async ({ context }) => {
    await installCdnMirror(context);
});

test.describe('docs live examples render', () => {
    for (const ex of examples) {
        test(ex.key, async ({ page }) => {
            const issue = KNOWN_ISSUES[ex.key];
            test.skip(!!issue, issue);

            const resolutionErrors: string[] = [];
            const flag = (text: string) => {
                if (RESOLUTION_ERROR.some((re) => re.test(text))) {
                    resolutionErrors.push(text);
                }
            };
            page.on('console', (m) => {
                if (m.type() === 'error') flag(m.text());
            });
            page.on('pageerror', (e) => flag(e.message));
            page.on('response', (r) => {
                if (r.status() >= 400) {
                    const u = r.url();
                    // Ignore cosmetic 404s (fonts / favicons / brand svg); flag
                    // package or app module 404s, the SystemJS-staleness class.
                    if (!/googleapis|gstatic|favicon|\.svg(\?|$)/i.test(u)) {
                        resolutionErrors.push(`HTTP ${r.status()} ${u}`);
                    }
                }
            });

            await page.goto(ex.urlPath, { waitUntil: 'load' });

            const selector = ROOT_SELECTOR[ex.component];
            // (1) the component mounts into the DOM
            await page
                .locator(selector)
                .first()
                .waitFor({ state: 'attached', timeout: 15_000 });

            // (2) and paints with real size once ancestor clipping is applied.
            // A collapsed/blank example (e.g. the Vue fallthrough bug) leaves
            // the root in the DOM but clipped to zero height by a parent, which
            // a plain `toBeVisible` / bounding-box check does not catch.
            const visible = await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                if (!el) {
                    return { w: 0, h: 0 };
                }
                const r = el.getBoundingClientRect();
                let x1 = r.left;
                let y1 = r.top;
                let x2 = r.right;
                let y2 = r.bottom;
                let p = el.parentElement;
                while (p) {
                    const s = getComputedStyle(p);
                    if (
                        s.overflowX !== 'visible' ||
                        s.overflowY !== 'visible'
                    ) {
                        const pr = p.getBoundingClientRect();
                        x1 = Math.max(x1, pr.left);
                        y1 = Math.max(y1, pr.top);
                        x2 = Math.min(x2, pr.right);
                        y2 = Math.min(y2, pr.bottom);
                    }
                    p = p.parentElement;
                }
                return { w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
            }, selector);

            expect(
                visible.w > 10 && visible.h > 10,
                `${ex.key} rendered but is not visible (clipped size ${visible.w}x${visible.h})`
            ).toBe(true);

            // (3) no module-resolution failures — a boilerplate pointing at a
            // path the build no longer produces, or an unresolved import.
            expect(
                resolutionErrors,
                `${ex.key} module-resolution errors:\n${resolutionErrors.join('\n')}`
            ).toEqual([]);
        });
    }
});
