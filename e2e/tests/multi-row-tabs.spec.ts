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

    test('wrapped rows fill the row height (no gap) and header chrome stays on the first row', async ({
        page,
    }) => {
        await setup(page);

        const m = await page.evaluate(() => {
            const header = document.querySelector(
                '.dv-tabs-and-actions-container'
            ) as HTMLElement;
            const tab = document.querySelector(
                '.dv-tabs-container .dv-tab'
            ) as HTMLElement;
            const right = document.querySelector(
                '.dv-right-actions-container'
            ) as HTMLElement;
            const rowH = parseFloat(
                getComputedStyle(header).getPropertyValue(
                    '--dv-tabs-and-actions-container-height'
                )
            );
            return {
                rowH,
                headerH: header.offsetHeight,
                tabH: tab.offsetHeight,
                rightH: right ? right.offsetHeight : 0,
            };
        });

        expect(m.rowH).toBeGreaterThan(0); // the row-height var resolves
        // header actually wrapped to more than one row
        expect(m.headerH).toBeGreaterThan(m.rowH);
        // each wrapped tab fills a full row — no gap below the tab
        expect(m.tabH).toBe(m.rowH);
        // header actions sit on the first row, not stretched across all rows
        expect(m.rightH).toBe(m.rowH);
        expect(m.rightH).toBeLessThan(m.headerH);
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

    // `overflow.maxRows` caps the header height; the surplus rows spill into the
    // chevron dropdown. Real-browser only (row count is a layout fact).
    test('maxRows caps the header and spills the surplus into the dropdown', async ({
        page,
    }) => {
        await page.goto('/e2e/fixtures/index.html?overflow=wrap&maxRows=2');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupWrapTabs(20));

        const tabsList = page.locator('.dv-tabs-container').first();
        await expect(tabsList).toHaveClass(/dv-tabs-container--wrap-capped/);

        const m = await page.evaluate(() => {
            const list = document.querySelector(
                '.dv-tabs-container'
            ) as HTMLElement;
            const header = document.querySelector(
                '.dv-tabs-and-actions-container'
            ) as HTMLElement;
            const rowH = parseFloat(
                getComputedStyle(header).getPropertyValue(
                    '--dv-tabs-and-actions-container-height'
                )
            );
            return {
                rowH,
                headerH: header.offsetHeight,
                clientH: list.clientHeight,
                scrollH: list.scrollHeight,
            };
        });

        // The header grew past a single row but is capped at two.
        expect(m.headerH).toBeGreaterThan(m.rowH);
        expect(m.headerH).toBeLessThanOrEqual(m.rowH * 2 + 1);
        // The strip clips the surplus rows (natural content is taller than the
        // capped client box).
        expect(m.scrollH).toBeGreaterThan(m.clientH);
        // The surplus tabs appear in the overflow dropdown chevron.
        await expect(
            page.locator('.dv-tabs-overflow-dropdown-root').first()
        ).toBeVisible();
    });

    test('raising maxRows re-admits the surplus rows and grows the header', async ({
        page,
    }) => {
        await page.goto('/e2e/fixtures/index.html?overflow=wrap&maxRows=2');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupWrapTabs(20));

        const cappedHeader = (await page
            .locator('.dv-tabs-and-actions-container')
            .first()
            .boundingBox())!;

        // Raise the cap high enough to fit every row.
        await page.evaluate(() =>
            (window as any).__dv.setOverflow({ mode: 'wrap', maxRows: 20 })
        );

        // The header grew (more rows now fit) and the dropdown emptied.
        await expect
            .poll(async () => {
                const box = await page
                    .locator('.dv-tabs-and-actions-container')
                    .first()
                    .boundingBox();
                return box!.height;
            })
            .toBeGreaterThan(cappedHeader.height);

        await expect(
            page.locator('.dv-tabs-overflow-dropdown-root')
        ).toHaveCount(0);
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
    // Covers both animation modes: default (per-tab drop targets — the common
    // case) and smooth (the tabs-list / pointer-end commit path). `tabAnimation`
    // defaults to 'default', so both must work.
    const reorderAcrossRows = async (page, query: string) => {
        await page.goto(`/e2e/fixtures/index.html?${query}`);
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
        const s = (await page
            .locator('.dv-tab', { hasText: 'wrap-tab-long-title-19' })
            .boundingBox())!;
        const t = (await page
            .locator('.dv-tab', { hasText: 'wrap-tab-long-title-0' })
            .boundingBox())!;

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
    };

    test('a tab drags across rows to reorder (default mode)', async ({
        page,
    }) => {
        await reorderAcrossRows(page, 'overflow=wrap');
    });

    test('a tab drags across rows to reorder (smooth mode)', async ({
        page,
    }) => {
        await reorderAcrossRows(page, 'overflow=wrap&smooth=1');
    });
});
