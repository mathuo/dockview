import { test, expect, Page } from '@playwright/test';

/**
 * Smoke test that validates the cross-window harness itself: popping out a
 * group must open a real second window with the group rendered inside it.
 * This is the foundation the (deferred) popout cross-window focus / live-region
 * tests build on — none of which jsdom can express.
 */
test.describe('cross-window popout harness', () => {
    test('popping out a group opens a second window that renders it', async ({
        page,
        context,
    }) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);

        await page.evaluate(() => {
            (window as any).__dv.addPanel('alpha');
            (window as any).__dv.addPanel('beta'); // beta active, same group
        });

        // window.open surfaces as a new Playwright page.
        const [popout] = await Promise.all([
            context.waitForEvent('page'),
            page.evaluate(() => (window as any).__dv.popoutActiveGroup()),
        ]);

        await (popout as Page).waitForLoadState();

        // The group's tab strip and the active panel's content now live in the
        // popout document, not the opener.
        await expect(popout.locator('.dv-tabs-container')).toBeVisible();
        await expect(popout.locator('.dv-test-panel')).toContainText('beta');
    });
});
