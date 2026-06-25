import { test, expect } from '@playwright/test';

/**
 * Auto-hide edge groups — the slide-out peek. Real-browser only: the
 * load-bearing rule is that peeking floats the panel over content WITHOUT
 * reflowing the grid (jsdom has no layout). Triggers are the collapsed edge
 * group's native tabs.
 */
test.describe('auto-hide edge groups (peek)', () => {
    const setup = async (page) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupAutoHideEdge());
    };
    const edgeTab = (page) =>
        page.locator('.dv-groupview-edge .dv-tab').first();

    test('clicking a collapsed edge tab peeks over the content without reflow', async ({
        page,
    }) => {
        await setup(page);
        const main = page.locator('.dv-test-panel', { hasText: 'main' });
        const before = (await main.boundingBox())!;

        await edgeTab(page).click();
        const overlay = page.locator('.dv-edge-peek');
        await expect(overlay).toBeVisible();
        expect((await overlay.boundingBox())!.width).toBeGreaterThan(100);
        // the peeked panel content is shown inside the overlay
        await expect(overlay.locator('.dv-test-panel')).toBeVisible();

        const during = (await main.boundingBox())!;
        expect(Math.abs(during.width - before.width)).toBeLessThan(2);

        await page.keyboard.press('Escape');
        await expect(overlay).toHaveCount(0);
    });

    test('hovering a collapsed edge tab opens the peek', async ({ page }) => {
        await setup(page);
        await edgeTab(page).hover();
        await expect(page.locator('.dv-edge-peek')).toBeVisible();
        await page.mouse.move(900, 500);
        await expect(page.locator('.dv-edge-peek')).toHaveCount(0);
    });

    test('the pin button re-docks the edge group (reflows once)', async ({
        page,
    }) => {
        await setup(page);
        const main = page.locator('.dv-test-panel', { hasText: 'main' });
        const before = (await main.boundingBox())!;

        await edgeTab(page).click();
        await page.locator('.dv-edge-peek-pin').click();

        await expect(page.locator('.dv-edge-peek')).toHaveCount(0);
        expect((await main.boundingBox())!.width).toBeLessThan(before.width);
    });
});
