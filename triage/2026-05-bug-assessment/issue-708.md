# Issue #708 — Preserve group size when moving groups (continued)

- URL: https://github.com/mathuo/dockview/issues/708
- Filed against version: unspecified (filed 2024-09-05, just after commit `e2e91834f` "feat: retain size when moving groups" landed 2024-08-24)
- Investigated: 2026-05-16
- Investigated by: Claude Opus 4.7

## Summary
Follow-up to a previous size-retention fix. The reporter notes that group size is preserved only when a group is dragged within its own nested splitview (i.e., the source and destination share the same parent BranchNode and orientation). All other group-move scenarios — moving a group across nesting levels, between orientations, or into a freshly-split leaf — still redistribute sizes. They are asking for size preservation to cover more cases.

## Reproduces on master?
Yes (code analysis). The `moveGroup` whole-group branch still threads a numeric size into `gridview.addView`, but the way the size is computed makes it correct only for the "same parent splitview, same orientation" case:

- `packages/dockview-core/src/dockview/dockviewComponent.ts:3320-3337` — the size passed to `gridview.addView` is derived from `from.api.width` / `from.api.height` selected by the **target** depth's parity (`referenceLocation.length % 2`). If `from` and `to` live in splitviews of different orientations (i.e., source is laid out along axis X but the target's parent splitview runs along axis Y), the picked dimension belongs to the wrong axis of the destination splitview.
- When the destination location resolves to a `LeafNode` parent (cross-nesting drop that creates a new BranchNode), `gridview.addView` at `packages/dockview-core/src/gridview/gridview.ts:940-983` creates a new BranchNode whose **own** size is fixed at `parent.size` (the target leaf's size in the orthogonal axis). The numeric `size` from the source is then used inside that new sub-splitview, where it may bear no relationship to the available space — so the surviving sibling absorbs whatever's left after clamp, and the visual ratio bears no resemblance to the original.
- Even within an existing BranchNode, the destination splitview's other siblings still get their sizes adjusted by `relayout` (`packages/dockview-core/src/splitview/splitview.ts:583-585, 727-743`) to absorb the new view; their proportions aren't strictly preserved either, just approximately. The reporter's complaint is precisely that this only happens to "look right" for the trivial intra-splitview case (which is also exercised by the existing test at `packages/dockview-core/src/__tests__/dockview/dockviewComponent.spec.ts:709-716`).

No code path currently exists that, for cross-splitview group moves, looks up the destination splitview's geometry and computes a sensible target size for the inserted group while preserving target siblings' ratios.

## Relevant code

- `packages/dockview-core/src/dockview/dockviewComponent.ts`
  - `moveGroupOrPanel` line 2720 — dispatches whole-group drag (no `sourceItemId`) to `moveGroup` at line 2755.
  - `moveGroup` line 3117 — handles non-center moves; the size logic for the grid case lives at lines 3310-3337.
  - `createGroupAtLocation` line 3604 — wrapper used by the *panel*-drag edge paths in `moveGroupOrPanel` (lines 2880/2915/2948/2980/3098); these omit `size` and trigger #444's behaviour, not #708's.
- `packages/dockview-core/src/gridview/gridview.ts`
  - `addView` lines 920-984 — branches on parent type. The BranchNode path passes `size` straight into `splitview.addView`; the LeafNode path wraps the leaf in a new BranchNode of size `parent.size` and uses `size` inside the new sub-splitview.
- `packages/dockview-core/src/gridview/branchNode.ts:302-313` — forwards through to `splitview.addView`.
- `packages/dockview-core/src/splitview/splitview.ts`
  - `addView` line 387 — for numeric `size` sets `viewSize = size` (line 400-401) and skips `distributeViewSizes` (lines 587-593), then `relayout([index])` adjusts siblings to fit. Proportions are not strictly preserved.
  - `moveView` line 664 — used by the *intra-splitview* swap path inside `moveGroupOrPanel` (line 2843 `this.gridview.moveView(...)`). This snapshots the source's size before re-inserting, which is why intra-splitview moves work cleanly.

## Recent commits that may have touched this

- `e2e91834f feat: retain size when moving groups` (2024-08-24) — introduced the current numeric-size logic in `moveGroup`. This is the partial fix issue #708 is following up on.
- `105043b0f refactor(dockview-core): unify edge-group move placement path (#1235)` — reshuffled edge drag code, did not change the cross-splitview size logic.
- `6acb68504 fix(dockview-core): keep edge group anchored when moved (#1235)` — anchoring only.
- `a2f83e9d1 fix(dockview-core): preserve tab groups when dragging a group via its header (#1244)` — unrelated tab-group preservation.
- `638beb4e8 fix: Preserve group size when setting visibility to false (issue #1050)` — unrelated visibility path.
- `splitview.ts addView`/`distributeViewSizes` and `gridview.ts addView` have not been altered since `e2e91834f` in a way that affects this.

## Verdict
**CONFIRMED_BUG**

Shares the broader theme of "layout mutations destroy manual sizing" with #444, but the **root cause is distinct**. #444 fires through `moveGroupOrPanel`'s panel-drag branches, which call `createGroupAtLocation` without any `size`, defaulting to `Sizing.Distribute` and calling `distributeViewSizes()` (catastrophic, equalises every flexible sibling). #708 fires through `moveGroup` (the whole-group branch), which *does* pass a numeric size — but the size is the wrong dimension for cross-orientation moves and the destination splitview's sibling ratios are not preserved because `relayout` only approximately absorbs the change. Fixing #444 (threading a size through edge-drop panel paths) will not fix #708; fixing #708 requires rewriting the size derivation in `moveGroup` to consider the destination splitview's axis/geometry and to capture-and-restore destination sibling proportions (similar to how `moveView` snapshots size for the intra-splitview case).

## Notes / fix sketch

- Pick the destination axis explicitly. Compute the target splitview's orientation from the destination location (parity of `dropLocation.length - 1` against `gridview.orientation`) rather than the target *reference* depth as the code does today. Then pick the corresponding axis of `from` (or, better, an explicit `size` derived from the destination splitview's available space).
- For cross-splitview moves, snapshot the destination splitview's sibling proportions before insertion and restore them after — mirroring the `moveView` snapshot/restore approach. Implement this in `gridview.addView`'s BranchNode branch when called with a numeric size.
- For LeafNode targets (drop that creates a new BranchNode), the numeric size needs to be the new view's share **inside the new sub-splitview** (whose extent is `parent.size`). Clamp `size` to e.g. `min(parent.size / 2, from.api.[axis])` so the new sibling at least gets reasonable space.
- Edge cases:
  - Drop into a tighter splitview where the source's saved size is larger than the destination splitview's content size. Clamp and/or fall back to `Sizing.Split`.
  - Maximised groups / popout / floating — guard rails already present in `moveGroup`.
  - `proportionalLayout = true` interaction: `saveProportions()` runs after every relayout; the snapshot-and-restore approach needs to also override the saved proportions, otherwise the next viewport resize will revert.
- Complexity: medium. Touches `dockviewComponent.ts`, possibly `gridview.ts` and `splitview.ts` to expose a proportion-preserving add path. Needs new tests for: cross-orientation move (nested vertical splitview to root horizontal), cross-depth move into an existing BranchNode, cross-depth move that splits a LeafNode, and combination with `setSize`-customised siblings on both source and destination.
