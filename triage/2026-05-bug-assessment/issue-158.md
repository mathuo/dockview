# Issue #158 — [Bug?] Dockview does not resize on restoring window from maximized in flexbox

- URL: https://github.com/mathuo/dockview/issues/158
- Filed against version: unspecified (Sept 2022 — pre-v1.x)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7, 1M context)

## Summary
Reporter wraps `DockviewReact` in a `div` with `flex-grow: 1` and a sibling above. After maximizing the window then restoring it, dockview keeps its previous (maximized) size and the page gains extra scrollbars. With `height: calc(100% - 31px)` instead of flex-grow, the bug does not manifest. In the issue thread the maintainer suggested adding `overflow: hidden` to the parent container; the reporter confirmed in the second comment that this fixed the problem and produced a working sandbox. The reporter then asked whether the workaround indicated a deeper bug.

## Reproduces on master?
No — this was never a dockview bug. It is the well-known CSS flexbox feedback loop: a flex item with `flex-grow: 1` that contains overflowing content (the dockview's internal panels) will grow the parent flex container's content box, which then prevents the flex item from shrinking back when the cross/main axis shrinks (the parent's intrinsic content size becomes the floor). Adding `overflow: hidden` (or `min-height: 0` / `min-width: 0`) to the flex item breaks the feedback loop and lets `flex-grow` actually constrain the dimensions on restore.

Dockview itself listens for box-size changes via a `ResizeObserver` attached to its outer element (see "Relevant code" below). That observer fires for any box-size change regardless of how it was triggered (window resize, parent flex relayout, CSS changes, etc.) — it does not rely on window resize events. So if the host's parent element actually resizes on window restore, dockview observes and re-layouts. In the reporter's case, the parent's box was *not* shrinking because of the flexbox/overflow interaction, so there was simply nothing for dockview to observe.

## Relevant code
- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dom.ts:38-62` — `watchElementResize()`: thin `ResizeObserver` wrapper with `requestAnimationFrame` debouncing (and the well-known "ResizeObserver loop limit exceeded" mitigation).
- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/resizable.ts:22-81` — `Resizable` base class. Constructor wires `watchElementResize(this._element, ...)` and calls `this.layout(width, height)` when the rounded `contentRect` dimensions change. Guards against zero-size cases (`offsetParent === null`, `!isInDocument`) so a `display: none` ancestor does not propagate a (0, 0) layout.
- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/gridview/baseComponentGridview.ts:161-216` — `BaseGrid` constructor: `super(document.createElement('div'), options.disableAutoResizing)` ties `DockviewComponent`/`GridviewComponent`/`SplitviewComponent`/`PaneviewComponent` into the `Resizable` ResizeObserver path. The element is sized `100%/100%` (lines 163-164), so it shrinks with its parent if the parent shrinks.
- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/options.ts:99` — public `disableAutoResizing` option (documented as "Disable the auto-resizing which is controlled through a `ResizeObserver`").
- Auto-resize via `ResizeObserver` was originally added in the React wrappers in commit `64c24dca5` (Dec 2020) — **before** issue #158 was filed — so even at the time of the report, dockview was using `ResizeObserver`, not window resize events.

## Recent commits that may have touched this
Resize-detection path commits (most recent first; nothing changes the underlying mechanism, all are refinements):
- `5012a663e` fix(core): break resize loop from sub-pixel jitter (#1219) — rounds contentRect to integers in `Resizable` to absorb fractional `devicePixelRatio` jitter.
- `a6bafcc06` feat: short-circuit resize calls when `display: none` — added the `offsetParent === null` guard.
- `5e45b9a46` bug: resizable should work within shadow DOM.
- `126d01ede` bug: fix `disableAutoResizing` flag.
- `19595f3b1` bug: skip resize for unmounted elements — added the `isInDocument` guard.
- `d847f18cd` feat: move `resizeObserver` logic into dockview-core (Mar 2023) — consolidated the per-framework hooks (`dockview.tsx`, `gridview.tsx`, `paneview.tsx`, `splitview.tsx`) into the core `Resizable` base class. Functionally equivalent, just relocated.
- `64c24dca5` feat: autoresize views (Dec 2020) — original introduction of `ResizeObserver` in the React wrappers.

None of these commits address a flexbox-restore bug per se, because there isn't one to fix in dockview's code.

## Verdict
**NOT_A_BUG** — user-side CSS issue (flexbox + overflowing content prevents the flex container from shrinking). The reporter himself confirmed in-thread that the maintainer's `overflow: hidden` workaround resolved the problem. Dockview's resize detection is a `ResizeObserver` on its outer element and has been since Dec 2020 (before this report was filed), so it will pick up any genuine box-size change.

## Notes / fix sketch
No code fix needed. If we want to be proactive about preventing user confusion:
- The docs page on auto-resizing (`packages/docs/docs/basics`, the page the reporter cited) could add a "Common gotcha" callout: *"When placing dockview inside a flex item, set `overflow: hidden` (or `min-width: 0` / `min-height: 0`) on the flex item. Without this, content inside dockview can push the flex container wider/taller than the viewport, and the flex item will not shrink back when the viewport shrinks."* This is a generic CSS flexbox gotcha but it bites dockview users specifically because panels often contain scrolling content.
- The `DockviewReact`/`DockviewVue`/`DockviewAngular` wrappers already set `width: 100%; height: 100%` on the host element. Adding an automatic `overflow: hidden; min-width: 0; min-height: 0` to the inner `.element` (already created in `BaseGrid` constructor at line 162) would defend against this without breaking any documented use case — the inner gridview already manages its own clipping. Low-risk hardening if we want to close this class of confusion forever; otherwise the docs note is sufficient.
- This issue can simply be closed with a pointer to the resolved-by-workaround comment thread.
