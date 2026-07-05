import { test, expect } from '@playwright/test';

/**
 * Keyboard docking — the 'float' terminal action. Arming a move with `Ctrl+M`
 * enters the PICK-TARGET phase; from there `Ctrl+Shift+F` pulls the moving panel
 * out into a new floating group instead of docking it, and narrates the result
 * into the live region. Real-browser only: it needs a genuine focused element to
 * arm the move and real floating-group geometry for the result.
 */
test.describe('keyboard docking (float action)', () => {
    test('Ctrl+Shift+F floats the moving panel', async ({ page }) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        // Two panels in one group so the active one can be pulled out into a
        // float (a lone group can't be floated).
        await page.evaluate(() => {
            (window as any).__dv.addPanel('alpha');
            (window as any).__dv.addPanel('beta'); // beta active
        });
        expect(
            await page.evaluate(() => (window as any).__dv.floatingCount())
        ).toBe(0);

        // Focus the active panel, arm keyboard docking, then float.
        await page.locator('.dv-test-panel').first().click();
        await page.keyboard.press('Control+m');
        await page.keyboard.press('Control+Shift+F');

        // A floating group now exists (the moving panel was pulled out)…
        await expect
            .poll(() =>
                page.evaluate(() => (window as any).__dv.floatingCount())
            )
            .toBe(1);
        await expect(page.locator('.dv-resize-container')).toHaveCount(1);
        // …and the float was narrated into the live region.
        await expect(page.locator('.dv-live-region')).toContainText('floated');
    });
});
