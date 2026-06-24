import { test, expect } from '@playwright/test';

/**
 * Auto-hide edge groups — the slide-out peek (Phase 2). Real-browser only: the
 * load-bearing rule is that peeking floats the panel over content **without
 * reflowing the grid**, which needs real layout (jsdom has none).
 */
test.describe('auto-hide edge groups (peek)', () => {
    test('clicking an activator peeks over the content without reflowing it', async ({
        page,
    }) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupAutoHideEdge());

        const main = page.locator('.dv-test-panel', { hasText: 'main' });
        const before = (await main.boundingBox())!;
        expect(before.width).toBeGreaterThan(0);

        // peek
        await page.locator('.dv-edge-activator').first().click();
        const overlay = page.locator('.dv-edge-peek');
        await expect(overlay).toBeVisible();
        const box = (await overlay.boundingBox())!;
        expect(box.width).toBeGreaterThan(100); // slid out to the expanded size

        // the main content kept its width — the peek floated over, no reflow
        const during = (await main.boundingBox())!;
        expect(Math.abs(during.width - before.width)).toBeLessThan(2);

        // Escape closes the peek
        await page.keyboard.press('Escape');
        await expect(overlay).toHaveCount(0);
    });

    test('hovering an activator opens the peek', async ({ page }) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupAutoHideEdge());

        await page.locator('.dv-edge-activator').first().hover();
        // opens after the hover (openDelay); expect auto-waits
        await expect(page.locator('.dv-edge-peek')).toBeVisible();

        // moving the pointer far away closes it after closeDelay
        await page.mouse.move(900, 500);
        await expect(page.locator('.dv-edge-peek')).toHaveCount(0);
    });

    test('the pin button re-docks the edge group (and now reflows once)', async ({
        page,
    }) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupAutoHideEdge());

        const main = page.locator('.dv-test-panel', { hasText: 'main' });
        const before = (await main.boundingBox())!;

        await page.locator('.dv-edge-activator').first().click();
        await page.locator('.dv-edge-peek-pin').click();

        await expect(page.locator('.dv-edge-peek')).toHaveCount(0);
        // pinning expands the edge group, so the main content is now narrower
        const after = (await main.boundingBox())!;
        expect(after.width).toBeLessThan(before.width);
    });
});
