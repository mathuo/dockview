import { test, expect, Page } from '@playwright/test';

/**
 * Pinned tabs — real-browser behaviour the jsdom unit tests cannot reach:
 * geometry (the second row growing the header and reflowing content), compact
 * rendering (a hidden title actually collapsing the tab), and overflow (a
 * pinned tab excluded from the dropdown while the strip clips).
 */
test.describe('pinned tabs', () => {
    const setup = async (
        page: Page,
        opts: {
            mode?: 'separate-row';
            compact?: boolean;
            dnd?: 'html5';
        } = {}
    ) => {
        const query = new URLSearchParams();
        if (opts.mode) query.set('pinned', opts.mode);
        if (opts.compact) query.set('compact', '1');
        if (opts.dnd) query.set('dnd', opts.dnd);
        const qs = query.toString();
        await page.goto('/e2e/fixtures/index.html' + (qs ? `?${qs}` : ''));
        await page.waitForFunction(() => (window as any).__ready === true);
    };

    const box = (page: Page, selector: string) =>
        page.locator(selector).first().boundingBox();

    test('separate-row: the pinned row grows the header and reflows content', async ({
        page,
    }) => {
        await setup(page, { mode: 'separate-row' });
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

    test('separate-row: dragging a pinned tab reorders the row', async ({
        page,
    }) => {
        await setup(page, { mode: 'separate-row' });
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['a', 'b', 'c'], ['a', 'b', 'c'])
        );

        const rowTabs = page.locator('.dv-pinned-row .dv-pinned-tab');
        await expect(rowTabs).toHaveText(['a', 'b', 'c']);

        // Drive the row's HTML5 drag: drag 'a' past 'c' using real geometry.
        // (The row uses `draggable` + drag events, not the pointer backend, so
        // synthetic DragEvents at real coordinates exercise the real path.)
        await page.evaluate(() => {
            const tabs = Array.from(
                document.querySelectorAll('.dv-pinned-row .dv-pinned-tab')
            ) as HTMLElement[];
            const source = tabs[0];
            const last = tabs[tabs.length - 1];
            const rect = last.getBoundingClientRect();
            const dropX = rect.right + 5; // past the last tab's midpoint
            const dropY = rect.top + rect.height / 2;
            source.dispatchEvent(
                new DragEvent('dragstart', { bubbles: true, cancelable: true })
            );
            last.dispatchEvent(
                new DragEvent('dragover', {
                    bubbles: true,
                    cancelable: true,
                    clientX: dropX,
                    clientY: dropY,
                })
            );
            last.dispatchEvent(
                new DragEvent('drop', {
                    bubbles: true,
                    cancelable: true,
                    clientX: dropX,
                    clientY: dropY,
                })
            );
            source.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
        });

        // The pinned row (and the pinned block of the strip) reorder to [b,c,a].
        await expect(rowTabs).toHaveText(['b', 'c', 'a']);
        await expect
            .poll(() => page.evaluate(() => (window as any).__dv.tabTitles()))
            .toEqual(['b', 'c', 'a']);
    });

    test('separate-row: dragging a main-strip tab into the row pins it', async ({
        page,
    }) => {
        // `?dnd=html5` so the main strip's native drag source populates the
        // shared payload the row reads via `getPanelData`.
        await setup(page, { mode: 'separate-row', dnd: 'html5' });
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['a', 'b', 'c'], ['a'])
        );

        await expect(page.locator('.dv-pinned-row .dv-pinned-tab')).toHaveText([
            'a',
        ]);

        // Drag the (unpinned) main-strip tab 'c' into the pinned row.
        await page.evaluate(() => {
            const mainTab = Array.from(
                document.querySelectorAll('.dv-tabs-container .dv-tab')
            ).find((el) => el.textContent?.includes('c')) as HTMLElement;
            const row = document.querySelector('.dv-pinned-row') as HTMLElement;
            const rect = row.getBoundingClientRect();
            const dropX = rect.right - 2; // land at the end of the pinned block
            const dropY = rect.top + rect.height / 2;
            mainTab.dispatchEvent(
                new DragEvent('dragstart', { bubbles: true, cancelable: true })
            );
            row.dispatchEvent(
                new DragEvent('dragover', {
                    bubbles: true,
                    cancelable: true,
                    clientX: dropX,
                    clientY: dropY,
                })
            );
            row.dispatchEvent(
                new DragEvent('drop', {
                    bubbles: true,
                    cancelable: true,
                    clientX: dropX,
                    clientY: dropY,
                })
            );
            mainTab.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
        });

        // 'c' is now pinned and shows in the row after 'a'.
        await expect(page.locator('.dv-pinned-row .dv-pinned-tab')).toHaveText([
            'a',
            'c',
        ]);
        expect(
            await page.evaluate(() => (window as any).__dv.isPinned('c'))
        ).toBe(true);
    });

    test('separate-row: dragging a row tab out into the main strip unpins it', async ({
        page,
    }) => {
        await setup(page, { mode: 'separate-row', dnd: 'html5' });
        // Pin a & b (row [a, b]); c stays unpinned and visible in the strip.
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['a', 'b', 'c'], ['a', 'b'])
        );
        await expect(page.locator('.dv-pinned-row .dv-pinned-tab')).toHaveText([
            'a',
            'b',
        ]);

        // Drag the row tab 'a' down onto the unpinned main-strip tab 'c'. The
        // row sets the same PanelTransfer the main tab would, so the strip's
        // native drop target accepts it; a drop in the unpinned region unpins.
        await page.evaluate(() => {
            const rowTab = Array.from(
                document.querySelectorAll('.dv-pinned-row .dv-pinned-tab')
            ).find((el) => el.textContent?.includes('a')) as HTMLElement;
            const mainC = Array.from(
                document.querySelectorAll('.dv-tabs-container .dv-tab')
            ).find(
                (el) =>
                    el.textContent?.includes('c') &&
                    (el as HTMLElement).offsetParent !== null
            ) as HTMLElement;
            const rect = mainC.getBoundingClientRect();
            // Right zone of 'c' → land past the pin boundary (unpinned region).
            const x = rect.right - 3;
            const y = rect.top + rect.height / 2;
            const fire = (el: Element, type: string) =>
                el.dispatchEvent(
                    new DragEvent(type, {
                        bubbles: true,
                        cancelable: true,
                        clientX: x,
                        clientY: y,
                    })
                );
            fire(rowTab, 'dragstart');
            fire(mainC, 'dragenter');
            fire(mainC, 'dragover');
            fire(mainC, 'drop');
            rowTab.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
        });

        // 'a' is unpinned and gone from the row (only 'b' remains pinned).
        await expect
            .poll(() => page.evaluate(() => (window as any).__dv.isPinned('a')))
            .toBe(false);
        await expect(page.locator('.dv-pinned-row .dv-pinned-tab')).toHaveText([
            'b',
        ]);
    });

    test('default: a pinned tab keeps its title and shows a pin glyph', async ({
        page,
    }) => {
        await setup(page);
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['alpha', 'bravo'], ['alpha'])
        );

        const pinned = page.locator('.dv-tab--pinned');
        // The title is still shown (not compact by default)…
        await expect(pinned.locator('.dv-default-tab-content')).toBeVisible();
        await expect(pinned).toContainText('alpha');
        // …a pin glyph is rendered…
        await expect(pinned.locator('.dv-tab-pin .dv-svg')).toBeVisible();
        // …and the close button is hidden (pinning protects from a stray close).
        await expect(pinned.locator('.dv-default-tab-action')).toBeHidden();
    });

    test('compact: a pinned tab hides its title but keeps the pin glyph', async ({
        page,
    }) => {
        await setup(page, { compact: true });
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['alpha', 'bravo'], ['alpha'])
        );

        // The compact pinned tab's title content is hidden…
        await expect(
            page.locator('.dv-tab--pinned-compact .dv-default-tab-content')
        ).toBeHidden();
        // …but the pin glyph is still visible (its only identity)…
        await expect(
            page.locator('.dv-tab--pinned-compact .dv-tab-pin .dv-svg')
        ).toBeVisible();

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

    test('a pinned tab sorts ahead of unpinned tabs', async ({ page }) => {
        await setup(page);
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['a', 'b', 'c'], [])
        );
        // Added in order, nothing pinned yet.
        expect(
            await page.evaluate(() => (window as any).__dv.tabTitles())
        ).toEqual(['a', 'b', 'c']);

        // Pinning the last tab jumps it to the front of the strip; the other
        // two keep their relative order behind it.
        await page.evaluate(() => (window as any).__dv.setPinned('c', true));
        await expect
            .poll(() => page.evaluate(() => (window as any).__dv.tabTitles()))
            .toEqual(['c', 'a', 'b']);

        // Unpinning clears the pin marker; the tab keeps its current slot
        // (unpinning removes pinned status, it does not re-sort the strip).
        await page.evaluate(() => (window as any).__dv.setPinned('c', false));
        await expect(page.locator('.dv-tab--pinned')).toHaveCount(0);
        await expect
            .poll(() => page.evaluate(() => (window as any).__dv.tabTitles()))
            .toEqual(['c', 'a', 'b']);
    });

    test('pinned state round-trips through serialization', async ({ page }) => {
        await setup(page);
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(
                ['alpha', 'bravo', 'charlie'],
                ['bravo']
            )
        );
        await expect(page.locator('.dv-tab--pinned')).toContainText('bravo');

        // The serialized layout carries the pinned flag…
        const json = await page.evaluate(() =>
            JSON.stringify((window as any).__dv.snapshot())
        );
        expect(json).toContain('"pinned":true');

        // …and re-loading that snapshot rebuilds the pinned tab as pinned.
        await page.evaluate(
            (state) => (window as any).__dv.restore(JSON.parse(state)),
            json
        );
        await expect(page.locator('.dv-tab--pinned')).toHaveCount(1);
        await expect(page.locator('.dv-tab--pinned')).toContainText('bravo');
    });

    test('pinning and unpinning from the tab context menu', async ({
        page,
    }) => {
        // `?pinmenu=1` swaps the harness tab menu to `['pin', 'separator',
        // 'close']` so the built-in pin item is drivable.
        await page.goto('/e2e/fixtures/index.html?pinmenu=1');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['alpha', 'bravo'], [])
        );
        await expect(page.locator('.dv-tab--pinned')).toHaveCount(0);

        // Right-click "bravo" → the menu offers "Pin tab"; clicking it pins.
        await page
            .locator('.dv-tab', { hasText: 'bravo' })
            .click({ button: 'right' });
        await expect(page.locator('.dv-context-menu')).toBeVisible();
        await page
            .locator('.dv-context-menu-item', { hasText: 'Pin tab' })
            .click();
        await expect(page.locator('.dv-tab--pinned')).toContainText('bravo');

        // Right-clicking the now-pinned tab offers "Unpin tab"; clicking unpins.
        await page.locator('.dv-tab--pinned').click({ button: 'right' });
        await page
            .locator('.dv-context-menu-item', { hasText: 'Unpin tab' })
            .click();
        await expect(page.locator('.dv-tab--pinned')).toHaveCount(0);
    });

    test('auto-injects the Pin item into the tab menu without app wiring', async ({
        page,
    }) => {
        // `?pinautoinject=1` leaves the app's `getTabContextMenuItems` returning
        // only its close items — the module injects the Pin item itself.
        await page.goto('/e2e/fixtures/index.html?pinautoinject=1');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['alpha', 'bravo'], [])
        );
        await expect(page.locator('.dv-tab--pinned')).toHaveCount(0);

        await page
            .locator('.dv-tab', { hasText: 'bravo' })
            .click({ button: 'right' });
        await expect(page.locator('.dv-context-menu')).toBeVisible();

        // Pin is prepended ahead of the app's own items.
        await expect(page.locator('.dv-context-menu-item').first()).toHaveText(
            'Pin tab'
        );

        await page
            .locator('.dv-context-menu-item', { hasText: 'Pin tab' })
            .click();
        await expect(page.locator('.dv-tab--pinned')).toContainText('bravo');
    });

    test('toggles the active tab pinned with the keyboard (Ctrl+Shift+Enter)', async ({
        page,
    }) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() =>
            (window as any).__dv.setupPinned(['alpha', 'bravo'], [])
        );
        // bravo was added last → the active panel.
        await expect(page.locator('.dv-tab--pinned')).toHaveCount(0);

        // Put focus inside the dock so the binding fires (it acts on the active
        // panel, whichever tab holds focus).
        await page.evaluate(() =>
            document.querySelector<HTMLElement>('.dv-tab')?.focus()
        );
        await page.keyboard.press('Control+Shift+Enter');
        await expect(page.locator('.dv-tab--pinned')).toContainText('bravo');

        // Pressing again unpins.
        await page.evaluate(() =>
            document.querySelector<HTMLElement>('.dv-tab')?.focus()
        );
        await page.keyboard.press('Control+Shift+Enter');
        await expect(page.locator('.dv-tab--pinned')).toHaveCount(0);
    });
});
