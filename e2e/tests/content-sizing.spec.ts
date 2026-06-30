import { test, expect } from '@playwright/test';

/**
 * Header-aware content sizing — the group lays panels out with the content-area
 * dimensions (group box minus the header along its axis), not the
 * header-inclusive group box. Real-browser only: it depends on the header
 * actually having a measured size, which jsdom (no layout) can't produce.
 */
test.describe('content sizing (header-aware)', () => {
    const setup = async (page) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.addPanel('main'));
    };

    test('panel is laid out with the content box, not the header-inclusive group box', async ({
        page,
    }) => {
        await setup(page);

        const reported = await page.evaluate(() =>
            (window as any).__dv.panelDimensions('main')
        );
        expect(reported).toBeTruthy();

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

        // the header has real height (a single tab row)
        expect(headerBox.height).toBeGreaterThan(0);

        // the reported height matches the content area, i.e. the group height
        // minus the header — NOT the full group box (the latent over-report).
        expect(reported.height).toBeCloseTo(contentBox.height, 0);
        expect(reported.height).toBeCloseTo(
            groupBox.height - headerBox.height,
            0
        );
        expect(reported.height).toBeLessThan(groupBox.height);

        // width is unaffected by a horizontal (top) header
        expect(reported.width).toBeCloseTo(contentBox.width, 0);
        expect(reported.width).toBeCloseTo(groupBox.width, 0);
    });
});
