# Issue #954 — onDidActivePanelChange is called after calling fromJSON

- URL: https://github.com/mathuo/dockview/issues/954
- Filed against version: 4.4.0 (regression from 4.2.3)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary

User reports a behaviour regression: in dockview 4.2.3, calling `api.fromJSON(...)`
did not trigger the `onDidActivePanelChange` event, but starting in 4.4.0 the
event fires once per panel activation during deserialization. The reporter
expects the event to remain silent during `fromJSON` (since these activations
are not user-driven) and asks whether the new behaviour is intentional.

## Reproduces on master?

**Yes — code analysis confirms the event still fires on master HEAD
(dockview-core 6.2.2).**

`DockviewComponent.fromJSON` deserializes panels with two distinct activation
paths, and neither suppresses `onDidActivePanelChange`:

1. For each group, `createGroupFromSerializedState` calls
   `group.model.openPanel(panel, { skipSetActive: !isActive, skipSetGroupActive: true })`
   at `dockviewComponent.ts:1962-1966`. When `isActive === true` (the panel
   matches the serialized `activeView`), `skipSetActive` is `false`, so
   `dockviewGroupPanelModel.doSetActivePanel(panel)` runs and the group-level
   `_onDidActivePanelChange` emitter fires (`dockviewGroupPanelModel.ts:1594`).
   This call is **not** wrapped in `movingLock`, so when the event bubbles to
   the component-level listener at `dockviewComponent.ts:3516-3528`, the
   `this._moving` guard is false and the public emitter fires.

2. After the gridview is deserialized, `fromJSON` calls
   `doSetGroupAndPanelActive(panel)` at `dockviewComponent.ts:2126-2131` for
   the serialized `activeGroup`. That method (lines 3409-3428) checks
   `!this._moving && activePanel !== this._onDidActivePanelChange.value` and
   fires `_onDidActivePanelChange`. Again, no `movingLock` wraps this call.

The `reuseExistingPanels` path *is* protected by `movingLock` at lines
1955-1960, but that only suppresses the bubbling listener; it doesn't cover
the un-reused path (the common case) or the final `doSetGroupAndPanelActive`
on the active group.

## Relevant code

- `packages/dockview-core/src/dockview/dockviewComponent.ts:1829-2182`
  `fromJSON` implementation.
- `packages/dockview-core/src/dockview/dockviewComponent.ts:1962-1966`
  `openPanel({ skipSetActive: !isActive, skipSetGroupActive: true })` — fires
  the group emitter when `isActive` is true; not wrapped in `movingLock`.
- `packages/dockview-core/src/dockview/dockviewComponent.ts:2126-2131`
  Final `doSetGroupAndPanelActive(panel)` for the serialized `activeGroup` —
  also not wrapped in `movingLock`.
- `packages/dockview-core/src/dockview/dockviewComponent.ts:3409-3428`
  `doSetGroupAndPanelActive` / `doSetGroupActive` fire
  `_onDidActivePanelChange` when `!_moving`.
- `packages/dockview-core/src/dockview/dockviewComponent.ts:3516-3528`
  Bubbler from per-group emitter to the public `_onDidActivePanelChange`;
  also guarded only by `_moving`.
- `packages/dockview-core/src/dockview/dockviewGroupPanelModel.ts:1575-1598`
  `doSetActivePanel` — fires the group-level `_onDidActivePanelChange`
  unconditionally when the active panel changes.
- `packages/dockview-core/src/dockview/dockviewComponent.ts:2709-2718`
  `movingLock` — the only suppression mechanism for these events; there is no
  separate "deserializing" flag.

## Recent commits that may have touched this

`git log --since="2024-01-01" -- packages/dockview-core/src/dockview/dockviewComponent.ts`
shows many edits, but none specifically address suppression of
`onDidActivePanelChange` during `fromJSON`. Recent fromJSON-adjacent work
includes `669148530` (attach "always" renderer panels during fromJSON,
issue #1109) and `48ed91977` (fromJSON tidy), neither of which touches event
suppression. A `-S "doSetGroupAndPanelActive"` search shows it was introduced
during the "events system" refactor (`3c747aa4a`, `807ccf80d`) — i.e. the
4.4.0 timeframe — which is consistent with the reporter saying the regression
started in 4.4.0.

## Verdict

**CONFIRMED_BUG**

The event is still fired during `fromJSON` on master. The behavioural
regression from 4.2.3 → 4.4.0 was never reverted, and there is no
"deserializing" or "loading" flag that suppresses
`onDidActivePanelChange` for the duration of `fromJSON`.

## Notes / fix sketch

Two viable approaches:

1. **Wrap the activation paths in `movingLock`.** Wrap the non-existing-panel
   `openPanel` call at `dockviewComponent.ts:1962-1966` and the final
   `doSetGroupAndPanelActive` call at lines 2126-2131 in `this.movingLock(...)`.
   The existing bubbler/`doSetGroupAndPanelActive` already check `this._moving`,
   so this is a minimal change. The internal active-panel state still updates
   correctly; only the public emitter is silenced. After `fromJSON` finishes,
   `_onDidActivePanelChange.value` will already be the right panel so no
   spurious deferred fire is needed.

2. **Introduce a dedicated `_deserializing` flag.** Slightly cleaner
   semantically — `movingLock` is overloaded for DnD/moves. Set the flag at
   the top of `fromJSON`, clear it in `finally`, and OR it with `_moving` in
   the two guard checks (`dockviewComponent.ts:3402-3406`, `3422-3427`, and
   `3517`).

Either way, decide whether the event SHOULD fire exactly once after `fromJSON`
completes (e.g. to inform consumers of the new active panel). If yes, fire it
explicitly at the tail of `fromJSON` if `activePanel !== _onDidActivePanelChange.value`,
mirroring what's already done in `doRemoveGroup` (line 2686-2690). This was
likely the intent of the original 4.2.3 behaviour — silent during load, but
the listener can read `api.activePanel` afterward.

Complexity: low. Tests to add: assert that an `onDidActivePanelChange` listener
attached *before* `fromJSON` receives zero (or at most one) events during
deserialization of a layout containing multiple groups and panels.
