import { test, expect } from '@playwright/test';

/**
 * #1495: a dockview nested inside another dockview's panel, with an edge group.
 * When the host panel becomes hidden the nested dockview's shell collapses to
 * 0x0 and its ResizeObserver fires — the shell's guard must skip that so the
 * edge group keeps its size instead of being clamped to the minimum.
 *
 * Real-browser only: the bug rides on a real ResizeObserver firing a 0x0
 * measurement when an ancestor is hidden (offsetParent -> null) — neither of
 * which jsdom models. The guard is additionally unit-/integration-tested in
 * dockviewShell.spec.ts and edgeGroupHiddenHost.spec.ts.
 *
 * The host is hidden via `display: none` (the canonical "ancestor hidden" form
 * of `onlyWhenVisible` deactivation) rather than a tab switch, because a real
 * browser does not fire a ResizeObserver for an element that is fully removed
 * from the DOM — so only the display path reproduces the reported clamp.
 */
test.describe('nested edge group (#1495)', () => {
    const edgeSize = (page) =>
        page.evaluate(() => (window as any).__dv.nestedEdgeSize());

    test('keeps its size when the host is hidden and reshown', async ({
        page,
    }) => {
        await page.goto('/e2e/fixtures/index.html');
        await page.waitForFunction(() => (window as any).__ready === true);
        await page.evaluate(() => (window as any).__dv.setupNestedEdgeGroup());

        // The nested edge group is added on the inner dockview's first real
        // layout, sized well above its ~85 minimum.
        await expect.poll(() => edgeSize(page)).toBe(300);

        // Hide the host: the nested shell's ResizeObserver fires a 0x0 (rAF
        // deferred), which without the guard clamps the edge group.
        await page.evaluate(() => (window as any).__dv.setNestedHostVisible(false));
        await page.waitForTimeout(250);
        expect(await edgeSize(page)).toBe(300);

        // Reveal it again — still the original size, not the clamped minimum.
        await page.evaluate(() => (window as any).__dv.setNestedHostVisible(true));
        await page.waitForTimeout(250);
        expect(await edgeSize(page)).toBe(300);
    });
});
