# Issue #1030 — When adding multiple panels side by side with a minimum width, panels are pushed off-screen.

- URL: https://github.com/mathuo/dockview/issues/1030
- Filed against version: unspecified (issue filed 2025-11-07)
- Investigated: 2026-05-16
- Investigated by: claude-opus-4.7

## Summary
The reporter sets `minimumWidth` (e.g. 296px) on every panel and keeps adding panels side by side. Once the sum of all panels' minimum widths exceeds the container width, newly-added/dragged panels end up rendered past the right edge of the container (off-screen) instead of being clamped, scrolled, or shown via an overflow dropdown. Expected: panels stay visible no matter how many are added.

## Reproduces on master?
Yes (code analysis). The size-distribution math in `splitview.ts` does not contain any guard that prevents the sum of minimums from exceeding the available width; when minimums collectively overflow, each `viewItem.size` ends up at its minimum and `layoutViews` lays them out left-to-right using cumulative offsets, so views past the container edge are positioned off-screen. The horizontal tab-bar already has an overflow dropdown, but there is no analogous mechanism at the grid/splitview level for whole groups/panels.

Notable: the docs explicitly call this out as a known caveat at `packages/docs/docs/core/panels/add.mdx:209-211` — "Since panels exist within groups there are occasions where these boundaries will be ignored to prevent overflow and clipping issues within the dock." However the current implementation does NOT actually ignore the boundaries — it honors them and lets the layout overflow, which is the opposite of what the docs imply. So either the docs are aspirational or the code regressed: either way, observable behavior matches the reporter.

A commenter (Zache) confirms the same behavior and notes a workaround: call `DockviewApi.layout(w, h)` with a width large enough to fit all minimums (relies on the parent being scrollable, not really a fix).

## Relevant code
Core math (all in `dockview-core`):

- `src/splitview/splitview.ts:170-172` — `get minimumSize()` returns the *sum* of all viewItems' minimumSize. There is no cap against container size.
- `src/splitview/splitview.ts:387-430` — `addView(...)` inserts a new view (default `viewSize = view.minimumSize` when sizing is `Distribute`), then triggers `relayout`.
- `src/splitview/splitview.ts:727-743` — `relayout` calls `resize(...)` with `this._size - contentSize` (delta), then `distributeEmptySpace` + `layoutViews`.
- `src/splitview/splitview.ts:1005-1132` — `resize`. Each item is `clamp(size, item.minimumSize, item.maximumSize)`. If `Σ minimumSize > this._size`, the tentative-delta clamp can't reduce any item below its minimumSize, so the total `_contentSize` stays > `this._size`.
- `src/splitview/splitview.ts:745-781` — `distributeEmptySpace` only iterates while `emptyDelta !== 0`; when contentSize > size, emptyDelta is negative but `clamp(item.size + emptyDelta, minimumSize, maximumSize)` cannot reduce below minimumSize, so the overflow remains.
- `src/splitview/splitview.ts:800-889` — `layoutViews` does `totalLeftOffset += viewItems[i].size; view.container.style.left = offset;`. Once cumulative size exceeds container width, subsequent panels are positioned past the right edge — exactly the off-screen behavior the reporter sees. The parent has `overflow: hidden`, so the overflowing panels become inaccessible.
- `src/splitview/viewItem.ts:25-29` — visible items always report `view.minimumSize`; no override path.
- `src/gridview/gridview.ts:920-984` — `addView` (the entry point used by `DockviewComponent.doAddGroup`/split logic) creates a new LeafNode and forwards to `BranchNode.addChild` → `splitview.addView`. No "would this overflow?" check before insertion.
- `src/gridview/branchNode.ts:302-314` — `BranchNode.addChild` is a thin pass-through to `splitview.addView`. Same — no guard.
- `src/dockview/dockviewGroupPanel.ts:43-67` — `DockviewGroupPanel.minimumWidth/minimumHeight` returns the active panel's `minimumWidth` (or explicit group constraint), feeding the splitview math above.
- `src/dockview/dockviewPanel.ts:22, 49-99, 165, 217` — `minimumWidth` is stored verbatim and read back without any clamping against parent size.

Documented caveat (mismatched against actual behavior):
- `packages/docs/docs/core/panels/add.mdx:205-222`.

## Recent commits that may have touched this
`git log --since="2024-01-01"` on splitview/gridview files — nothing addresses minimum-size overflow:

- `5929faf82` fix: Restore iframe pointer events on contextmenu during resize
- `722150fae` feat: add gridview normalization to prevent redundant branch nodes
- `2ff358e07` fix: respect user-provided minimumSize in FixedPanelView (FixedPanelView only)
- `eec2ae04f` fix: constraints persistence and precedence issues
- `49b1c5a17` bug: gap sizing fixes
- `1cd425108`, `ee74785d7`, `eda3ea121` — gap/sash/hidden-view layout fixes (not overflow-of-minimums)

None of these change the core fact that `Σ minimumSize` is permitted to exceed container size.

## Verdict
**CONFIRMED_BUG**

The reproducer in the issue still works on master. The code in `splitview.ts` permits viewItem sizes to be the sum of their minimums even when that exceeds container width, and `layoutViews` then positions later panels off-screen. The documentation page at `packages/docs/docs/core/panels/add.mdx:209-211` even acknowledges this needs to be handled, but no such mitigation exists in code today.

## Notes / fix sketch
This is a non-trivial design problem more than a localized fix. Options, roughly ordered by invasiveness:

1. **Cap effective minimum proportionally** — in `splitview.ts`, when `Σ minimumSize > this._size`, scale each item's *effective* `minimumSize` down by `this._size / Σ minimumSize` for the purpose of size distribution. Keeps panels visible at the cost of violating the requested minimums (which the docs explicitly say is allowed). Smallest change. The clamp call sites at `splitview.ts:771-775`, `1098-1109`, `1120-1124` would consume `effectiveMinimumSize` instead of `minimumSize`. Risk: any code reading `minimumSize` for sash limits would need consistent semantics.

2. **Reject the `addView` / `addGroup` / split when it would overflow** — `BranchNode.addChild` (or upstream in `dockview.ts:doAddGroup` / split DnD) returns/throws if `currentMinSum + newView.minimumSize > availableSize`. User-friendly but breaks the "add succeeds, then resize" workflow that some apps rely on.

3. **Horizontal overflow with scrolling / overflow dropdown for whole groups** — bigger feature. Mirror what `tabsContainer` does for individual tabs, but at the splitview level for entire groups. Best UX, largest scope.

4. **Hybrid**: cap-and-warn — implement (1) but fire a console warning / event when the cap activates, so callers know their minimumWidth wasn't honored.

Edge cases to watch:
- Persisted layouts (`fromJSON`) explicitly set sizes — `layout(size, orthogonalSize)` already does proportional scaling at `splitview.ts:695-720` with a `clamp(..., minimumSize, maximumSize)` that has the same overflow risk; same fix would apply.
- Mixed minimumWidth + LayoutPriority.High/Low items.
- `maximumWidth` should still apply normally; only the lower bound needs softening.
- Group constraints (`DockviewGroupPanel._explicitConstraints`) vs. active-panel constraints — both flow through the same getter, so any fix at the splitview level naturally covers both.

Recommended starting point: option (1), localized to `splitview.ts`, with a single helper `effectiveMinimumSize(viewItem)` that scales down only when the sum-of-mins overflows `_size`. Adds maybe ~40 lines and is fully unit-testable.
