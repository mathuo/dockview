import { defineConfig, devices } from '@playwright/test';

/**
 * Cross-window end-to-end harness. jsdom cannot model a second `document`
 * (the unit-test `setupMockWindow` mock reuses the main one), so popout /
 * cross-window behaviour — focus routing, per-window listeners, per-window
 * live regions — can only be verified in a real browser. This config drives a
 * static fixture page (built UMD bundles) in headless Chromium.
 *
 * Prerequisite: the UMD bundles must exist —
 *   yarn nx run-many -t build:bundle -p dockview-core dockview-enterprise
 * then `yarn test:e2e`.
 */
export default defineConfig({
    testDir: './e2e/tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:4321',
        headless: true,
        trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        // Zero-dependency static server over the repo root so the fixture can
        // load the built bundles and the popout target by absolute path.
        command: 'python3 -m http.server 4321',
        url: 'http://localhost:4321/e2e/fixtures/index.html',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
});
