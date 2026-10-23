import { test, expect, Page } from '@playwright/test';

// Needs real layout. `setupT`: tl | (tr over br). `setupTwoByTwo`: two columns
// of two rows, so the column sash and both row sashes meet in a '+'.
test.describe('orthogonal sash multidrag', () => {
    const setup = async (
        page: Page,
        layout: 'setupT' | 'setupTwoByTwo',
        query = ''
    ) => {
        await page.goto(`/e2e/fixtures/index.html${query}`);
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate((layout) => (window as any).__dv[layout](), layout);
    };

    const box = async (page: Page, title: string) =>
        (await page
            .locator('.dv-groupview', {
                has: page.locator('.dv-tab', { hasText: title }),
            })
            .boundingBox())!;

    const junction = async (page: Page) => {
        const sashes = await page
            .locator('.dv-sash')
            .evaluateAll((elements) =>
                elements.map((e) => e.getBoundingClientRect().toJSON())
            );
        const column = sashes.find((r) => r.height > r.width)!;
        const tr = await box(page, 'tr');
        const br = await box(page, 'br');
        return {
            x: column.x + column.width / 2,
            y: (tr.y + tr.height + br.y) / 2,
        };
    };

    const multidragSashCount = (page: Page) =>
        page.locator('.dv-sash.dv-sash-multidrag').count();

    const drag = async (
        page: Page,
        from: { x: number; y: number },
        dx: number,
        dy: number
    ) => {
        await page.mouse.down();
        await page.mouse.move(from.x + dx, from.y + dy, { steps: 10 });
        await page.mouse.up();
    };

    test('hovering a T junction marks both sashes', async ({ page }) => {
        await setup(page, 'setupT');
        const { x, y } = await junction(page);

        await page.mouse.move(x, y);
        await expect.poll(() => multidragSashCount(page)).toBe(2);
        await expect(
            page.locator('.dv-sash.dv-sash-multidrag').first()
        ).toHaveCSS('cursor', 'move');

        await page.mouse.move(x + 200, y);
        await expect.poll(() => multidragSashCount(page)).toBe(0);
        await page.mouse.move(x, y - 200);
        await expect.poll(() => multidragSashCount(page)).toBe(0);
    });

    test('dragging a T junction resizes along both axes', async ({ page }) => {
        await setup(page, 'setupT');
        const { x, y } = await junction(page);
        const start = { x: x + 3, y };

        await page.mouse.move(start.x, start.y);
        await expect.poll(() => multidragSashCount(page)).toBe(2);
        const before = {
            tl: await box(page, 'tl'),
            tr: await box(page, 'tr'),
        };

        await drag(page, start, -120, 80);

        const tl = await box(page, 'tl');
        const tr = await box(page, 'tr');
        expect(Math.abs(tl.width - (before.tl.width - 120))).toBeLessThan(4);
        expect(Math.abs(tr.height - (before.tr.height + 80))).toBeLessThan(4);
    });

    test("hovering a '+' marks every sash meeting there", async ({ page }) => {
        await setup(page, 'setupTwoByTwo');
        const { x, y } = await junction(page);

        await page.mouse.move(x, y);
        await expect.poll(() => multidragSashCount(page)).toBe(3);
    });

    test("dragging a '+' moves every sash meeting there", async ({ page }) => {
        await setup(page, 'setupTwoByTwo');
        const { x, y } = await junction(page);
        const start = { x: x + 3, y };

        await page.mouse.move(start.x, start.y);
        await expect.poll(() => multidragSashCount(page)).toBe(3);
        const before = {
            tl: await box(page, 'tl'),
            tr: await box(page, 'tr'),
        };

        await drag(page, start, -120, 80);

        const tl = await box(page, 'tl');
        const tr = await box(page, 'tr');
        expect(Math.abs(tl.width - (before.tl.width - 120))).toBeLessThan(4);
        // both rows move, so the '+' stays aligned
        expect(Math.abs(tr.height - (before.tr.height + 80))).toBeLessThan(4);
        expect(Math.abs(tl.height - (before.tl.height + 80))).toBeLessThan(4);
    });

    test('with a theme gap the junction is grabbable from the column sash', async ({
        page,
    }) => {
        await setup(page, 'setupTwoByTwo', '?theme=lightSpaced');
        const { x, y } = await junction(page);

        await page.mouse.move(x, y);
        await expect.poll(() => multidragSashCount(page)).toBe(3);
        const before = {
            tl: await box(page, 'tl'),
            tr: await box(page, 'tr'),
        };

        await drag(page, { x, y }, 60, 40);

        const tl = await box(page, 'tl');
        const tr = await box(page, 'tr');
        expect(Math.abs(tl.width - (before.tl.width + 60))).toBeLessThan(4);
        expect(Math.abs(tl.height - (before.tl.height + 40))).toBeLessThan(4);
        expect(Math.abs(tr.height - (before.tr.height + 40))).toBeLessThan(4);
    });

    test('disableOrthogonalSashMultidrag turns it off', async ({ page }) => {
        await setup(page, 'setupTwoByTwo');
        await page.evaluate(() =>
            (window as any).__dv.setDisableOrthogonalSashMultidrag(true)
        );
        const before = await box(page, 'tr');
        const { x, y } = await junction(page);
        const start = { x: x + 3, y };

        await page.mouse.move(start.x, start.y);
        expect(await multidragSashCount(page)).toBe(0);

        await drag(page, start, -120, 80);

        const tr = await box(page, 'tr');
        expect(Math.abs(tr.height - (before.height + 80))).toBeLessThan(4);
        expect(Math.abs(tr.width - before.width)).toBeLessThan(2);
    });

    test('works when mounted in a shadow root', async ({ page }) => {
        await setup(page, 'setupTwoByTwo', '?shadow=1');
        const { x, y } = await junction(page);

        await page.mouse.move(x, y);
        await expect.poll(() => multidragSashCount(page)).toBe(3);
    });
});
