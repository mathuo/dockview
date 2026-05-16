# Issue #989 — Panel content not rendering after pop-in until tab interaction

- URL: https://github.com/mathuo/dockview/issues/989
- Filed against version: unspecified (filed 2025-08-04 by @jhp0621 against the
  live demo at https://dockview.dev/demo — at that date the published version
  was dockview-core@4.6.2)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary
A user pops out a group via the demo's "Open In New Window" button
(`containerApi.addPopoutGroup(group)`) and then closes the popout via the
"Close Window" button. In the demo, "Close Window" is wired to
`group.api.moveTo({ position: 'right' })` (see
`packages/docs/sandboxes/react/dockview/demo-dockview/src/controls.tsx:72-78`).
After the pop-in, the panel is in the grid but its content area is blank
until a tab switch or drag forces a re-render. Reporter expects the content
to render immediately on pop-in.

## Reproduces on master?
**Likely no — fixed in the December 2025 debounced-update wire-up.**

The fix from commit `9b12ca88d` ("optimize: debounce overlay position updates
during group moves", 2025-12-28) — which lives at
`dockviewComponent.ts:645-652` and is locked in by the issue #1020 regression
test (`280b08ef9`, 2026-05-16) — wires every `_onDidMovePanel` event into
`debouncedUpdateAllPositions()`, which forces
`OverlayRenderContainer.updateAllPositions()` on the next animation frame.

Independently, `moveGroup()` itself calls `debouncedUpdateAllPositions()`
directly at `dockviewComponent.ts:3381` for **every** group move including the
popout-to-grid center merge path. This means the overlay reposition pass that
the reporter was missing (the one that previously only ran on a real resize /
tab switch) now runs unconditionally on the pop-in path.

The reporter filed against ~4.6.x; both the per-move `_onDidMovePanel` wire-up
and the in-`moveGroup` direct call land between then and master HEAD (6.2.2).
The exact `addPopoutGroup` → `moveTo({ position: 'right' })` flow described in
the issue traverses `moveGroup`'s `target === 'center'` branch, which now
schedules `updateAllPositions` on the next RAF.

There is no dedicated jest test for this exact popout-then-`moveTo` flow on
master, so a tiny remaining edge case is possible (e.g. ordering against the
popout window's own dispose callback at `dockviewComponent.ts:1128-1196`), but
the symptom in the issue — overlay stuck at stale 0×0 / off-grid coordinates
until external resize — should no longer occur because the RAF reposition
unconditionally fires.

## Relevant code

### Pop-in code path traversed by the demo's "Close Window" button

1. `packages/docs/sandboxes/react/dockview/demo-dockview/src/controls.tsx:72-78` —
   the actual click handler:
   ```ts
   if (props.api.location.type !== 'popout') {
       props.containerApi.addPopoutGroup(props.group);
   } else {
       props.api.moveTo({ position: 'right' });
   }
   ```
   `props.api` is the `DockviewGroupPanelApi` of the popout group.
2. `packages/dockview-core/src/api/dockviewGroupPanelApi.ts:154-177` —
   `moveTo` with no `options.group` creates a new grid group via
   `accessor.addGroup({ direction: 'right' })` and then calls
   `accessor.moveGroupOrPanel({ from: { groupId: this._group.id },
   to: { group: newGroup, position: 'center' } })`.
3. `packages/dockview-core/src/dockview/dockviewComponent.ts:2737-2765` —
   because `sourceItemId === undefined` (whole-group move),
   `moveGroupOrPanel` delegates to `this.moveGroup(...)`.
4. `packages/dockview-core/src/dockview/dockviewComponent.ts:3117-3183` —
   `moveGroup` enters the `target === 'center'` branch: snapshots tab groups,
   removes all panels from the popout `from` group, calls
   `doRemoveGroup(from)` (which detects `from.api.location.type === 'popout'`
   at line 2638 and runs the popout dispose chain — see below), then
   `openPanel`s each removed panel into the new grid `to` group.
5. `packages/dockview-core/src/dockview/dockviewComponent.ts:3377-3381` — at
   the end of `moveGroup`, regardless of branch:
   ```ts
   source.panels.forEach((panel) => {
       this._onDidMovePanel.fire({ panel, from });
   });
   this.debouncedUpdateAllPositions();
   ```
   The direct `debouncedUpdateAllPositions()` call is the load-bearing line
   for this bug: it schedules a RAF that runs
   `overlayRenderContainer.updateAllPositions()`, which iterates
   `OverlayRenderContainer.map` and re-runs each panel's `resize()` closure,
   reading the (now correct) `referenceContainer` rect and writing it back
   onto the overlay's `focusContainer` style.

   Note: in this code path `source === from` and `from` is empty after panels
   are moved, so the `forEach` fires zero `_onDidMovePanel` events. The
   wired-up listener at line 645 is therefore a no-op here — the direct call
   at line 3381 is what fixes the bug.

### Popout dispose chain that runs during the center merge

- `dockviewComponent.ts:2638-2682` — `doRemoveGroup` branch for popout groups.
  Calls `selectedGroup.popoutGroup.dispose()`, removes from `_popoutGroups`,
  then runs `selectedGroup.disposable.dispose()` (line 2662) which fires the
  popout window's `CompositeDisposable`.
- `dockviewComponent.ts:1128-1196` — the popout window's terminal
  `Disposable.from(() => { ... })`. Because `from`'s panels were already moved
  to `to`, the `isGroupAddedToDom && this.getPanel(referenceGroup.id)` branch
  (line 1133) re-adds the now-empty popout group back to the original
  reference-group slot and activates it. Control then returns to `moveGroup`
  which re-activates `to` and fires `debouncedUpdateAllPositions()`.

### Overlay reposition primitive

- `dockviewComponent.ts:2698-2707` — `debouncedUpdateAllPositions()` cancels
  any pending RAF, schedules a new one, and calls
  `this.overlayRenderContainer.updateAllPositions()` inside it.
- `packages/dockview-core/src/overlay/overlayRenderContainer.ts:100-114` —
  `updateAllPositions()` invalidates the position cache and re-invokes every
  visible panel's `resize()` closure. Each `resize()` (line 166-218) reads
  `referenceContainer.element` via `getDomNodePagePosition` and writes
  left/top/width/height onto the overlay's `focusContainer`.

### The `_onDidMovePanel → debouncedUpdateAllPositions` listener (issue #1020 fix)

- `dockviewComponent.ts:644-652`:
  ```ts
  this._onDidMovePanel,
  this._onDidMovePanel.event(() => {
      this.debouncedUpdateAllPositions();
  }),
  ```
- Test that locks this in: `packages/dockview-core/src/__tests__/dockview/dockviewComponent.spec.ts:9275-9340`
  (issue #1020 — `addGroup` + `moveTo` with `defaultRenderer="always"`).

## Recent commits that may have touched this

`git log --since="2024-01-01"` on `dockviewComponent.ts` and
`overlayRenderContainer.ts`, filtered to overlay / popout / move work since
the issue was filed (2025-08-04):

- `280b08ef9` (2026-05-16) test(dockview-core): cover issue #1020 addGroup + moveTo overlay reposition
- `a9a23cb85` fix(dockview-core): keep `dv-render-overlay` hidden when visibility flips mid-rAF
- `7160f7435` fix(dockview-core): use visibility:hidden instead of display:none for always renderer
- `9cd10fe55` fix(dockview-core): prevent always-renderer flash at 0,0 on attach
- `9b12ca88d` (2025-12-28) **optimize: debounce overlay position updates during group moves** — added `debouncedUpdateAllPositions` and the `_onDidMovePanel` listener
- `da2d7fb49` fix: force re-render on group move
- `f640e5bb4` fix(security): reject non-same-origin popout URLs
- `ba4f05b50` fix: render popout-group popovers in the popout window
- `45ae88245` fix: ensure panel is rendered when set active
- `3ca12d0e7` fix: prevent component disappearing when moving from floating to new grid group
- `d8916778c` fix: prevent ghost group creation when dragging popout groups back to grid
- `05196fd86` fix: correct positioning when dragging groups from popout to main window
- `024c6e1a4` bug: restoring popout groups

The directly-relevant landing is `9b12ca88d` (Dec 2025), which post-dates the
filing date by ~5 months. The reporter has not been pinged for re-test since.

## Verdict
**LIKELY_FIXED** — overlay reposition now runs on every group move (including
the `addPopoutGroup` → `group.api.moveTo({ position: 'right' })` pop-in path)
via `debouncedUpdateAllPositions()` at `dockviewComponent.ts:3381`. Ask the
reporter to re-test on 6.2.2 against https://dockview.dev/demo.

## Notes / fix sketch

### Confirmation work
- Add a jest test that exercises the exact `addPopoutGroup(group)` →
  `group.api.moveTo({ position: 'right' })` flow with
  `defaultRenderer: 'always'` and asserts `updateAllPositions` was called on
  the next RAF (mirroring the issue #1020 regression test at spec line 9275).
  The popout `beforeEach` mock at spec line 6563-6586 already provides the
  required `window.open` stub. This would close the test gap and let us
  upgrade the verdict to CONFIRMED-FIXED.

### Latent oddity worth checking even if rendering works
- In the popout dispose callback at `dockviewComponent.ts:1133-1152`, after a
  `moveTo`-driven pop-in the original ghost reference group is set visible
  again *empty* (because the panels already moved to the new `to` group). The
  empty popout group is also re-added at grid position `[0]`. Visually the
  layout ends up with two stray empty groups plus the destination. The
  reporter did not complain about this, but if the rendering symptom is gone
  this empty-group artifact is the next thing they may notice.

### If reporter still reproduces
- The remaining suspect would be ordering between the popout's RAF-bound
  resize listener at `dockviewComponent.ts:1121-1126` (`addDisposableListener(_window.window!, 'resize', ...)`) and the main window's
  `debouncedUpdateAllPositions`. Both are independent RAFs and could race in
  edge cases (e.g. popout dispose tearing down `_window.window` before its
  resize listener fires).
