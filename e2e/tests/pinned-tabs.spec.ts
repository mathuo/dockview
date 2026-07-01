import { test, expect, Page } from '@playwright/test';

/**
 * Pinned tabs — real-browser behaviour the jsdom unit tests cannot reach:
 * geometry (the second row growing the header and reflowing content), compact
 * rendering (a hidden title actually collapsing the tab), and overflow (a
 * pinned tab excluded from the dropdown while the strip clips).
 */
test.describe('pinned tabs', () => {
    const setup = async (page: Page, mode?: 'separate-row') => {
        await page.goto(
            '/e2e/fixtures/index.html' + (mode ? `?pinned=${mode}` : '')
        );
        await page.waitForFunction(() => (window as any).__ready === true);
    };

    const box = (page: Page, selector: string) =>
        page.locator(selector).first().boundingBox();

    test('separate-row: the pinned row grows the header and reflows content', async ({
        page,
    }) => {
        await setup(page, 'separate-row');
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['a', 'b', 'c'], [])
        );

        // Baseline: single-row header, no pinned row.
        const headerBefore = (await box(
            page,
            '.dv-tabs-and-actions-container'
        ))!;
        const contentBefore = (await box(page, '.dv-content-container'))!;
        expect(await page.locator('.dv-pinned-row').count()).toBe(0);

        // Pin a tab → the second row mounts.
        await page.evaluate(() => (window as any).__dv.setPinned('a', true));
        await expect(page.locator('.dv-pinned-row')).toBeVisible();

        const pinnedRow = (await box(page, '.dv-pinned-row'))!;
        const mainStrip = (await box(page, '.dv-tabs-container'))!;
        const headerAfter = (await box(
            page,
            '.dv-tabs-and-actions-container'
        ))!;
        const contentAfter = (await box(page, '.dv-content-container'))!;

        // The pinned row sits above the main strip.
        expect(pinnedRow.y).toBeLessThan(mainStrip.y);

        // The header grew by a row and the content shrank by the same amount.
        const grow = headerAfter.height - headerBefore.height;
        const shrink = contentBefore.height - contentAfter.height;
        expect(grow).toBeGreaterThan(0);
        expect(shrink).toBeGreaterThan(0);
        expect(Math.abs(grow - shrink)).toBeLessThan(2);

        // The pinned tab renders in the row.
        await expect(page.locator('.dv-pinned-row .dv-pinned-tab')).toHaveText(
            'a'
        );

        // Unpinning the last pinned tab collapses the row back.
        await page.evaluate(() => (window as any).__dv.setPinned('a', false));
        await expect(page.locator('.dv-pinned-row')).toHaveCount(0);
        const headerRestored = (await box(
            page,
            '.dv-tabs-and-actions-container'
        ))!;
        expect(
            Math.abs(headerRestored.height - headerBefore.height)
        ).toBeLessThan(2);
    });

    test('compact: a pinned tab hides its title and shrinks', async ({
        page,
    }) => {
        await setup(page);
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['alpha', 'bravo'], ['alpha'])
        );

        // The compact pinned tab's title content is hidden…
        await expect(
            page.locator('.dv-tab--pinned-compact .dv-default-tab-content')
        ).toBeHidden();

        // …and it is narrower than a normal (titled) tab.
        const compact = (await box(page, '.dv-tab--pinned-compact'))!;
        const normal = (await box(page, '.dv-tab:not(.dv-tab--pinned)'))!;
        expect(compact.width).toBeLessThan(normal.width);
    });

    test('overflow: a pinned tab is excluded from the overflow dropdown', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 250, height: 500 });
        await setup(page);

        const ids = Array.from({ length: 15 }, (_, i) => `panel-${i}`);
        await page.evaluate(
            (ids) => (window as any).__dv.setupPinned(ids, [ids[7]]),
            ids
        );

        // The strip overflows: the dropdown handle appears.
        const handle = page.locator('.dv-tabs-overflow-dropdown-default');
        await expect(handle).toBeVisible();
        await handle.click();

        const overflow = page.locator('.dv-tabs-overflow-container');
        await expect(overflow).toBeVisible();

        // Unpinned tabs overflow into the dropdown…
        await expect(overflow.locator('.dv-tab')).not.toHaveCount(0);
        // …but the pinned panel is never listed there.
        await expect(overflow).not.toContainText('panel-7');
    });
});
