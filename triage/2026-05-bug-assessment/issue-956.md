# Issue #956 — Separator obscures panel content

- URL: https://github.com/mathuo/dockview/issues/956
- Filed against version: unspecified (filed 2025-06-30)
- Investigated: 2026-05-16
- Investigated by: claude-opus-4-7[1m]

## Summary

The 1px separator between views (rendered as a `::before` pseudoelement on every non-first `.dv-view`) is painted on top of panel content. The reporter added a 1px red border around their panel content and observed that on every panel except the first, the edge adjacent to the separator (left for horizontal layouts, top for vertical) is hidden behind the separator. They want the view container's size/position to account for the separator so panel content occupies only visible pixels.

## Reproduces on master?

Yes — confirmed by code inspection. The separator is painted as an absolutely-positioned 1px pseudo-element at `top:0; left:0` of every `.dv-view` after the first, with `z-index: 5` and `pointer-events: none`. The `.dv-view` is `position: absolute` and its `width`/`height` set by `layoutViews()` does **not** subtract a separator allowance, so the pseudoelement physically overlaps the first row/column of pixels inside that view's content container.

## Relevant code

- `packages/dockview-core/src/splitview/splitview.scss:152-162` — the offending CSS rule:
  ```scss
  &.dv-separator-border {
      .dv-view:not(:first-child)::before {
          content: ' ';
          position: absolute;
          top: 0;
          left: 0;
          z-index: 5;
          pointer-events: none;
          background-color: var(--dv-separator-border);
      }
  }
  ```
- `packages/dockview-core/src/splitview/splitview.scss:66-73, 100-106` — the 1px sizing of the separator (`height:100%; width:1px` for horizontal; `width:100%; height:1px` for vertical).
- `packages/dockview-core/src/splitview/splitview.scss:139-150` — `.dv-view` is `position: absolute; overflow: auto; box-sizing: border-box;`. Note the absence of any `padding` or size compensation for the separator.
- `packages/dockview-core/src/splitview/splitview.ts:800-890` (`layoutViews`) — computes `view.container.style.width` / `height` from `view.size - marginReducedSize` only. No accounting for the 1px separator. The sash itself (4px) is positioned at `offset + size - sashWidth/2`, centered straddling the boundary between views — its hit area also overlaps the same 1px strip of content (but is transparent, so only the mouse cursor / pointer-events implications matter).
- `packages/dockview-core/src/splitview/splitview.ts:279-292` (`style`) — toggles the `dv-separator-border` class. When `separatorBorder === 'transparent'` the class is removed (and therefore the overlap is removed), so the user can already opt out of the visual band, but that doesn't reclaim the pixel for content.
- `packages/dockview-core/src/theme.scss` — many themes set `--dv-separator-border: transparent`, but the `::before` element is still in the DOM occupying that 1px (it just paints transparent). Content under it is still visible because the bg is transparent, but a sibling drawing a 1px border at `x=0` of its panel will still be visually identical pixels to the separator and the user's reported "missing left border" effect disappears when separator is transparent — which matches the reporter's second screenshot.

The deeper layout-engine implication: `view.view.layout(view.size - marginReducedSize, ...)` (line 885-888) reports the full panel size to the panel renderer, which then draws to those pixels. The first row/column of those pixels is co-occupied by the separator pseudoelement. There is no API to tell the inner panel "you have N-1 usable pixels because the first one is the separator."

## Recent commits that may have touched this

```
586b770ce nx: format
5929faf82 fix: Restore iframe pointer events on contextmenu during resize
1fa8a6112 feat: fix Windows shaking issue and implement GPU optimizations
d30263af6 bug: remove splitview dom element
4eff83e9a bug: remove element after dispose
837fabac8 feat: active sash animation css properties
f98be640c Added support for sash delay and duration customization
affb8590d chore: rename classes to start with dv-   <-- last semantic change to the separator block (just a rename)
49b1c5a17 bug: gap sizing fixes
1cd425108 fix: mistake of sashes offset when custom gap
eda3ea121 fix: splitview layout view size with hidden view
ea9dc1399 bug: panel gap styling
```

The structural design of the separator (absolutely-positioned `::before` overlaying view content at z-index 5) has not changed since at least the `8564f7a9f refactor: rename css properties` commit; only class renames since. No fix has been silently applied.

## Verdict

**CONFIRMED_BUG** — the separator pseudoelement design knowingly overlays panel content. This is a legitimate complaint for users who want pixel-perfect panel content.

It is arguably also a **feature request** (the reporter explicitly frames the desired solution as "view containers are aware of separators. Their sizes do not include the separator"). The current design has shipped this way for years and is documented behavior in the sense that themes use `--dv-separator-border` to paint a visible separator on top.

## Notes / fix sketch

There are three plausible fix approaches, in order of invasiveness:

1. **Minimal CSS-only opt-in:** add a mode (e.g. `dv-separator-inset`) that switches the separator from `::before` overlay on the view to either:
   - a `border-left` / `border-top` on `.dv-view:not(:first-child)` with `box-sizing: border-box`. Since the view is already `box-sizing: border-box`, this would correctly reduce content area by 1px. But the existing JS layout (`layoutViews`) would still assign the full sized width including the border — meaning the content area would be 1px narrower than the size the panel renderer is told, defeating sizing math.
   - moving the `::before` from `.dv-view::before` to `.dv-sash-container > .dv-sash::before`, painting the 1px line on the sash itself rather than the view. This decouples the visible separator from the view's content box entirely. The sash is currently 4px (centered on the boundary), so a 1px center-line on the sash would render at the exact boundary between views, not inside either view's content area. This is the cleanest fix.

2. **Layout math change:** in `layoutViews()` (splitview.ts:800-890), subtract 1px from `size` for each non-first view (and offset by 1px) when `dv-separator-border` is active. Then keep the `::before` overlay; it now sits at the very edge of the reserved 1px gap rather than over content. Requires `Splitview` to know whether separator-border is enabled (currently set via `style()`), and the same treatment to be applied in `dv-vertical` mode.

3. **Margin reuse:** the splitview already has a `margin` option that creates explicit gaps between views (see `_margin` / `dv-splitview-has-margin`). Document that users who want non-overlapping separators should set `margin: 1` and color the gap via the parent container background. Zero code change; documentation/API guidance only.

Recommendation: option 1 (sash-rendered separator) is the lowest-risk and gives the reporter what they want — separator no longer touches view content boxes, and the change is contained in `splitview.scss`. The only catch is that the sash is positioned by JS at `offset + size - sashWidth/2 + margin/2`, so the 1px line on the sash would land 1px offset from where the existing `::before` lands; this changes the visual position by half-sash-width (2px) which most themes/users won't notice but is technically a visual diff.

Complexity: option 1 ~30 min change + visual regression review across all themes; option 2 ~2-4 hr including tests for `layoutViews` math.
