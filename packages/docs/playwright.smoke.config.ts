import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke suite for the generated docs live examples.
 *
 * Loads every generated `static/templates/**\/index.html` in a real browser and
 * asserts each example actually renders (visible, non-zero size after ancestor
 * clipping) with no module-resolution errors. This is the layer that catches
 * the two failure modes unit tests miss: a boilerplate pointing at a build
 * output that no longer exists (404s), and a component that mounts but paints
 * blank (e.g. a collapsed dock).
 *
 * Prerequisite: the package `dist/` bundles must exist, since `test:smoke`
 * regenerates the templates against them first via `build-templates:local`:
 *   yarn nx run-many -t build,build:bundle -p dockview-core dockview \
 *       dockview-react dockview-vue dockview-angular dockview-enterprise
 *
 * Two servers back the run, mirroring `npm start`:
 *   - the ESM package server on :1111 (serves the built dist/ bundles);
 *   - a static server over `static/` so /templates, /example-runner and /img
 *     resolve exactly as they do under Docusaurus.
 */

const STATIC_PORT = 4330;

export default defineConfig({
    testDir: './tests-smoke',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 4 : undefined,
    reporter: 'list',
    timeout: 45_000,
    use: {
        baseURL: `http://localhost:${STATIC_PORT}`,
        headless: true,
        // Let a CI image supply its own Chromium (opt-in; no effect unset).
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
            : undefined,
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: [
        {
            // The same ESM package server `npm start` runs. Readiness is gated
            // on a built bundle so a missing dist/ fails fast and clearly.
            command: 'node web-server/index.mjs',
            url: 'http://localhost:1111/dockview-core/dist/package/main.cjs.js',
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
        },
        {
            command: `python3 -m http.server ${STATIC_PORT} --directory static`,
            url: `http://localhost:${STATIC_PORT}/example-runner/dockview-vue-boilerplate/systemjs.config.js`,
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
        },
    ],
});
