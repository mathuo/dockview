# Issue #781 — Creating a popout group from the last group in a gridview causes a "ghost group" to linger in its place

- URL: https://github.com/mathuo/dockview/issues/781
- Filed against version: 2.0.0
- Investigated: 2026-05-16
- Investigated by: Claude Opus 4.7 (1M)

## Summary

When the user pops out the only remaining grid group, the reference group is hidden (via `setVisible(false)`) but is not removed from the gridview. The user expects the empty source group to be cleaned up after the popout opens; instead the gridview still holds a hidden leaf, leaving a "ghost group" that breaks central drop targets and (with the default watermark) renders a non-functional close button. With a custom watermark the watermark appears but DnD still routes through the hidden group.

## Reproduces on master?

**Likely yes (code analysis only).** The popout flow's behaviour for `referenceLocation === 'grid'` still calls `referenceGroup.api.setVisible(false)` rather than `removeGroup(...)`, and the root drop target's center-overlay guard is keyed on `gridview.length`, which counts hidden leaves. Confidence: high — both code paths and existing tests document that the hidden reference group is *intentionally* retained (so it can be restored when the popout closes), but no branch special-cases the "this is the last grid group" scenario. No commit since the issue was filed (2024-12) addresses #781 or the underlying inconsistency.

## Relevant code

All paths below are inside `packages/dockview-core/src/dockview/dockviewComponent.ts` unless stated otherwise.

- **`addPopoutGroup` — group-popout branch:** lines 838–1015. The relevant block when popping a `DockviewGroupPanel`:
  - Lines 988–994: `moveGroupWithoutDestroying({ from: referenceGroup, to: group })` empties the source group.
  - Lines 996–1013: a `switch (referenceLocation)`:
    - `'grid'` → `referenceGroup.api.setVisible(false)` (line 998). The empty group remains in the gridview, just hidden.
    - `'floating'` / `'popout'` → `this.removeGroup(referenceGroup)` (line 1010). Source is cleaned up.
  - The `'grid'` case is deliberate (so the popout can be restored to that position when closed), but it never special-cases the "this is the only group in the grid" sub-case.

- **`moveGroupWithoutDestroying` helper:** lines 119–136. Empties `from`, moves panels to `to`. Leaves `from` as a zero-panel group.

- **Root drop target (`_rootDropTarget`) — center-overlay guard:** lines 575–618, specifically:
  - Line 588: `if (position === 'center') { return this.gridview.length === 0; }` — center drop target is suppressed whenever the gridview has *any* leaves, visible or not.
  - Line 594: external drag mirrors the same check.
  - Line 737: `onWillShowOverlay` also gates on `this.gridview.length > 0`.

  `gridview.length` is defined in `packages/dockview-core/src/gridview/gridview.ts` line 343–345 and counts *all* root children including hidden ones, so the hidden ghost group satisfies `length !== 0` and the central drop zone is suppressed — matching the reporter's "no central snap-to region" observation.

- **Inconsistency with the watermark guard:** `updateWatermark()` at lines 2456–2481 uses `this.groups.filter((x) => x.api.location.type === 'grid' && x.api.isVisible).length === 0`. That correctly treats the hidden group as "no grid groups", so the **grid-level** watermark *does* show. The fact that the watermark appearance and the drop-target enablement disagree is the root cause of the user-visible symptom mismatch.

- **Why the user sees a "close" button without a custom watermark:** the default `Watermark` component (`packages/dockview-core/src/dockview/components/watermark/watermark.ts`) renders a close button. When the hidden ghost group still occupies the grid, the grid-level watermark renders inside `gridview.element` (line 2474) on top of the (hidden) splitview node, producing the appearance of a single close button "occupying the grid".

- **Where a fix would land:** add a "would-this-leave-the-grid-empty?" branch inside the `case 'grid':` arm at line 998:

  ```ts
  case 'grid': {
      const visibleGridGroups = this.groups.filter(
          (g) => g.api.location.type === 'grid' && g.api.isVisible
      ).length;
      if (visibleGridGroups === 1) {
          // we are about to hide the last visible grid group — remove it
          // outright instead of leaving a hidden ghost.
          this.removeGroup(referenceGroup);
      } else {
          referenceGroup.api.setVisible(false);
      }
      break;
  }
  ```

  Equivalent alternative: unify the `_rootDropTarget` `gridview.length` checks (lines 588, 594, 737) to use the same "visible grid groups" filter that `updateWatermark` already uses. That fixes the DnD symptom without changing the existing popout-restore behaviour, but it leaves a hidden leaf in the gridview that consumes no space — slightly less clean than removing it.

## Recent commits that may have touched this

`git log --since="2024-01-01" -- packages/dockview-core/src/dockview/dockviewComponent.ts` shows many popout-adjacent commits, none of which alter the `case 'grid': referenceGroup.api.setVisible(false)` line or the `gridview.length === 0` guards. The most relevant nearby work:

- `a8586dc08` — fix(dockview-core): recompute target location after popout single-panel move (#1004)
- `d8916778c` — fix: prevent ghost group creation when dragging popout groups back to grid (#960, addresses the *return* path, not the *pop-out* path)
- `05196fd86` — fix: correct positioning when dragging groups from popout to main window
- `ba4f05b50` — fix: render popout-group popovers in the popout window
- `991bd4401` — fix: prevent edge groups from being floated or popped out
- `c216d7035` — chore: comments (whitespace only on the relevant block)
- `7515b9b05` — bug: fixup popout group flows (original shape of the buggy switch)

No commit message references #781. Tests at lines 549 and 649 of `__tests__/dockview/dockviewComponent.spec.ts` (`expect(dockview.groups.length).toBe(3); // panel2 + hidden reference + popout`) confirm the "hidden reference is retained" behaviour is intentional and currently asserted; any fix needs to thread the "last group" sub-case without breaking those assertions.

## Verdict

**CONFIRMED_BUG** — the code path that triggers the reporter's repro is unchanged on master, the architectural choice to retain a hidden reference group is incompatible with the "last grid group" case, and the root drop target's `gridview.length` checks make the symptom observable even when the watermark appears correctly.

## Notes / fix sketch

- Preferred fix: branch on "is `referenceGroup` the only visible grid group?" inside the `case 'grid':` arm of `addPopoutGroup` (line 998) and `removeGroup(referenceGroup)` when so. Keeps the popout-restore semantics for the multi-group case while cleaning up the ghost in the last-group case. Complexity: trivial (one helper-style guard).
- Test additions: extend `dockviewComponent.spec.ts` `popout group` describe (line 6563+) with a "popout from the only grid group" case asserting `dockview.gridview.length === 0` and that `_rootDropTarget.canDisplayOverlay(... 'center')` returns `true` after popout. Also assert watermark presence (the grid-level container, not the group's own watermark).
- Edge cases to think through:
  - Closing the popout when the source grid is now empty — the popout's "return" path will need to materialise a new grid group rather than rely on the (now-removed) reference. The disposable at lines 1100+ in `addPopoutGroup` already handles a missing reference group (`alreadyRemoved` check at line 1160, and the `popoutReferenceGroup` lookup in `removeGroup` at line 1242 already tolerates `undefined`), so this should fall through cleanly to the "create a new grid group" branch.
  - Custom `createWatermarkComponent` — confirmed by the reporter to still misbehave; the same fix applies.
  - Serialization (`toJSON`/`fromJSON`): if the user serialises while the popout is open and there are no grid groups, `popoutGroups` will be set but the main grid will be empty — `fromJSON` already creates an empty gridview when no panels are present, so this should round-trip cleanly. Worth a regression test.
