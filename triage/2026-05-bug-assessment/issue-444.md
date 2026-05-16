# Issue #444 — Modified panel size is not persisted when dropping at edges.

- URL: https://github.com/mathuo/dockview/issues/444
- Filed against version: unspecified (2023)
- Investigated: 2026-05-16
- Investigated by: Claude Opus 4.7

## Summary
After a user manually resizes panels in a row/column, dropping a new panel at the outer edge of an adjacent group causes the parent splitview to redistribute all sibling sizes evenly — wiping the user's manual sizing. The user expects the existing size ratios to be preserved when a new neighbour is inserted.

## Reproduces on master?
Yes — code analysis confirms the behaviour is unchanged on master HEAD (dockview-core@6.2.2). Every edge-drop code path in `moveGroupOrPanel` invokes `createGroupAtLocation(location)` / `doAddGroup(group, location)` without an explicit `size` argument. `doAddGroup` defaults the size to `Sizing.Distribute`, which causes `Splitview.addView` to call `distributeViewSizes()` after insertion, flattening every flexible sibling's size to an equal share of the remaining content size.

## Relevant code

The edge-drop path in `moveGroupOrPanel` calls these without size:

- `packages/dockview-core/src/dockview/dockviewComponent.ts`
  - line 2720 `moveGroupOrPanel(options)` — entry point
  - line 2880 `createGroupAtLocation(targetLocation)` — single-panel source from popout
  - line 2915 `createGroupAtLocation(targetLocation)` — single-panel source from edge group
  - line 2948 `this.doAddGroup(targetGroup, location)` — single-panel source (size < 2) into adjacent edge
  - line 2980 `this.createGroupAtLocation(dropLocation)` — multi-panel source path (most common case in repro)
  - line 3098 `targetGroup = this.createGroupAtLocation(dropLocation)` — additional edge placement
  - line 3604 `createGroupAtLocation(location, size?, options?)` — wrapper forwards to `doAddGroup(group, location, size)`

- `packages/dockview-core/src/gridview/baseComponentGridview.ts`
  - line 274 `doAddGroup(group, location = [0], size?)` — `this.gridview.addView(group, size ?? Sizing.Distribute, location)`

- `packages/dockview-core/src/splitview/splitview.ts`
  - line 387 `addView(view, size = { type: 'distribute' }, …)`
  - lines 587–593 — when `size.type === 'distribute'` the splitview calls `distributeViewSizes()` after the insert, equalising every flexible child's size. This is the line that wipes the user's manual ratios.
  - line 598 `distributeViewSizes()`

The fix needs `moveGroupOrPanel`'s edge-drop branches to pass an explicit `size` to `createGroupAtLocation` (e.g. take half of the destination group's current size via `Sizing.Split`, or compute a fixed size that leaves siblings untouched) instead of falling back to `Sizing.Distribute`.

## Recent commits that may have touched this

Nothing has addressed size preservation on edge drop:

- `105043b0f refactor(dockview-core): unify edge-group move placement path (#1235)` — reshuffled the edge-drop code, still no size argument.
- `6acb68504 fix(dockview-core): keep edge group anchored when moved (#1235)` — same edge-related work, anchoring only, no size logic.
- `a2f83e9d1 fix(dockview-core): preserve tab groups when dragging a group via its header (#1244)` — unrelated (tab group preservation).
- `638beb4e8 fix: Preserve group size when setting visibility to false (issue #1050)` — preserves size on visibility toggle, not on edge drop.
- `splitview.ts` `addView` / `distributeViewSizes` and `baseComponentGridview.ts` `doAddGroup` have not been touched in a way that changes this behaviour since the issue was filed.

Issue #708 ("Preserve group size when moving groups (continued)") is still open and describes the same family of cases: size preservation only works for moves within a single nested splitview; everything else (including edge drops) redistributes.

## Verdict
**CONFIRMED_BUG**

## Notes / fix sketch

- Smallest viable fix: in the multi-panel branch around line 2980 (and the analogous single-panel branches at 2948 / 2880 / 2915 / 3098), compute a size for the new group derived from the destination group's current size in the parent splitview's orientation, and pass it through `createGroupAtLocation(dropLocation, size)`. Using `Sizing.Split` semantics (take half of the neighbour) would mirror VS Code's behaviour and avoid touching unrelated siblings — `Splitview.addView` only calls `distributeViewSizes()` for `{type: 'distribute'}`, so any numeric size or `split` sizing skips redistribution.
- Edge cases:
  - When the parent splitview has `proportionalLayout = true` and the new view exceeds available space, expect a single round of `relayout` to shrink the chosen neighbour rather than every sibling — verify `distributeEmptySpace` doesn't reintroduce the regression.
  - Branching cases: when `getRelativeLocation` returns a location at a new orientation level (i.e. wraps the destination group in a new BranchNode), `gridview.addView` creates a `newParent` and the explicit size becomes the *new branch's* size on the outer axis. That path already preserves the existing siblings' sizes; the bug is specifically the inner-branch insert case.
  - Source group disappearing (sourceGroup.size < 2 path at 2948) needs the size recomputed *after* `doRemoveGroup` because the parent splitview will have reflowed.
- Estimated complexity: small/medium — a handful of call sites, but careful tests needed for HORIZONTAL/VERTICAL orientation, root vs. nested location, and the `size < 2` source path that already deletes the source group before placing.
