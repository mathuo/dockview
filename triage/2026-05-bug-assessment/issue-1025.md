# Issue #1025 — Panel floating (last panel in group) and group floating result in same visual outcome but trigger different events (panel floating fails to fire events)

- URL: https://github.com/mathuo/dockview/issues/1025
- Filed against version: unspecified
- Investigated: 2026-05-16
- Investigated by: Claude Opus 4.7 (1M)

## Summary

Shift+drag of a tab whose group has only one panel produces the same visual result as shift+drag of the group's title bar: the whole "group" ends up floating. But the two code paths inside `addFloatingGroup` are very different. The panel path silently destroys the original grid group and creates a brand-new floating group, while the group path moves the same group object into the floating layer. The reporter observes that the panel path emits no top-level events (no `onDidRemoveGroup` for the destroyed source group, no `onDidAddPanel`/`onDidMovePanel`/`onDidAddGroup` chain you would expect for "panel moved + new floating group created"), making it impossible to track group lifecycle.

## Reproduces on master?

**Yes (code analysis).** The relevant branch in `addFloatingGroup` (panel-path) wraps every mutation in `movingLock(...)`, and every top-level `_onDid*` emitter is gated on `!this._moving`. The one event the path does fire — `_onDidAddGroup` for the new floating group at line 1226 — happens *before* the `movingLock` block, but the corresponding `_onDidRemoveGroup` for the source group is suppressed because the entire `removePanel(item, { removeEmptyGroup: true, ... })` call is inside `movingLock`. Net result on master: `onDidAddGroup` fires (new floating group), nothing else does. The reporter says even `onDidAddGroup` doesn't fire for them — this is most likely a video/timing artefact of their repro or an `inDragMode: true` quirk; the code clearly fires it. The mismatch with the group-floating path is real either way.

## Relevant code

All paths inside `packages/dockview-core/src/dockview/dockviewComponent.ts` unless noted.

- **`addFloatingGroup(item, options)` — lines 1210–1426.** Branches on `item instanceof DockviewPanel`:
  - **Panel branch (lines 1222–1238):**
    - L1225: `group = this.createGroup()`
    - L1226: `this._onDidAddGroup.fire(group)` — fires outside any lock.
    - L1228–1234: `movingLock(() => this.removePanel(item, { removeEmptyGroup: true, skipDispose: true, skipSetActiveGroup: true }))` — under the lock, so:
      - The source group's eventual removal (when `group.size === 0` triggers `removeGroup` at `removePanel` line 2444) routes through `super.doRemoveGroup`'s `onDidRemove`, which is gated by `if (!this._moving)` at lines 676–679. Suppressed.
      - The panel removal from the source group goes through `view.model.onDidRemovePanel` -> top-level `_onDidRemovePanel`, also gated by `if (this._moving) return` at lines 3510–3515. Suppressed.
    - L1236–1238: `movingLock(() => group.model.openPanel(item, { skipSetGroupActive: true }))` — `_onDidAddPanel` likewise suppressed (lines 3504–3509).
    - No `_onDidMovePanel.fire(...)` anywhere in this branch — unlike `moveGroupOrPanel`, which fires it at lines 2805, 2845, 2888, 2923, 2951, 2988, 3078, 3378.
  - **Group branch (lines 1239–1276):**
    - Reuses the same `DockviewGroupPanel` object. Calls `doRemoveGroup(item, { skipDispose: true, ... })` at line 1270 — `skipDispose: true` means `_onDidRemoveGroup` is *also* not fired (line 2614–2619 only fires when `!options?.skipDispose`). Then sets `group.model.location = { type: 'floating' }` at line 1419.
    - Because the same group object is preserved, its `group.api.onDidLocationChange`, `onDidActiveChange`, etc. continue to be the same emitters — these are what the reporter observes "firing for group floating".

- **Event-suppression plumbing:**
  - Top-level `_moving` flag and `movingLock()` helper: lines 2695, 2709–2718.
  - Panel-event gating: lines 3504–3528 (`onDidAddPanel`, `onDidRemovePanel`, `onDidActivePanelChange` all early-return when `this._moving`).
  - Group-event gating: lines 671–684 (`_onDidAddGroup`, `_onDidRemoveGroup`, `_onDidActiveGroupChange`).

- **Trigger surfaces (so the bug is reachable in the wild):**
  - `packages/dockview-core/src/dockview/components/titlebar/tabs.ts` lines 695–721: shift+drag on a tab calls `this.accessor.addFloatingGroup(panel as DockviewPanel, { inDragMode: true, ... })` — panel branch. No guard for "is this the last panel in the group".
  - `packages/dockview-core/src/dockview/components/titlebar/tabsContainer.ts` line 290: shift+drag on the title bar (void area) calls `addFloatingGroup(this.group, ...)` — group branch.

- **Public events affected (per `packages/dockview-core/src/api/component.api.ts`):**
  - `onDidAddPanel` (L688), `onDidRemovePanel` (L695), `onDidMovePanel` (L699) — none fire on the panel-floating path.
  - `onDidAddGroup` (L667) — fires.
  - `onDidRemoveGroup` (L674) — does NOT fire (source group destruction suppressed by `movingLock`). This is the specific event the reporter calls out.
  - `onDidAddPanelToTabGroup` / `onDidRemovePanelFromTabGroup` (L796/L803) — also suppressed (lines 3535–3540 forward unconditionally, but the underlying `view.model.onDidAddPanelToTabGroup` fires from `tabGroupViewModel.addPanel`, which goes through `openPanel` under `movingLock`; the model-level emitter still fires, but the *top-level* re-emitters at lines 3535–3540 are NOT gated, so these may actually fire — worth double-checking before fixing). Let me re-read... lines 3535–3540 unconditionally fire `_onDidAddPanelToTabGroup`. So tab-group events likely DO fire. The reporter didn't list those, consistent.

## Recent commits that may have touched this

`git log --since="2024-01-01" -- packages/dockview-core/src/dockview/dockviewComponent.ts` and `git log --grep="floating"`:

- No commit references issue #1025 (`git log --grep="1025"` empty).
- `732117ec3` — feat: extract FloatingGroupModule from DockviewComponent (Phase 1) (refactor only)
- `b7529f68a` — fix(dnd): touch-path correctness
- `5b806f108` — fix: open tab context menu above floating groups
- `be6b2b2fd` — fix: restore pointer events on floating overlays
- `03f12aeed` — fix: hoist floating overlays into shell
- `991bd4401` — fix: prevent edge groups from being floated or popped out
- `3ca12d0e7` — fix: prevent component disappearing when moving from floating to new grid group
- `d8916778c` — fix: prevent ghost group creation when dragging popout groups back to grid

None alter the `movingLock(() => removePanel(...))` block in the panel branch of `addFloatingGroup`, and none add a `_onDidMovePanel.fire(...)` to that branch. The bug is unchanged on master HEAD.

## Verdict

**CONFIRMED_BUG** — the panel branch of `addFloatingGroup` (`packages/dockview-core/src/dockview/dockviewComponent.ts` L1222–1238) wraps the source-group teardown in `movingLock`, suppressing `onDidRemoveGroup`, `onDidRemovePanel`, and `onDidAddPanel` even though the underlying state change *is* "panel moved between groups + source group destroyed". The group branch preserves the same group object so the reporter's group-level listeners keep working; the panel branch leaves observers with no signal that the source group went away or that the panel ended up in a new group.

## Notes / fix sketch

Two reasonable shapes:

1. **Minimal — emit the missing top-level events explicitly inside the panel branch.** After the `movingLock` blocks at lines 1228–1238, fire (in order): `_onDidRemoveGroup` for the source group (if it was actually removed — capture `const sourceGroup = item.group; const sourceGroupWasRemoved = sourceGroup.size === 0 after removePanel`), `_onDidMovePanel.fire({ panel: item, from: sourceGroup })`. `_onDidAddGroup` is already fired at L1226. `_onDidAddPanel` will need either to be fired explicitly here, or — cleaner — change the suppression to only suppress *intermediate* events while still firing a single "panel moved" + "group removed" pair at the end (matches the pattern in `moveGroupOrPanel` at L2805 etc.).

2. **Structural — route the panel branch of `addFloatingGroup` through `moveGroupOrPanel` rather than the bespoke `createGroup` / `removePanel` / `openPanel` sequence.** That function already handles "moving a panel from a group that becomes empty" and fires `_onDidMovePanel` + `doRemoveGroup` (which fires `_onDidRemoveGroup`) consistently. The catch: `moveGroupOrPanel`'s target is a group at a grid `Position`, not a floating overlay, so the call sites would need an "after move, lift this new group into the floating layer" wrapper — equivalent to the current `if (item instanceof DockviewPanel)` branch but composed instead of inlined. Bigger change, but it removes the duplication entirely.

Recommend (1) as the immediate fix and (2) as a follow-up if/when the floating/popout paths are unified.

Edge cases / test additions:
- Add `__tests__/dockview/dockviewComponent.spec.ts` cases under the existing `floating groups` describe asserting event counts for:
  - shift+drag the only tab in a multi-tab group (group survives): `onDidMovePanel` × 1, `onDidAddGroup` × 1, `onDidRemoveGroup` × 0, `onDidAddPanel` × 1 (in the new group), `onDidRemovePanel` × 0 (panel was moved, not removed) — match the semantics of `moveGroupOrPanel`.
  - shift+drag the only tab in a single-tab group (last panel; source group destroyed): same as above plus `onDidRemoveGroup` × 1 for the source.
  - shift+drag the group title bar: `onDidAddGroup` × 0, `onDidRemoveGroup` × 0, `onDidMovePanel` × 0, only the group's `api.onDidLocationChange` fires (this is today's behaviour and the spec it should still match).
- Don't forget the `popoutReferenceGroup` sub-branch in the group-path (lines 1242–1268): it currently fires no `onDidMoveGroup`-style event for the "popout group becomes floating in original window" transition. Out of scope for this issue but worth noting for any follow-up.
- The reporter's comment about #753 is about a separate request (intercept-before-close so the group can be hidden instead of destroyed). That is a feature request, not part of #1025.
