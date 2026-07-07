import { test, expect, Page } from '@playwright/test';

/**
 * Floating group lifecycle — real-browser behaviour: a floating group renders
 * as a positioned overlay (`.dv-resize-container`) stacked above the docked
 * grid, and its geometry + content survive a serialization round-trip. The
 * overlay positioning depends on a real measured layout, which jsdom can't
 * produce.
 */
test.describe('floating groups', () => {
    const setup = async (page: Page) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupFloating());
    };

    test('a floating group renders as a positioned overlay with its content', async ({
        page,
    }) => {
        await setup(page);

        // Exactly one floating group, rendered as a single resize-container.
        expect(
            await page.evaluate(() => (window as any).__dv.floatingCount())
        ).toBe(1);
        const overlay = page.locator('.dv-resize-container');
        await expect(overlay).toHaveCount(1);

        // Its panel content is mounted and the docked `main` panel still shows.
        await expect(overlay.locator('.dv-test-panel')).toContainText(
            'floater'
        );
        await expect(
            page.locator('.dv-test-panel', { hasText: 'main' })
        ).toBeVisible();

        // The overlay is offset from the container origin (a genuine float at
        // ~150,100), not pinned to the top-left like a docked group.
        const box = (await overlay.boundingBox())!;
        expect(box.x).toBeGreaterThan(20);
        expect(box.y).toBeGreaterThan(20);
    });

    test('a floating group survives a serialization round-trip', async ({
        page,
    }) => {
        await setup(page);
        const before = (await page
            .locator('.dv-resize-container')
            .boundingBox())!;

        // Snapshot carries the floating group…
        const json = await page.evaluate(() =>
            JSON.stringify((window as any).__dv.snapshot())
        );
        expect(json).toContain('floatingGroups');

        // …and a fresh component restoring it rebuilds the float with its
        // content and geometry (unlike a popout, a float restores its content).
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(
            (state) => (window as any).__dv.restore(JSON.parse(state)),
            json
        );

        expect(
            await page.evaluate(() => (window as any).__dv.floatingCount())
        ).toBe(1);
        const overlay = page.locator('.dv-resize-container');
        await expect(overlay).toHaveCount(1);
        await expect(overlay.locator('.dv-test-panel')).toContainText(
            'floater'
        );

        // Geometry is preserved across the round-trip.
        const after = (await overlay.boundingBox())!;
        expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(2);
        expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(2);
        expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(2);
        expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(2);
    });
});
