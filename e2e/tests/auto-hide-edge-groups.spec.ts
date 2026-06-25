import { test, expect } from '@playwright/test';

/**
 * Auto-hide edge groups — the slide-out peek. Real-browser only: the
 * load-bearing rule is that peeking floats the panel over content WITHOUT
 * reflowing the grid (jsdom has no layout), and that BOTH render modes
 * (`onlyWhenVisible` and `always`) slide out.
 *
 * Interaction model (VS-style): hover / keyboard-focus the collapsed strip's
 * native tab → peek; click the tab → natively expands (pins) the group.
 */
test.describe('auto-hide edge groups (peek)', () => {
    const setup = async (page, renderer) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(
            (r) => (window as any).__dv.setupAutoHideEdge(r),
            renderer
        );
    };
    const edgeTab = (page) =>
        page.locator('.dv-groupview-edge .dv-tab').first();
    const mainBox = (page) =>
        page.locator('.dv-test-panel', { hasText: 'main' }).boundingBox();

    test('hovering a collapsed edge tab peeks over the content without reflow', async ({
        page,
    }) => {
        await setup(page);
        const before = (await mainBox(page))!;

        await edgeTab(page).hover();
        const overlay = page.locator('.dv-edge-peek');
        await expect(overlay).toBeVisible();
        expect((await overlay.boundingBox())!.width).toBeGreaterThan(100);
        await expect(overlay.locator('.dv-test-panel')).toBeVisible();

        const during = (await mainBox(page))!;
        expect(Math.abs(during.width - before.width)).toBeLessThan(2);

        await page.mouse.move(900, 500);
        await expect(overlay).toHaveCount(0);
    });

    test("an 'always'-rendered panel also slides out over the peek", async ({
        page,
    }) => {
        await setup(page, 'always');
        const before = (await mainBox(page))!;

        // open via the api (deterministic) — the always-rendered content lives in
        // the shared render overlay and must re-anchor over the peek region.
        await page.evaluate(() => (window as any).__dv.peekEdge('left', true));
        const overlay = page.locator('.dv-edge-peek');
        await expect(overlay).toBeVisible();
        const ob = (await overlay.boundingBox())!;

        const sidebar = page.locator('.dv-test-panel', { hasText: 'sidebar' });
        await expect(sidebar).toBeVisible();
        const sb = (await sidebar.boundingBox())!;
        expect(sb.x).toBeGreaterThanOrEqual(ob.x - 3);
        expect(sb.x).toBeLessThan(ob.x + ob.width);

        // its parent stays the render overlay (always panels are never reparented)
        const stillInRenderOverlay = await sidebar.evaluate(
            (el) => !!el.closest('.dv-render-overlay')
        );
        expect(stillInRenderOverlay).toBe(true);

        // no grid reflow while peeking
        expect(
            Math.abs((await mainBox(page))!.width - before.width)
        ).toBeLessThan(2);
    });

    test('clicking a collapsed edge tab pins (expands) the group', async ({
        page,
    }) => {
        await setup(page);
        const before = (await mainBox(page))!;

        await edgeTab(page).click();

        await expect(page.locator('.dv-edge-peek')).toHaveCount(0);
        expect((await mainBox(page))!.width).toBeLessThan(before.width);
    });

    test('the pin button re-docks the edge group (reflows once)', async ({
        page,
    }) => {
        await setup(page);
        const before = (await mainBox(page))!;

        await page.evaluate(() => (window as any).__dv.peekEdge('left', true));
        await expect(page.locator('.dv-edge-peek')).toBeVisible();
        await page.locator('.dv-edge-peek-pin').click();

        await expect(page.locator('.dv-edge-peek')).toHaveCount(0);
        expect((await mainBox(page))!.width).toBeLessThan(before.width);
    });
});
