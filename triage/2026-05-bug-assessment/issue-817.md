# Issue #817 — Floating groups can be enlargened beyond the Dockview / screen boundary

- URL: https://github.com/mathuo/dockview/issues/817
- Filed against version: 2.1.4 (user repo) / 3.0.0 (codesandbox demo)
- Investigated: 2026-05-16
- Investigated by: claude-opus-4-7

## Summary
When click-and-dragging a floating group's resize handle (border) past the edge of
the dockview container, the float continues to grow beyond the container/viewport,
leaving its controls inaccessible. Moving (rather than resizing) the float is
correctly bounded; only resize was unbounded. Expected: resize should stop once the
dragging edge hits the container border.

## Reproduces on master?
**No — fixed.** The unbounded resize clamps were replaced with container-relative
maximums on 2025-10-31 in commit `966137ca4` ("fix: clamp logic to not allow
negative positions to avoid runaway width/height calculations"). The fix is an
ancestor of both `master` HEAD and the `v6.2.2` release tag (`chore(release):
publish v6.2.2` is commit `208abc777`).

## Relevant code
`packages/dockview-core/src/overlay/overlay.ts` — `setupResize()` (lines 404-624).
The four inner helpers `moveTop` / `moveBottom` / `moveLeft` / `moveRight` compute
the new edge position and dimension on every `pointermove`:

- `moveTop` (lines 462-487): clamps `top = clamp(y, 0, maxTop)` so the top edge
  can no longer go negative (i.e. above the container top) — this prevents the
  group from extending upward beyond the container. `maxTop` keeps `MINIMUM_HEIGHT`
  inside.
- `moveBottom` (lines 489-509): now clamps `height = clamp(y - top, minHeight,
  maxHeight)` with `maxHeight = containerRect.height - Math.max(0, top)` — the
  height can no longer exceed the container.
- `moveLeft` (lines 511-536): clamps `left = clamp(x, 0, maxLeft)` — prevents
  extension past the container's left edge.
- `moveRight` (lines 538-558): clamps `width = clamp(x - left, minWidth,
  maxWidth)` with `maxWidth = containerRect.width - Math.max(0, left)` — the width
  can no longer exceed the container.

Before commit `966137ca4`, `moveBottom` / `moveRight` used
`clamp(..., minWidth/Height, Number.MAX_VALUE)` and `moveTop` / `moveLeft` used
`clamp(..., -Number.MAX_VALUE, max...)` — that is what produced the runaway
oversize behaviour the reporter observed.

(Note: `setBounds()` at lines 128-208 only clamps the anchor offsets — `top`,
`bottom`, `left`, `right` — and trusts the caller-supplied `width`/`height`.
That is fine because all interactive resize paths flow through `setupResize`
which now clamps `width`/`height` directly. The companion request for a
clip-on-window-resize / clip-to-viewport option is tracked separately in
issue #1018.)

## Recent commits that may have touched this
`git log --since="2024-01-01" -- packages/dockview-core/src/overlay/`:

- `966137ca4` 2025-10-31 — **the fix** (replaced `Number.MAX_VALUE` clamps with
  container-relative bounds).
- `bd895d2b7` — refactor: added comments to the resize helpers.
- `586b770ce` — nx: format.
- `a9a23cb85`, `19d7430f6`, `be6b2b2fd`, `03f12aeed`, `88dc78419`, `7160f7435`,
  `9cd10fe55`, `1fa8a6112`, `414244cc8` — unrelated (render-overlay
  visibility, stacking context, Angular teardown, context menu, Windows
  shaking).

## Verdict
**LIKELY_FIXED** — commit `966137ca4` (released in v6.2.0 / present in v6.2.2)
directly addresses the runaway resize. Ask the reporter to re-test against
`dockview-core@^6.2.2`.

## Notes / fix sketch
No further code change required for the resize-clamp bug.

Possible follow-ups (out of scope for #817 itself):
- The clamp uses `containerRect` at `pointermove` time; if the container is
  itself smaller than the float at the moment resize starts (e.g. window was
  resized while the float was open), the float can already be larger than the
  container. The new clamps just prevent it from growing further. A "clip the
  float when the window shrinks" behaviour would be the feature ask of #1018.
- `setBounds()` does not clamp `width`/`height` against `containerRect`. All
  current interactive paths feed it already-clamped values, but any external
  caller setting bounds programmatically could still oversize the float. Not
  required for #817, worth noting if a defence-in-depth pass is desired.
