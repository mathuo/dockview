import { test, expect, Page } from '@playwright/test';

/**
 * Watermark — the placeholder shown when the grid has no groups. Real-browser
 * only: it mounts/unmounts in the live DOM as groups come and go, and must not
 * linger over a restored (non-empty) layout. jsdom's no-layout DOM makes the
 * mount/unmount observable but the restore-persistence regression (#515) is
 * best guarded end-to-end.
 */
test.describe('watermark', () => {
    const ready = async (page: Page) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
    };

    const watermark = (page: Page) => page.locator('.dv-watermark-container');

    test('shows on an empty grid, hides once a panel is added', async ({
        page,
    }) => {
        await ready(page);
        await expect(watermark(page)).toHaveCount(1);

        await page.evaluate(() => (window as any).__dv.addPanel('alpha'));
        await expect(watermark(page)).toHaveCount(0);
    });

    test('returns when the last panel is removed', async ({ page }) => {
        await ready(page);
        await page.evaluate(() => (window as any).__dv.addPanel('alpha'));
        await expect(watermark(page)).toHaveCount(0);

        await page.evaluate(() => (window as any).__dv.closePanel('alpha'));
        await expect(watermark(page)).toHaveCount(1);
    });

    test('does not persist over a restored non-empty layout', async ({
        page,
    }) => {
        await ready(page);
        await page.evaluate(() => {
            (window as any).__dv.addPanel('a');
            (window as any).__dv.addPanel('b');
        });
        const json = await page.evaluate(() =>
            JSON.stringify((window as any).__dv.snapshot())
        );

        // Fresh component shows the watermark (empty)…
        await ready(page);
        await expect(watermark(page)).toHaveCount(1);

        // …restoring a non-empty layout must clear it (the watermark mounted
        // during the empty state must not linger over the restored groups).
        await page.evaluate(
            (state) => (window as any).__dv.restore(JSON.parse(state)),
            json
        );
        await expect(watermark(page)).toHaveCount(0);
        await expect(page.locator('.dv-test-panel')).toContainText('b');
    });
});
