# Issue #680 — After all the groups in the branch are hidden, Cannot keep the original size

- URL: https://github.com/mathuo/dockview/issues/680
- Filed against version: unspecified (filed 2024-08-08; ~v1.x / early-v2.x era)
- Investigated: 2026-05-16
- Investigated by: triage agent (Claude)

## Summary
Reporter has a layout where all groups inside a single branch (splitview level inside the
grid) get hidden, the layout is serialized and re-hydrated via `fromJSON`, then a previously
hidden group is shown again. The shown group does not return to its original size — it
either inflates to fill the entire branch (because its sibling is still hidden and the
distribution algorithm has nowhere else to put the freed space) or comes back at a
clamped/altered size because the persisted `cachedVisibleSize` was already corrupted on
the hide path. Expected: each group should return to the size it had before the hide
sequence began.

## Reproduces on master?
Yes — confirmed by code analysis of `Splitview.setViewVisible`,
`Splitview.distributeEmptySpace`, `ViewItem.setVisible`, and `BranchNode.setChildVisible`.

Trace with two groups A and B in a horizontal branch, sized `[200, 800]`, branch=1000:

1. **Hide A** (`splitview.setViewVisible(0, false)`).
   - `ViewItem.setVisible(false)` caches A's pre-hide size: `A._cachedVisibleSize = 200`,
     `A.size = 0`.
   - `distributeEmptySpace(0)`: `emptyDelta = 1000 - (0 + 800) = +200`. With
     `lowPriorityIndex=0` pushed to the end, the loop visits B first; B grows
     `800 → 1000` and absorbs the entire delta. State: `[0, 1000]`.
   - `saveProportions()` runs (contentSize=1000): proportions `[undefined, 1]`.

2. **Hide B** (`splitview.setViewVisible(1, false)`).
   - `ViewItem.setVisible(false)` caches the *current* size — which is the post-grow
     value, **not the original**: `B._cachedVisibleSize = 1000`, `B.size = 0`.
   - `distributeEmptySpace(1)`: `emptyDelta = 1000`, but both viewItems are now hidden,
     so `clamp(size + delta, 0, 0) = 0` for both — nothing absorbs the delta. State:
     `[0, 0]`, contentSize=0. `saveProportions()` is a no-op
     (`_contentSize > 0` guard, line 784).
   - `BranchNode.setChildVisible` then sees `areAllChildrenHidden=true` and fires
     `_onDidVisibilityChange({ visible: false })`, propagating up so the parent hides
     the whole branch.

3. **`toJSON`** serializes the leaves as
   `[{visible:false, size:200}, {visible:false, size:1000}]` — sum 1200, but the branch
   was only 1000. The persisted cached size for B is the inflated post-step-1 value.

4. **`fromJSON`** rebuilds and constructs `ViewItem`s with
   `cachedVisibleSize=200` and `cachedVisibleSize=1000`. Both start hidden.

5. **Show A** (e.g. `api.setVisible(true)` on the leaf).
   - `ViewItem.setVisible(true)` restores A to `clamp(200, viewMin, viewMax) = 200`.
   - `distributeEmptySpace(0)` runs with `emptyDelta = 1000 - 200 = +800`, and
     `lowPriorityIndex=0` pushed last. Iteration order: `[1, 0]`. B is still hidden
     so `minimumSize = maximumSize = 0` (the `visible ? ... : 0` getters on
     `ViewItem`) — B cannot absorb. A is visited next: `clamp(200 + 800, Amin, Amax)`,
     where Amax is the view's actual maximum (typically `Number.MAX_VALUE` for a
     group). A blows up to `1000`.
   - Final: `[1000, 0]` — A occupies the entire branch instead of returning to 200.

6. **Then show B** (if the user shows the second one too).
   - `ViewItem.setVisible(true)` restores B to `clamp(1000, viewMin, viewMax) = 1000`,
     `B.size = 1000`.
   - `distributeEmptySpace(1)`: `emptyDelta = 1000 - (1000 + 1000) = -1000`. Iteration
     order with `lowPriorityIndex=1` pushed last: `[0, 1]`. A is visited first:
     `clamp(1000 + (-1000), Amin, Amax) = Amin` (almost always 0 for a group). A
     collapses to its min; the remainder shrinks B. Final state is heavily skewed —
     nothing like the original `[200, 800]`.

The core defect is two-fold and both halves are the same family of bug as #1019:

- **(a) Wrong size cached on hide when a sibling was previously hidden.** When B is
  hidden after A, B's `_cachedVisibleSize` is the *current* (already-grown) size, not
  the size B had before A was hidden. The "original" 800 is lost.
- **(b) No redistribution memory across visibility changes.** On show, the algorithm
  has no record of which sibling absorbed the freed space; it just clamps the first
  available view to its limit and dumps the delta there.

`saveProportions()` doesn't help here because:
- After step 1 it records `[undefined, 1.0]` (only B is visible, so B owns 100% of
  the visible content) — the original `[0.2, 0.8]` ratio is already lost.
- After step 2 it is skipped entirely (contentSize=0 guard).
- It is never consulted by `distributeEmptySpace` anyway.

## Relevant code
- `packages/dockview-core/src/splitview/splitview.ts:303` — `setViewVisible(index, visible)`
  calls `viewItem.setVisible(...)`, `distributeEmptySpace(index)`, then
  `saveProportions()`.
- `packages/dockview-core/src/splitview/splitview.ts:745` — `distributeEmptySpace`. Same
  positional, memoryless distribution as in #1019. No special case for "currently all
  views except this one are hidden", which is exactly the show-from-all-hidden state.
- `packages/dockview-core/src/splitview/splitview.ts:783` — `saveProportions` skips
  when `_contentSize === 0` (line 784), so the all-hidden state cannot capture the
  pre-hide ratios.
- `packages/dockview-core/src/splitview/viewItem.ts:66-89` — `ViewItem.setVisible`.
  On hide, caches `this.size` (or the explicit `size` argument). That value is the
  *current* size, which is corrupted by any prior `distributeEmptySpace` redistribution
  among the still-visible siblings. There is no concept of an "original" size to fall
  back to.
- `packages/dockview-core/src/splitview/viewItem.ts:25-37` — `minimumSize`/`maximumSize`
  getters return 0 when the view is hidden, which is what locks hidden siblings out
  of absorbing space on the show path.
- `packages/dockview-core/src/gridview/branchNode.ts:235-258` — `setChildVisible`
  detects "all children hidden" / "first child shown again" and bubbles a
  `onDidVisibilityChange` event so the parent branch hides/shows the whole branch.
  This correctly toggles the branch's outer visibility, but it does not
  attempt to restore inner proportions when the branch is re-shown.
- `packages/dockview-core/src/gridview/gridview.ts:248-275` — `serializeBranchNode`
  writes `cachedVisibleSize` as the leaf's `size` when hidden. Because that cached
  value is already wrong (see step 2 above), even a perfect `fromJSON` cannot
  restore the original layout.

## Recent commits that may have touched this
Filtered to `splitview/splitview.ts`, `splitview/viewItem.ts`, `gridview/branchNode.ts`
since the issue was filed (2024-08-08):

- `eda3ea121` fix: splitview layout view size with hidden view — fixes layout/margin
  math when a view is hidden; does not change `setViewVisible` or
  `distributeEmptySpace` behaviour.
- `ae88703a8` feat: setVisible enhancements — surface API only; does not address the
  caching/redistribution logic.
- `638beb4e8` fix: Preserve group size when setting visibility to false (issue #1050)
  — adds a `pendingSize` reapply for the *immediate `setSize` + `setVisible(false)`*
  timing race in `DockviewGroupPanelApiImpl`. Does **not** touch the splitview-level
  caching path that breaks here, and does not restore proportions when re-showing
  from all-hidden.
- `bdf8c49ab` fix(dockview-core): round splitview inline pixel writes (speculative
  #1245) — pixel rounding only; unrelated.
- `5929faf82` fix: Restore iframe pointer events on contextmenu during resize —
  unrelated.

None of these touch the all-hidden-then-show distribution path. The behaviour observed
in 2024 still applies on master.

## Verdict
**CONFIRMED_BUG** (and same root-cause family as #1019).

## Relation to #1019
Same root cause family — both reduce to *"`Splitview.distributeEmptySpace` is
memoryless: it doesn't know which sibling(s) absorbed freed space when a view was
hidden, so on show it can't undo the absorption symmetrically"*. Differences:

- **#1019**: a single panel toggles visibility in a splitview where the other
  siblings stay visible. The bug surfaces as a constrained sibling getting drained
  back to its `minimumSize` instead of a flex sibling giving back the space it took.
- **#680**: *all* siblings get hidden, then re-shown one at a time. Two added
  failure modes on top of #1019:
  1. The hidden-cache (`_cachedVisibleSize`) is captured *after* prior
     redistribution, so the persisted "original" size is already wrong before
     `toJSON` ever runs.
  2. On show, the only visible-sibling candidate to absorb the negative residual is
     the panel being shown itself (because all others are still hidden and have
     `min=max=0`), so it inflates to fill the branch instead of returning to its
     remembered size.

A fix that addresses #1019 — recording the pre-hide size *and* which siblings absorbed
the delta, then replaying that on show — also addresses #680 if the snapshot is taken
**before any prior hide-induced redistribution has run** (i.e. the snapshot must be
the size the view had when *all* siblings were visible, or at least the size at the
moment of the most recent "all visible" state).

So: treat #680 as a stricter version of #1019. Any fix should be designed to handle
both together. Verdict for triage: **DUPLICATE of #1019 in terms of root cause**, but
worth keeping as a separate issue because (a) it captures the multi-hide failure
mode, and (b) it's a load-bearing test case any fix must pass.

## Notes / fix sketch
Tie the fix to #1019:

1. On the *first* hide in a branch (i.e. when transitioning from "all visible" to
   "some hidden"), snapshot the full size vector on the splitview (call it
   `_lastFullyVisibleSizes`). Invalidate this snapshot whenever a user-driven resize
   (sash drag, `resizeView`, layout change) occurs while at least one view is still
   visible.
2. On any `setViewVisible(_, true)` that brings the branch back to "all visible",
   restore each view's size from the snapshot (subject to current `min`/`max`
   clamps), then clear the snapshot.
3. For partial restores (show one of N hidden), seed the shown view's size from the
   snapshot rather than from its own `_cachedVisibleSize` (which may be stale), and
   leave the remainder for `distributeEmptySpace` to absorb among other still-hidden
   siblings *only if a subsequent show is expected* — practically: park the residual
   on the shown view but mark the snapshot still active so the next show pulls from
   the snapshot too.

Test cases to add (in `splitview.spec.ts`):

- 2-view branch `[200, 800]`: hide both in either order → show in either order →
  back to `[200, 800]`.
- 3-view branch `[100, 300, 200]`: hide all in arbitrary orders, show in arbitrary
  orders, ratios preserved.
- Same scenarios through `toJSON` → `fromJSON` round-trip on the full grid.
- Interleaved: hide A, manually resize B, hide B, show B, show A — the manual resize
  must invalidate the snapshot so the original `[200, 800]` is not naively restored.
- `proportionalLayout: false` variant.
- Vertical orientation variant.
