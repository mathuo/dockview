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

        // the compass cross is painted over the hovered group
        await expect(page.locator('.dv-drop-guide')).toBeVisible();
        expect(await page.locator('.dv-drop-guide-cell').count()).toBe(5);

        // drop on the centre cell → merge into the right group
        await page.mouse.up();

        // the two groups collapsed into one (left panel tabbed into right)
        await expect
            .poll(() => page.evaluate(() => (window as any).__dv.groupCount()))
            .toBe(1);
        // ...and the compass is gone
        await expect(page.locator('.dv-drop-guide')).toHaveCount(0);
    });
});
