# Issue #734 — Overlay for dropping stays visible if dragging panel over scrollbar (Firefox)

- URL: https://github.com/mathuo/dockview/issues/734
- Filed against version: 1.17.2
- Investigated: 2026-05-16
- Investigated by: Claude (opus 4.7)

## Summary

In Firefox, dragging a panel so that the cursor crosses the panel content's
vertical scrollbar leaves the split/drop overlay stuck in its last position
even though the cursor has effectively left the drop zone. The reporter
expects the overlay to clear as the cursor exits the activation zone. Not
reproducible in Chrome.

## Reproduces on master?

**Likely yes (code analysis only).**

The drop-overlay clear path is gated entirely by HTML5 `dragleave`. Master
HEAD's `DragAndDropObserver` only fires its `onDragLeave` callback when
`this.target === e.target` (`packages/dockview-core/src/dnd/dnd.ts:37-43`).
Firefox has a long-standing quirk where moving the cursor onto a native
scrollbar:

- Does not fire `dragenter` for any new target (the scrollbar is not a DOM
  node), so `this.target` keeps pointing at the original content element.
- Often fires `dragleave` with `e.target` being the document/window
  rather than the originally entered element, OR fires nothing at all until
  the cursor re-enters a different drop target.

The result is that `onDragLeave` is never invoked, `removeDropTarget()`
(`droptarget.ts:686`) is never called, and the previously-shown overlay
stays on screen. There is no compensating logic — no `dragover` bounds
check, no document-level `dragend` poll, no scrollbar-pseudo-element
filter — anywhere in `droptarget.ts` or `dnd.ts`.

The HTML5-to-pointer-event unification (commit `48364a8e3`, "remove HTML5
internal drag, unify on pointer events") that would have side-stepped this
quirk for internal drags is **not yet on master**; master HEAD's dockview-
core@6.2.2 still receives all panel drags via HTML5 DnD.

## Relevant code

- `packages/dockview-core/src/dnd/dnd.ts:37-43` — `DragAndDropObserver.onDragLeave`; the
  `this.target === e.target` gate is the choke point. In Firefox's
  scrollbar case, `e.target` is not the same node as `this.target`, so the
  callback never fires.
- `packages/dockview-core/src/dnd/dnd.ts:54-94` — listener registration.
  `dragenter` / `dragover` are bound with capture; `dragleave` is bound
  without capture. Nothing watches `dragend` on `document` or `window` for
  out-of-bounds detection.
- `packages/dockview-core/src/dnd/droptarget.ts:353-361` — `onDragLeave`
  callback simply calls `removeDropTarget()`. Never reached when the leave
  gate above fails.
- `packages/dockview-core/src/dnd/droptarget.ts:253-352` — `onDragOver`.
  Could be the natural place to add an in-bounds re-check, but no such
  check exists today. `e.clientX` / `e.clientY` are read only to compute
  the quadrant.
- `packages/dockview-core/src/dnd/droptarget.ts:686-696` — `removeDropTarget`,
  the single overlay-clear path.
- `packages/dockview-core/src/dockview/components/panel/content.ts:62-95` —
  shows that the `dv-content-container` (which renders the user's React
  content and therefore hosts the offending scrollbar) is itself the
  droptarget element, so the scrollbar literally lives on the same element
  whose `dragleave` we depend on.

## Recent commits that may have touched this

`git log --since="2024-01-01" -- packages/dockview-core/src/dnd/`:

- `dd59240e0` format
- `877f3baf6`, `214abb1bb`, `a663d0640`, `8cb7c94cf`, `d418e6e3f` — line
  indicator / `dndTabIndicator` theme work; CSS-only behavior.
- `e8e6ed0be` — tab drop overlay left/right + insertion index; tab-only.
- `1fa8a6112` — "fix Windows shaking issue and implement GPU optimizations";
  introduced `setGPUOptimizedBounds` / `checkBoundsChanged`. Performance
  only — no event-handling changes.
- `97d9bcc90` — guards drag events when `disableDnd=true`. Orthogonal.
- `6d2f2f101` — ghost image rendering. Orthogonal.
- `d811ca655` — "improved dnd model". Pre-dates the issue; no scrollbar
  handling added.

None of the post-filing commits touched the `dragleave` gate or added any
scrollbar / out-of-bounds compensation.

## Verdict

**CONFIRMED_BUG** — code analysis shows the `dragleave` gate
(`dnd.ts:38`) is still the sole overlay-clear trigger on master, and no
scrollbar / bounds compensation has been added. The Firefox-specific
behavior the reporter describes still applies on dockview-core@6.2.2.

## Notes / fix sketch

Options, cheapest-first:

1. **Add a `dragover` bounds re-check in `Droptarget.onDragOver`.** When
   `(e.clientX, e.clientY)` falls outside the cached `rect` from
   `getBoundingClientRect()` (or outside the element's
   `clientWidth`/`clientHeight` — i.e. the content-box, excluding the
   scrollbar gutter), call `this.removeDropTarget()` and bail. This costs
   one rect read per `dragover` (which we already do) and fixes the
   scrollbar case for free because Firefox keeps firing `dragover` on the
   underlying element while the cursor is on the scrollbar.
2. **Loosen the `dnd.ts:38` gate.** Track the most recently entered
   element via `dragenter` (already done) but also clear on any
   `dragleave` where `relatedTarget` is null or outside `this.element`.
   This is what VS Code's `DragAndDropObserver` (the inspiration for this
   class) actually does.
3. **Document-level `dragover` listener that hides all overlays when the
   cursor leaves any registered droptarget.** Heavier; needed only if the
   first two don't cover popout / iframe edge cases.

Option 1 is the smallest, safest change; complexity ~10 lines. The
`clientWidth` vs `offsetWidth` distinction matters — `clientWidth` excludes
the scrollbar, so testing `e.clientX - rect.left > target.clientWidth`
detects the cursor sitting on the scrollbar.

Note: the long-term path (HTML5 → pointer events, commit `48364a8e3` on a
future branch) eliminates this entire class of bug for internal drags, but
the bug will still exist on master until that lands, and external HTML5
drops onto dockview surfaces will still suffer the quirk even afterward.
