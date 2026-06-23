import { test, expect, Page } from '@playwright/test';

/**
 * Cross-window keyboard docking: the keyboard services attach their listeners to
 * each popout document and gate on `ownsElement`, so `Ctrl+M` docking can be
 * driven from *inside* a popped-out window — and its narration routes to that
 * window's live region. None of this is reachable in jsdom (the mock popout
 * shares the main document, so there is no second window to listen on).
 */
test.describe('cross-window keyboard docking', () => {
    const popout = async (page: Page, context) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => {
            (window as any).__dv.addPanel('alpha');
            (window as any).__dv.addPanel('beta'); // beta active, same group
        });
        const [win] = await Promise.all([
            context.waitForEvent('page'),
            page.evaluate(() => (window as any).__dv.popoutActiveGroup()),
        ]);
        await (win as Page).waitForLoadState();
        return win as Page;
    };

    test('Ctrl+M inside a popout narrates into the popout and Esc cancels there', async ({
        page,
        context,
    }) => {
        const win = await popout(page, context);

        // Activate + focus a panel in the popout, then arm keyboard docking
        // with a keystroke made *in the popout document*.
        await win.locator('.dv-test-panel').first().click();
        await win.keyboard.press('Control+m');

        // The keydown was seen by the popout's own listener (not the opener's),
        // passed the cross-document `ownsElement` gate, and the narration routed
        // to the popout's live region.
        await expect(win.locator('.dv-live-region')).toContainText(
            'Moving beta'
        );

        await win.keyboard.press('Escape');
        await expect(win.locator('.dv-live-region')).toHaveText(
            'Move cancelled.'
        );
    });

    test('a keyboard split committed inside a popout acts on the popout group', async ({
        page,
        context,
    }) => {
        const win = await popout(page, context);

        // Popping out leaves a placeholder group in the main grid, so capture
        // the starting count rather than assume it.
        const before = await page.evaluate(() =>
            (window as any).__dv.groupCount()
        );

        await win.locator('.dv-test-panel').first().click();
        await win.keyboard.press('Control+m'); // arm: target = own group
        await win.keyboard.press('Enter'); // choose this group -> edge phase
        await win.keyboard.press('ArrowLeft'); // left edge (split)
        await win.keyboard.press('Enter'); // commit

        // The split ran inside the popout's own gridview: beta is now its own
        // group, so the component reports exactly one more group than before.
        await expect
            .poll(() => page.evaluate(() => (window as any).__dv.groupCount()))
            .toBe(before + 1);
        await expect(win.locator('.dv-live-region')).toContainText('beta');
    });
});
