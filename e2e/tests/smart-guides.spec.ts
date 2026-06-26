import { test, expect } from '@playwright/test';

/**
 * Smart Guides — alignment guides + magnetic snapping for floating groups.
 * Real-browser only: the snap reads the live container/overlay geometry the
 * float drag loop works in, which jsdom (no layout) can't produce.
 *
 * Dragging one float so an edge/center lines up with another float or the
 * container (within `snapDistance`) snaps it and paints alignment guides; X and
 * Y resolve independently; guides are torn down on drop.
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

    // Rects of the guide lines currently being painted (pooled hidden ones out).
    const visibleGuides = (
        page
    ): Promise<{ x: number; y: number; w: number; h: number }[]> =>
        page.evaluate(() =>
            Array.from(
                document.querySelectorAll<HTMLElement>('.dv-smart-guide')
            )
                .filter((l) => l.style.display === 'block')
                .map((l) => {
                    const r = l.getBoundingClientRect();
                    return { x: r.x, y: r.y, w: r.width, h: r.height };
                })
        );

    const near = (a: number, b: number, tol = 2): boolean =>
        Math.abs(a - b) < tol;

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
        const grab = startX - moverBox.x;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        // Tiny nudge locks a clean grab offset before the long drag.
        await page.mouse.move(startX + 1, startY);
        // Land the float's left edge ~4px right of the target's left edge —
        // inside the 12px snapDistance, so it snaps exactly onto it.
        await page.mouse.move(targetBox.x + grab + 5, startY, { steps: 20 });

        // a vertical guide is drawn at the target's left edge
        const guides = await visibleGuides(page);
        expect(guides.some((g) => g.w <= 2 && near(g.x, targetBox.x))).toBe(
            true
        );

        // the float snapped exactly onto the target's left edge
        const snapped = (await mover.boundingBox())!;
        expect(near(snapped.x, targetBox.x)).toBe(true);

        await page.mouse.up();

        // guides are an interaction overlay — gone once the drag ends
        await expect(page.locator('.dv-smart-guides')).toHaveCount(0);
        const after = (await mover.boundingBox())!;
        expect(near(after.x, targetBox.x)).toBe(true);
    });

    test('X and Y snap independently — aligning to a corner draws both guides', async ({
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
        const grabX = startX - moverBox.x;
        const grabY = startY - moverBox.y;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 1, startY + 1);
        // Drag toward the target's top-left corner: left edge → target left,
        // top edge → target top (both within the snap distance).
        await page.mouse.move(
            targetBox.x + grabX + 5,
            targetBox.y + grabY + 5,
            { steps: 25 }
        );

        const guides = await visibleGuides(page);
        // a vertical guide at the target's left edge...
        expect(guides.some((g) => g.w <= 2 && near(g.x, targetBox.x))).toBe(
            true
        );
        // ...and a horizontal guide at the target's top edge
        expect(guides.some((g) => g.h <= 2 && near(g.y, targetBox.y))).toBe(
            true
        );

        const snapped = (await mover.boundingBox())!;
        expect(near(snapped.x, targetBox.x)).toBe(true);
        expect(near(snapped.y, targetBox.y)).toBe(true);

        await page.mouse.up();
        await expect(page.locator('.dv-smart-guides')).toHaveCount(0);
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
        // a small drag into open space, away from the target float + edges
        await page.mouse.move(startX + 40, startY + 30, { steps: 8 });

        expect(await visibleGuides(page)).toHaveLength(0);

        await page.mouse.up();
        await expect(page.locator('.dv-smart-guides')).toHaveCount(0);
    });
});
