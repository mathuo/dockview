# Issue #1019 — [Splitview] `api.setVisible` causes the size of other split panels to change

- URL: https://github.com/mathuo/dockview/issues/1019
- Filed against version: unspecified (filed 2025-10-09; ~v4.6.x era)
- Investigated: 2026-05-16
- Investigated by: triage agent (Claude)

## Summary
Reporter has a horizontal 3-panel splitview (left / center / right) where left and right both
have `minimumSize` and `maximumSize` configured. Hiding the left panel via `api.setVisible(false)`
causes the right panel to expand (correctly, until it hits `maximumSize`). On re-showing the left
panel via `api.setVisible(true)`, the right panel collapses back toward its `minimumSize`
instead of preserving its current width. The user expected the freed space to be reabsorbed by
the center (flexible) panel, not pulled out of the constrained right panel.

## Reproduces on master?
Yes — confirmed by code analysis of the resize-distribution algorithm.

Trace with left/right both `min=100, max=300`, center flexible, container=1000, initial
[200, 600, 200]:

1. Hide left → `setViewVisible(0, false)` zeroes left, caches 200. `distributeEmptySpace(0)`
   walks indexes `[2, 1, 0]` (descending, with the toggled index pushed last) and adds
   `emptyDelta=+200`. Right grows 200→300 (hits its max), absorbing 100; center grows
   600→700 with the remaining 100. State: [0, 700, 300]. So far so good.
2. Show left → `setViewVisible(0, true)` restores left to 200 (cached). Total content is
   now 1200, so `emptyDelta = -200`. The same loop walks `[2, 1, 0]`. The right panel is
   visited **first** and clamped to `[100, 300]` against the negative delta — it shrinks
   straight from 300 → 100, fully absorbing the -200. Center is never touched and stays at
   700. Final: [200, 700, 100]. Right has dropped to its `minimumSize` exactly as the user
   reports.

The defect is that `distributeEmptySpace` always processes views in the same fixed order
regardless of which view's visibility changed; constrained neighbours that grew to absorb
space when a panel hid are the *first* candidates to give that space back, even when an
unconstrained "flex" panel is sitting on the gain.

Note: setting `LayoutPriority.High` on the center panel works around the bug, because
`pushToStart` then makes the loop visit the center first. The existing
`setViewVisible with one view having high layout priority` test
(`splitview.spec.ts:756`) only passes because of this priority shuffle.

## Relevant code
- `packages/dockview-core/src/splitview/splitview.ts:303` — `setViewVisible(index, visible)`
  calls `viewItem.setVisible(...)` then `distributeEmptySpace(index)`. Note the `index` is
  passed as the `lowPriorityIndex` argument.
- `packages/dockview-core/src/splitview/splitview.ts:745` — `distributeEmptySpace(lowPriorityIndex?)`:
  builds `indexes = range(viewItems.length - 1, -1)` (i.e. `[n-1, ..., 0]`), reorders by
  layout priority, then pushes `lowPriorityIndex` to the end. There is no concept of
  "which view absorbed the space last time"; the algorithm is purely positional.
- `packages/dockview-core/src/splitview/splitview.ts:769-780` — the redistribution loop
  clamps each view to `[minimumSize, maximumSize]` and applies as much of `emptyDelta` as
  possible. The first visited view that can absorb the entire delta swallows it, which is
  what collapses the right panel in step 2 of the trace.
- `packages/dockview-core/src/splitview/viewItem.ts:66-89` — `setVisible(true)` restores
  the cached pre-hide size; that part is correct. The bug is in how the resulting overflow
  is then distributed.

## Recent commits that may have touched this
Filtered to commits touching `splitview/splitview.ts` or `splitview/viewItem.ts` since the
issue was filed (2025-10-09):

- `bdf8c49ab` fix(dockview-core): round splitview inline pixel writes (speculative #1245)
- `5929faf82` fix: Restore iframe pointer events on contextmenu during resize

Neither commit touched `distributeEmptySpace`, `setViewVisible`, or
`ViewItem.setVisible`. The redistribution algorithm has not changed since well before
the issue was filed.

## Verdict
**CONFIRMED_BUG**

## Notes / fix sketch
The core issue: `distributeEmptySpace` doesn't remember which views *gained* size when
a sibling was hidden, so it can't undo the gain symmetrically when the sibling re-appears.

Options, roughly in order of invasiveness:

1. **Symmetric snapshot.** In `setViewVisible`, when *hiding*, record on each other
   `ViewItem` the delta it absorbed (or a snapshot of the pre-hide size). When *showing*,
   subtract that delta first; then run `distributeEmptySpace` only for any residual. This
   would make hide→show a no-op for the other panels, which matches the user's expectation
   exactly.
2. **Re-run the proportional layout on show.** When `proportionalLayout` is enabled
   (default for splitview), the existing `_proportions` snapshot (`saveProportions`,
   line 783) could be used to restore relative sizes on show. The current code calls
   `saveProportions()` *after* every `setViewVisible`, so the post-hide proportions
   overwrite the pre-hide ones — that's why even proportional layout doesn't help here.
   Hold off on saving proportions while a hidden view exists, or snapshot proportions
   keyed by visibility-set.
3. **Priority-aware distribution.** Prefer flex panels (those with
   `maximumSize - minimumSize` large, or with no explicit max) over constrained panels
   when distributing negative deltas. Cheapest change but heuristic — could regress other
   layouts.

Option (1) is the most direct match for the user's expectation. Option (2) is the most
"correct" for proportional layouts in general but touches more behaviour.

Edge cases to cover in tests:
- Hide then resize manually then show (cached delta should be invalidated).
- Hide one of two visible panels in a 3-pane layout where the middle is fully constrained.
- Multiple hides/shows in arbitrary order.
- Non-proportional layout (`proportionalLayout: false`) — needs the same fix.
- Vertical orientation (same algorithm, just rotated).

The existing test at `splitview.spec.ts:732` uses `min=0, max=1000` for all views and so
never trips the bug; a new test with constrained left/right and a wide center panel would
lock this in.
