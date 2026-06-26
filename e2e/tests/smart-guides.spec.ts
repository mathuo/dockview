import { test, expect } from '@playwright/test';

/**
 * Smart Guides — alignment guides + magnetic snapping for floating groups.
 * Real-browser only: the snap reads the live container/overlay geometry the
 * float drag loop works in, which jsdom (no layout) can't produce.
 *
 * Phase 1: dragging one float so an edge lines up with another float's edge
 * (within `snapDistance`) snaps it exactly and paints one alignment guide; the
 * guide is torn down on drop.
 */
test.describe('smart guides (floating snap)', () => {
    const setup = async (page) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupSmartGuides());
    };

    const overlayWith = (page, text: string) =>
        page.locator('.dv-resize-container', {
            has: page.locator('.dv-test-panel', { hasText: text }),
        });

    test('snaps a dragged float edge to another float and draws a guide', async ({
        page,
    }) => {
        await setup(page);

        const mover = overlayWith(page, 'mover');
        const target = overlayWith(page, 'target');
        const handle = mover.locator('.dv-floating-titlebar');

        const targetBox = (await target.boundingBox())!;
        const moverBox = (await mover.boundingBox())!;
        const tb = (await handle.boundingBox())!;

        const startX = tb.x + tb.width / 2;
        const startY = tb.y + tb.height / 2;
        // Pointer offset within the float — the float's left edge tracks
        // (pointerX - grab) once the drag is underway.
        const grab = startX - moverBox.x;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        // A tiny first nudge locks a clean grab offset before the long drag
        // (the overlay captures the offset on the first pointer-move frame).
        await page.mouse.move(startX + 1, startY);
        // Land the float's left edge ~4px right of the target's left edge —
        // inside the 12px snapDistance, so it snaps exactly onto it.
        const finalX = targetBox.x + grab + 5;
        await page.mouse.move(finalX, startY, { steps: 20 });

        // a single alignment guide is shown, at the target's left edge
        const guide = page.locator('.dv-smart-guide');
        await expect(guide).toBeVisible();
        const gb = (await guide.boundingBox())!;
        expect(Math.abs(gb.x - targetBox.x)).toBeLessThan(2);

        // the float snapped exactly onto the target's left edge
        const snapped = (await mover.boundingBox())!;
        expect(Math.abs(snapped.x - targetBox.x)).toBeLessThan(2);

        await page.mouse.up();

        // guides are an interaction overlay — gone once the drag ends
        await expect(page.locator('.dv-smart-guides')).toHaveCount(0);
        // ...and the snapped position persists
        const after = (await mover.boundingBox())!;
        expect(Math.abs(after.x - targetBox.x)).toBeLessThan(2);
    });

    test('no guide while dragging away from every edge', async ({ page }) => {
        await setup(page);

        const mover = overlayWith(page, 'mover');
        const handle = mover.locator('.dv-floating-titlebar');
        const tb = (await handle.boundingBox())!;
        const startX = tb.x + tb.width / 2;
        const startY = tb.y + tb.height / 2;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        // drag further right / into open space, away from the target float
        await page.mouse.move(startX + 150, startY + 20, { steps: 8 });

        // the guide line is never shown (the layer may exist, the line stays hidden)
        await expect(page.locator('.dv-smart-guide')).toBeHidden();

        await page.mouse.up();
        await expect(page.locator('.dv-smart-guides')).toHaveCount(0);
    });
});
