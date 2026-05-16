# Issue #674 — maximize() does not take effect on a floating group

- URL: https://github.com/mathuo/dockview/issues/674
- Filed against version: unspecified (issue filed 2024; predates 1.x rename / popout-groups feature was still recent)
- Investigated: 2026-05-16
- Investigated by: Claude Opus 4.7 (1M)

## Summary

The reporter calls `group.api.maximize()` on a floating group and expects the floating group to enter the maximized-view state (or at minimum be brought to the front / cover the dock). Instead nothing happens at all — the call is a silent no-op. The issue is labelled `enhancement` on GitHub but the wording ("does not take effect") and the public API surface (a `maximize()` method that exists on `dockviewGroupPanelApi` and accepts the call without error) match the shape of a bug: the API silently fails rather than throwing, warning, or doing the expected thing.

## Reproduces on master?

**Yes (code analysis).** The behaviour is explicit and unchanged on master HEAD (v6.2.2). `DockviewGroupPanelApiImpl.maximize()` at `packages/dockview-core/src/api/dockviewGroupPanelApi.ts:179-190` early-returns whenever `this.location.type !== 'grid'`:

```ts
maximize(): void {
    if (!this._group) {
        throw new Error(NOT_INITIALIZED_MESSAGE);
    }

    if (this.location.type !== 'grid') {
        // only grid groups can be maximized
        return;
    }

    this.accessor.maximizeGroup(this._group);
}
```

`DockviewGroupLocation` (`packages/dockview-core/src/dockview/dockviewGroupPanelModel.ts:218-222`) is one of `{ type: 'grid' | 'floating' | 'popout' | 'edge' }`. A floating group has `location.type === 'floating'`, so the call falls through the early return and nothing happens. No `console.warn`, no thrown error, no event — exactly the "silent no-op" the reporter describes.

The guard is necessary at this layer because the implementation it would otherwise delegate to (`baseComponentGridview.maximizeGroup` → `gridview.maximizeView`, at `packages/dockview-core/src/gridview/baseComponentGridview.ts:257` and `packages/dockview-core/src/gridview/gridview.ts:426`) calls `getGridLocation(view.element)` on the assumption that the view is mounted in the gridview tree. Floating groups are hoisted into the overlay layer (`packages/dockview-core/src/overlay/`) and are not part of the gridview tree at all, so the underlying maximize path simply cannot operate on them — there is no LeafNode to hide all siblings of.

So the answer to the workflow's options is **(c) explicitly returns early for floating** (and for popout / edge by the same guard), and the behaviour is identical on master.

## Relevant code

- `packages/dockview-core/src/api/dockviewGroupPanelApi.ts:179-190` — `maximize()` early-return.
- `packages/dockview-core/src/api/dockviewGroupPanelApi.ts:92-96` — `location` getter (`return this._group.model.location`).
- `packages/dockview-core/src/api/dockviewGroupPanelApi.ts:192-208` — `isMaximized()` / `exitMaximized()` (no equivalent floating guard, but `accessor.isMaximizedGroup` simply compares with `gridview.maximizedView()` which will never equal a floating group, so they read as "false" / "no-op" rather than failing).
- `packages/dockview-core/src/dockview/dockviewGroupPanelModel.ts:218-222` — `DockviewGroupLocation` union (`grid` | `floating` | `popout` | `edge`).
- `packages/dockview-core/src/gridview/baseComponentGridview.ts:257-272` — `maximizeGroup` / `isMaximizedGroup` / `exitMaximizedGroup` / `hasMaximizedGroup`; all route through `this.gridview.*`, which assumes a tree-mounted view.
- `packages/dockview-core/src/gridview/gridview.ts:426-469` — `maximizeView` implementation: walks the BranchNode tree and hides every LeafNode that isn't the maximized one. Has no notion of "overlay" groups.
- `packages/dockview-core/src/dockview/dockviewComponent.ts:3409-3428` — `doSetGroupAndPanelActive` exits the maximized group when a *different* group becomes active. Note: if a floating group becomes active while a grid group is maximized, this calls `exitMaximizedGroup()`. So the existing behaviour with floating groups today is "interacting with a floating group while another group is maximized exits the maximized state". This is consistent with treating floating as "not maximizable".
- `packages/dockview-core/src/overlay/overlay.ts:33-34` — floating overlay z-index is `calc(var(--dv-overlay-z-index, 999) + ${i * 2})`, ordered by insertion / focus order. There is no "fill the dock area" mode for an overlay; an overlay always renders at its `(left, top, width, height)`.
- `packages/dockview-core/src/api/dockviewPanelApi.ts:188-190` — `DockviewPanelApi.maximize()` delegates straight to `this.group.api.maximize()`, so calling maximize from a panel that lives in a floating group hits the same guard and silently no-ops.

## Recent commits that may have touched this

`git log --grep="maximize"` and `git log -S "only grid groups can be maximized" -- packages/dockview-core/src/api/dockviewGroupPanelApi.ts`:

- `b222de86f` — feat: enhance maximize group api methods (introduced the API methods).
- `105be3661` — feat: popout groups (2024-01-08). **This is the commit that added the `if (this.location.type !== 'grid') return;` early-return.** When popout / floating locations were generalized, the existing maximize call (which would have blown up on `getGridLocation`) was guarded with a silent return. Issue #674 was filed against the resulting behaviour.
- `2f4150013` — feat: serialization of maximized views.
- `6b2ed70a7` — bug: maximized group must be active.
- `da269aa71` — feat: do not persist maximized view state.
- `c7d774930` — test: maximize view cleanup.
- `bd2d8d7bf` — feat: maximized groups (original implementation).

Nothing touches the guard or adds a floating-group maximize implementation. The behaviour is the same on master HEAD as on the day the issue was filed.

## Verdict

**CONFIRMED_BUG** — the API call is silently swallowed. The current behaviour fits the workflow's option (c): an explicit `if (this.location.type !== 'grid') return;` early-return at `packages/dockview-core/src/api/dockviewGroupPanelApi.ts:184-187`. Whether the fix is "make floating groups actually maximize" (feature work) or "throw / warn so callers know the call is unsupported" (small correctness fix), the current "accept-and-do-nothing" shape is wrong and matches the reporter's observation precisely.

Note: GitHub-labelled `enhancement`, but the issue body says "does not take effect" — the user clearly expected the API to work, and the API accepts the call without complaint. The silent-no-op behaviour is the bug; the question is what the correct behaviour should be.

## Notes / fix sketch

There are two reasonable resolutions, depending on product intent:

**(A) Minimal correctness fix — make the failure mode loud.** Replace the silent return with either a `console.warn` (preferred — keeps the call non-throwing for callers that don't know the location) or a thrown error matching the `NOT_INITIALIZED_MESSAGE` style above it. Trivial change. Same applies to `isMaximized()` / `exitMaximized()` for consistency. Also worth doing for the popout and edge cases.

**(B) Make floating groups maximizable.** This is the request the reporter actually wants. There is no single "maximized view" concept that fits a floating overlay, because the gridview's maximize implementation works by hiding sibling LeafNodes in the gridview tree — a floating group has no siblings in that tree. A faithful implementation would need to:

1. Add a separate "maximized floating overlay" state on `DockviewComponent` (e.g. `_maximizedFloatingGroup: DockviewGroupPanel | undefined`) — distinct from `gridview._maximizedNode`, since the two state machines don't overlap cleanly.
2. When entering the state, expand the floating overlay's container to fill the dock area (`left: 0; top: 0; width: 100%; height: 100%`) and bump its z-index above all other overlays. The overlay machinery at `packages/dockview-core/src/overlay/overlay.ts` already does z-index ordering by index in `_orderedList`; the maximize state would need to override `position`/dimensions and either set a much larger z-index or move the overlay element to the end of `_orderedList`.
3. Hook `doSetGroupAndPanelActive` (currently at `dockviewComponent.ts:3409-3428`) so the new floating-maximized state is exited symmetrically (e.g. when another group becomes active, or when the user docks the floating group back into the grid, or when the floating group is closed).
4. Wire `isMaximized` / `exitMaximized` / `hasMaximizedGroup` to also report on the floating state (the existing call sites all check `hasMaximizedGroup` — they will need to ask the union of "grid maximized" and "floating maximized").
5. Decide on serialization semantics: today `gridview.toJSON` writes `maximizedNode` with a grid location path; a floating-maximized state would need either a separate field (`maximizedFloatingGroupId`) or to be deliberately not persisted (consistent with `da269aa71` which originally chose "do not persist maximized view state" — that decision was reversed in `2f4150013`, but for grid only).
6. Popout groups should remain unsupported — they live in a separate window and have no meaningful "maximize within the host window" interpretation. Edge groups (fixed/edge panels) likewise.

**Recommended path:** ship (A) as a small fix on its own (so the API stops lying to callers), then track (B) as a separate feature on the roadmap. (A) by itself probably resolves the user pain reported in #674 — they will get a console warning telling them maximize doesn't work on floating groups, and can either call `group.api.moveTo({ position: 'center' })` first to dock the group, or live without it. (B) is a non-trivial feature add and should be triaged on its own merits, not as a fix for #674.

**Test additions:**
- `__tests__/dockview/dockviewComponent.spec.ts` — add a case under the existing `maximized group` describe at line 7618: float a group, call `group.api.maximize()`, assert that (today) `hasMaximizedGroup()` is still `false` and `console.warn` was called. After (B) lands, change the assertion to `hasMaximizedGroup()` is `true` and the overlay covers the dock.
- Add cases for popout and edge groups returning the same `warn`-and-no-op shape (today they hit the same guard).
- Symmetric case: maximize a grid group, then float a different group, then activate the floating group — assert `_maximizedNode` is cleared (this already works via `doSetGroupAndPanelActive`, but isn't currently covered).
