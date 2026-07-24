import { test, expect, Page } from '@playwright/test';

/**
 * Pointer-drag inside a popout window. The splitview sash (and the scrollbar,
 * which shares the identical fix) attached its `pointermove`/`pointerup`
 * listeners to the *opener's* `document`, so a drag started in a popout was
 * never heard — resizing a split was dead inside a popped-out window. The fix
 * binds the drag to the element's own document. Only a real second window
 * exercises this; jsdom reuses the main document.
 */
test.describe('cross-window pointer drag', () => {
    const popoutWithSash = async (page: Page, context) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => {
            (window as any).__dv.addPanel('alpha');
            (window as any).__dv.addPanel('beta');
        });
        const [win] = await Promise.all([
            context.waitForEvent('page'),
            page.evaluate(() => (window as any).__dv.popoutActiveGroup()),
        ]);
        await (win as Page).waitForLoadState();
        // Split a second group into the popout's own gridview, creating a sash
        // there to drag.
        await page.evaluate(() =>
            (window as any).__dv.splitIntoPopout('delta')
        );
        await (win as Page).locator('.dv-sash').first().waitFor();
        return win as Page;
    };

    test('dragging a sash inside the popout resizes its split', async ({
        page,
        context,
    }) => {
        const win = await popoutWithSash(page, context);

        const sash = win.locator('.dv-sash').first();
        const before = (await sash.boundingBox())!;
        expect(before).toBeTruthy();

        // Drag the sash ~80px to the right, entirely within the popout window.
        const cx = before.x + before.width / 2;
        const cy = before.y + before.height / 2;
        await win.mouse.move(cx, cy);
        await win.mouse.down();
        await win.mouse.move(cx + 80, cy, { steps: 8 });
        await win.mouse.up();

        // The boundary moved — proof the pointermove/up were heard in the
        // popout's document, not lost to the opener.
        const after = (await sash.boundingBox())!;
        expect(after.x).toBeGreaterThan(before.x + 40);
    });
});
