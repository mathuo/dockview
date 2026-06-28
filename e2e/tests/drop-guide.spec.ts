import { test, expect } from '@playwright/test';

/**
 * Drop Guide ("compass") — the aim-at-a-cell drop overlay. Real-browser only:
 * it reads the live drop-target geometry the drag loop works in, which jsdom
 * (no layout) can't produce. The harness uses the pointer DnD backend so a
 * panel drag is drivable.
 */
test.describe('drop guide (compass)', () => {
    const setup = async (page) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupDropGuide());
    };

    const rightContent = (page) =>
        page.locator('.dv-content-container', {
            has: page.locator('.dv-test-panel', { hasText: 'right' }),
        });

    test('dragging a tab over a group shows the compass and a cell-drop docks', async ({
        page,
    }) => {
        await setup(page);
        expect(
            await page.evaluate(() => (window as any).__dv.groupCount())
        ).toBe(2);

        const leftTab = page.locator('.dv-tab', { hasText: 'left' });
        const tab = (await leftTab.boundingBox())!;
        const content = (await rightContent(page).boundingBox())!;
        const cx = content.x + content.width / 2;
        const cy = content.y + content.height / 2;

        await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2);
        await page.mouse.down();
        // nudge to start the drag, then move onto the right group's centre
        await page.mouse.move(
            tab.x + tab.width / 2 + 6,
            tab.y + tab.height / 2
        );
        await page.mouse.move(cx, cy, { steps: 20 });

        // the compass cross is painted over the hovered group (5 inner + 4 outer)
        await expect(page.locator('.dv-drop-guide')).toBeVisible();
        expect(await page.locator('.dv-drop-guide-cell').count()).toBe(9);
        expect(await page.locator('.dv-drop-guide-cell-edge').count()).toBe(4);

        // drop on the centre cell → merge into the right group
        await page.mouse.up();

        // the two groups collapsed into one (left panel tabbed into right)
        await expect
            .poll(() => page.evaluate(() => (window as any).__dv.groupCount()))
            .toBe(1);
        // ...and the compass is gone
        await expect(page.locator('.dv-drop-guide')).toHaveCount(0);
    });

    test('dropping on an outer cell docks against the whole layout (not a merge)', async ({
        page,
    }) => {
        await setup(page);

        const leftTab = page.locator('.dv-tab', { hasText: 'left' });
        const tab = (await leftTab.boundingBox())!;
        const content = (await rightContent(page).boundingBox())!;
        const cx = content.x + content.width / 2;
        const cy = content.y + content.height / 2;
        // the outer ring sits ~2 cells (CELL 38 + GAP 4 = 42 → 84px) out
        const outerRightX = cx + 84;

        await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2);
        await page.mouse.down();
        await page.mouse.move(
            tab.x + tab.width / 2 + 6,
            tab.y + tab.height / 2
        );
        await page.mouse.move(cx, cy, { steps: 15 });
        await expect(page.locator('.dv-drop-guide')).toBeVisible();
        // aim at the outer-right cell, then drop
        await page.mouse.move(outerRightX, cy, { steps: 6 });
        await page.mouse.up();

        // the left panel docked to the layout's right edge as its OWN group —
        // still two groups (a centre-cell drop would have merged to one).
        await expect
            .poll(() => page.evaluate(() => (window as any).__dv.groupCount()))
            .toBe(2);
        // ...and it actually moved to that edge: the 'left' tab, which started
        // left of 'right', is now to its right (a no-op dock would leave it left).
        const leftAfter = (await page
            .locator('.dv-tab', { hasText: 'left' })
            .boundingBox())!;
        const rightAfter = (await page
            .locator('.dv-tab', { hasText: 'right' })
            .boundingBox())!;
        expect(leftAfter.x).toBeGreaterThan(rightAfter.x);
        await expect(page.locator('.dv-drop-guide')).toHaveCount(0);
    });
});
