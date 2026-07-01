import { test, expect, Page } from '@playwright/test';

/**
 * Tab-group chips (TabGroupChipsModule) — real-browser behaviour: creating a
 * tab group via the public API renders a `.dv-tab-group-chip` in the live
 * header (the chip mounts on a microtask and paints alongside the grouped
 * tabs), and right-clicking that chip opens the chip context menu popover.
 * jsdom can assert the chip element exists but not that it is laid out and
 * hit-testable for a real contextmenu dispatch.
 */
test.describe('tab-group chips', () => {
    const setup = async (page: Page) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        return page.evaluate(() => (window as any).__dv.setupTabGroupChip());
    };

    test('creating a tab group renders a labelled chip in the header', async ({
        page,
    }) => {
        await setup(page);

        const chip = page.locator('.dv-tab-group-chip');
        await expect(chip).toBeVisible();
        await expect(chip.locator('.dv-tab-group-chip-label')).toHaveText(
            'Monitoring'
        );
    });

    test('right-clicking the chip opens the chip context menu', async ({
        page,
    }) => {
        await setup(page);

        const chip = page.locator('.dv-tab-group-chip');
        await expect(chip).toBeVisible();
        await chip.click({ button: 'right' });

        const menu = page.locator('.dv-context-menu');
        await expect(menu).toBeVisible();
        await expect(menu).toHaveAttribute('role', 'menu');
        // The chip menu is distinct from the tab menu: it carries the
        // configured rename input + the custom action item.
        await expect(menu.locator('.dv-context-menu-rename')).toBeVisible();
        await expect(menu).toContainText('Custom Action');
    });

    test('the chip menu closes on an outside click', async ({ page }) => {
        await setup(page);

        const chip = page.locator('.dv-tab-group-chip');
        await chip.click({ button: 'right' });
        await expect(page.locator('.dv-context-menu')).toBeVisible();

        // Wait past the popover's outside-pointerdown grace window (200ms).
        await page.waitForTimeout(250);
        await page.mouse.click(600, 450);
        await expect(page.locator('.dv-context-menu')).toHaveCount(0);
        // The chip itself survives.
        await expect(chip).toBeVisible();
    });
});
