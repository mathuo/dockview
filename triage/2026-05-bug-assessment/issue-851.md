# Issue #851 — Duplicate popouts when page is refreshed

- URL: https://github.com/mathuo/dockview/issues/851
- Filed against version: 3.0.2
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary

After opening a popout group, saving the layout to localStorage, then refreshing the page,
two popout windows end up open instead of one. The reporter's reproduction
(https://github.com/borglin/dockview-popout-repro) uses `<StrictMode>` and `DockviewReact`,
and they correctly diagnosed that `onReady` fires twice in dev under StrictMode — each
invocation calls `api.fromJSON(layout)`, and the first invocation's popout-restoration
work is not cancelled before the second invocation runs.

## Reproduces on master?

**Likely yes (code analysis only).** The deserialization path in
`packages/dockview-core/src/dockview/dockviewComponent.ts` still schedules popout-window
creation via `setTimeout`, and the timeout callback does not check whether the component
has been disposed before opening a new browser window. Under React 18+ StrictMode (or
any double-invocation of `fromJSON` across two consecutive component instances), this
leads to a second `window.open` call with a fresh target name (each component instance
gets its own sequential `_id`), producing a second popout window.

## Relevant code

- `packages/dockview-core/src/dockview/dockviewComponent.ts:2085-2120` — the popout
  restoration loop inside `fromJSON`. Each serialized popout is created inside a bare
  `setTimeout(..., index * DESERIALIZATION_POPOUT_DELAY_MS)` with no cancellation token
  and no `this.isDisposed` guard before calling `addPopoutGroup`.
- `packages/dockview-core/src/dockview/dockviewComponent.ts:446` / `:515-516` — the
  `_popoutRestorationPromise` field that the timeouts feed into. It is read-only; there
  is no `cancel()` or cleanup hook tied to component disposal.
- `packages/dockview-core/src/dockview/dockviewComponent.ts:717-734` — the component's
  main `dispose()` disposable. It iterates `_popoutGroups` to close already-tracked
  popout windows, but it does NOT clear any pending `setTimeout` IDs from the
  restoration loop — those timeouts continue to fire and call `addPopoutGroup` on an
  effectively-disposed component.
- `packages/dockview-core/src/popoutWindow.ts:112` — `window.open(url, this.target,
  features)`, with `target = `${componentId}-${groupId}``. Because
  `_id = nextLayoutId.next()` (`packages/dockview-core/src/gridview/baseComponentGridview.ts:86`)
  is sequential per component instance, the StrictMode re-mount produces a *different*
  target name, so the browser opens a brand-new window rather than reusing the existing
  one. That is what makes the bug visible as "two popouts" rather than the popout
  silently re-binding.
- `packages/dockview/src/dockview/dockview.tsx:129-227` — the React effect with `[]`
  dependencies that creates the API, calls `onReady`, then disposes on cleanup.
  Under StrictMode the cleanup→remount cycle runs synchronously after the first commit,
  but the popout-restoration timers from the first instance survive the dispose.

## Recent commits that may have touched this

`git log --since="2024-01-01" -- packages/dockview-core/src/dockview/dockviewComponent.ts`
and `--grep="popout"` show:

- `0a19313cc` — "bug: delay popup opens when deserializing" (Jul 31 2025): introduced
  the `setTimeout`-based staggered restoration and `_popoutRestorationPromise`. This is
  the commit that created the exact code path responsible for the bug.
- `874d6a27c` — "chore: use constant" (refactor of the delay constant).
- `a8586dc08`, `eda3afa3b`, `d8916778c`, `05196fd86` — other popout fixes, none of
  which touch the restoration-loop cancellation behavior.

No commit since the issue was filed (2025-05) addresses the StrictMode / double-onReady
duplicate-popout case.

## Verdict

**CONFIRMED_BUG**

## Notes / fix sketch

Two complementary fixes, in increasing order of effort:

1. **Guard the timeout callback** (minimal, sufficient for the reporter's StrictMode
   case): wrap the `setTimeout` body with `if (this.isDisposed) { resolve(); return; }`,
   and store the timer IDs in a `MutableDisposable`/array that the component-level
   `Disposable.from(...)` block at `dockviewComponent.ts:717` clears. That prevents the
   first instance's queued popout from opening after `api.dispose()` runs.

2. **Idempotent target reuse across `fromJSON` calls** (defensive, handles non-React
   callers and double-`fromJSON` on the same instance): when restoring a popout whose
   `groupId` already corresponds to a tracked popout group, either skip or replace the
   existing entry instead of opening a second one. Also consider using a stable target
   name (e.g. layout-id-from-serialized-state rather than the live component's
   sequential `_id`) so that `window.open` actually reuses the existing popout when
   restoring into a fresh component.

Edge cases to keep in mind:

- The reporter's `App` also calls `api.clear()` before `fromJSON`, which currently does
  not touch pending restoration timers either — same fix applies.
- `popoutRestorationPromise` is documented as a test-only helper; tightening its
  semantics (resolves only when timeouts have either fired or been cancelled) would let
  the existing tests at `packages/dockview-core/src/__tests__/dockview/dockviewComponent.spec.ts:7056`
  and `:7495` continue working unchanged.
- Complexity: small — ~10-line change in `fromJSON` plus disposal wiring.
