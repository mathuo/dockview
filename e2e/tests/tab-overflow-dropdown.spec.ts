import { test, expect, Page } from '@playwright/test';

/**
 * Tab overflow dropdown — when a strip is too narrow for its tabs, the extras
 * collapse behind a dropdown handle; opening it and picking a hidden tab
 * activates that panel. Real-browser only: whether the strip overflows (and
 * which tabs are pushed into the dropdown) is decided from measured widths,
 * which jsdom can't produce.
 *
 * (pinned-tabs.spec.ts covers that a pinned tab is *excluded* from the
 * dropdown; this covers the open-and-select flow itself.)
 */
test.describe('tab overflow dropdown', () => {
    const setup = async (page: Page) => {
        await page.setViewportSize({ width: 300, height: 500 });
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => {
            for (let i = 0; i < 12; i++)
                (window as any).__dv.addPanel('panel-long-title-' + i);
        });
    };

    test('selecting a hidden tab from the dropdown activates it', async ({
        page,
    }) => {
        await setup(page);

        // The strip overflows: the dropdown handle appears.
        const handle = page.locator('.dv-tabs-overflow-dropdown-default');
        await expect(handle).toBeVisible();
        await handle.click();

        // The dropdown lists the overflowed tabs.
        const overflow = page.locator('.dv-tabs-overflow-container');
        await expect(overflow).toBeVisible();
        await expect(overflow.locator('.dv-tab')).not.toHaveCount(0);

        // Pick the first hidden tab → it becomes the active tab…
        const hiddenTab = overflow.locator('.dv-tab').first();
        const title = (await hiddenTab.textContent())!.trim();
        await hiddenTab.click();

        await expect(page.locator('.dv-active-tab')).toHaveText(title);
        // …and the dropdown closes.
        await expect(overflow).toHaveCount(0);
    });
});
