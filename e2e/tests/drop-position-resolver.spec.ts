import { test, expect } from '@playwright/test';

/**
 * Custom `dropPositionResolver` — overrides how a pointer location maps to a
 * drop position on the group / layout-edge targets, occupying the same seam the
 * Drop Guide compass otherwise fills. Real-browser only: the resolver runs
 * inside the live pointer-drag loop. Here `?resolver=right` forces every drop to
 * 'right', so dropping a tab on the *centre* of another group (a merge by
 * default) instead splits it to the right — proving the pointer position was
 * overridden.
 */
test.describe('drop position resolver (override)', () => {
    test('a custom resolver forces the drop position regardless of pointer', async ({
        page,
    }) => {
        await page.goto('/e2e/fixtures/index.html?resolver=right');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupDropGuide());
        expect(
            await page.evaluate(() => (window as any).__dv.groupCount())
        ).toBe(2);

        const tab = (await page
            .locator('.dv-tab', { hasText: 'left' })
            .boundingBox())!;
        const rightContent = page.locator('.dv-content-container', {
            has: page.locator('.dv-test-panel', { hasText: 'right' }),
        });
        const content = (await rightContent.boundingBox())!;
        const cx = content.x + content.width / 2;
        const cy = content.y + content.height / 2;

        // Drag the 'left' tab onto the dead-centre of the right group — a centre
        // drop merges by default, but the resolver forces 'right'.
        await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2);
        await page.mouse.down();
        await page.mouse.move(
            tab.x + tab.width / 2 + 6,
            tab.y + tab.height / 2
        );
        await page.mouse.move(cx, cy, { steps: 20 });
        await page.mouse.up();

        // Still two groups — a split, not the centre-merge the pointer aimed at…
        await expect
            .poll(() =>
                page.evaluate(() => (window as any).__dv.groupCount())
            )
            .toBe(2);
        // …and 'left' docked to the right of 'right' (it started on its left).
        const leftAfter = (await page
            .locator('.dv-tab', { hasText: 'left' })
            .boundingBox())!;
        const rightAfter = (await page
            .locator('.dv-tab', { hasText: 'right' })
            .boundingBox())!;
        expect(leftAfter.x).toBeGreaterThan(rightAfter.x);
    });
});
