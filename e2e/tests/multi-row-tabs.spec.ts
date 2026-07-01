import { test, expect } from '@playwright/test';

/**
 * Multi-row (wrapping) tabs — Phase 2 wrap render mode. Real-browser only: it
 * depends on the tab strip actually wrapping and the header growing, which jsdom
 * (no layout) can't produce. The fixture opts into `overflow.mode: 'wrap'` via
 * `?overflow=wrap`.
 */
test.describe('multi-row tabs (wrap mode)', () => {
    const setup = async (page) => {
        await page.goto('/e2e/fixtures/index.html?overflow=wrap');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupWrapTabs(20));
    };

    test('tabs wrap onto multiple rows and the header grows', async ({
        page,
    }) => {
        await setup(page);

        const tabsList = page.locator('.dv-tabs-container').first();
        await expect(tabsList).toHaveClass(/dv-tabs-container--wrap/);

        // the tabs occupy more than one row (more than one distinct offsetTop)
        const rowCount = await page.evaluate(() => {
            const list = document.querySelector('.dv-tabs-container')!;
            const tops = new Set<number>();
            list.querySelectorAll<HTMLElement>('.dv-tab').forEach((t) =>
                tops.add(t.offsetTop)
            );
            return tops.size;
        });
        expect(rowCount).toBeGreaterThan(1);

        // the header grew past a single row (default row height is 44px)
        const header = (await page
            .locator('.dv-tabs-and-actions-container')
            .first()
            .boundingBox())!;
        expect(header.height).toBeGreaterThan(44);
    });

    test('content shrinks to the area below the multi-row header', async ({
        page,
    }) => {
        await setup(page);

        const groupBox = (await page
            .locator('.dv-groupview')
            .first()
            .boundingBox())!;
        const headerBox = (await page
            .locator('.dv-tabs-and-actions-container')
            .first()
            .boundingBox())!;
        const contentBox = (await page
            .locator('.dv-content-container')
            .first()
            .boundingBox())!;

        // multi-row header
        expect(headerBox.height).toBeGreaterThan(44);

        // the active panel was laid out with the shrunk content area, not the
        // header-inclusive group box (the content-sizing seam + relayout)
        const reported = await page.evaluate(() =>
            (window as any).__dv.panelDimensions('wrap-tab-19')
        );
        expect(reported).toBeTruthy();
        expect(reported.height).toBeCloseTo(contentBox.height, 0);
        expect(reported.height).toBeCloseTo(
            groupBox.height - headerBox.height,
            0
        );
    });

    test('no wrap class without the opt-in', async ({ page }) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupWrapTabs(20));

        await expect(
            page.locator('.dv-tabs-container').first()
        ).not.toHaveClass(/dv-tabs-container--wrap/);
    });

    // Phase 3: 2-D cross-row drag reorder (smooth mode). A tab dragged from a
    // lower row to a slot on an upper row reorders across the row boundary.
    test('a tab drags across rows to reorder (smooth mode)', async ({
        page,
    }) => {
        await page.goto('/e2e/fixtures/index.html?overflow=wrap&smooth=1');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupWrapTabs(20));

        const tabOrder = () =>
            page.evaluate(() =>
                Array.from(
                    document.querySelectorAll('.dv-tabs-container .dv-tab')
                ).map((t) => (t as HTMLElement).innerText.trim())
            );

        const before = await tabOrder();
        expect(before.length).toBe(20);
        // sanity: tabs really wrapped to more than one row
        const rows = await page.evaluate(() => {
            const tops = new Set<number>();
            document
                .querySelectorAll<HTMLElement>('.dv-tabs-container .dv-tab')
                .forEach((t) => tops.add(t.offsetTop));
            return tops.size;
        });
        expect(rows).toBeGreaterThan(1);

        // drag the last tab (a lower row) to the front (first tab, upper row)
        const source = page.locator('.dv-tab', {
            hasText: 'wrap-tab-long-title-19',
        });
        const target = page.locator('.dv-tab', {
            hasText: 'wrap-tab-long-title-0',
        });
        const s = (await source.boundingBox())!;
        const t = (await target.boundingBox())!;

        await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
        await page.mouse.down();
        // nudge to start the drag
        await page.mouse.move(s.x + s.width / 2 + 6, s.y + s.height / 2);
        // move onto the left half of the first tab (insert before it)
        await page.mouse.move(t.x + 3, t.y + t.height / 2, { steps: 20 });
        await page.mouse.up();

        const after = await tabOrder();
        // the dragged tab moved to the front and the set is unchanged
        expect(after[0]).toContain('wrap-tab-long-title-19');
        expect([...after].sort()).toEqual([...before].sort());
        expect(after).not.toEqual(before);
    });
});
