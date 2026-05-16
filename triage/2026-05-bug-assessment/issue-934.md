# Issue #934 — Themes with gap overflow

- URL: https://github.com/mathuo/dockview/issues/934
- Filed against version: 4.2.5
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary
Reporter says spaced themes (`themeAbyssSpaced`, `themeLightSpaced`) overflow the
host container in 4.2.5 — scrollbars appear on the main dockview container
because the spacing-mixin's `padding: var(--dv-spacing-padding)` is applied on
top of the layout engine's pixel-exact dimensions. `themeReplit` is also called
out as showing scrollbars inside panel containers. Expected: no scrollbars on
spaced themes.

## Reproduces on master?
**No** — the primary fix is in place and the `themeReplit` follow-up complaint
is moot (the theme was retired in v6).

The owner shipped a fix in 4.6.2 (commit `ef9e3f37e bug: theme overflow`, Jul
2025) that adds `box-sizing: border-box` inside `dockview-design-space-mixin`
so the `--dv-spacing-padding: 10px` is absorbed into the dockview element's
declared width/height instead of being added to it. That declaration is still
present on master (now @ `_space-mixin.scss:13`).

For the secondary `themeReplit` complaint from the August re-test comment:
`themeReplit` was removed in v6 entirely — see `packages/docs/docs/overview/whats-new-v6.mdx:182` (`### themeReplit removed`). There is nothing left to fix.

The underlying splitview gap math has always been correct (each view shrinks
by `(margin * (n-1)) / n` — see fix sketch below) — the bug was purely a CSS
box-model issue with the padded outer container.

## Relevant code
- `packages/dockview-core/src/theme/_space-mixin.scss:13` — the
  `box-sizing: border-box` declaration that fixes #934. Sits inside
  `@mixin dockview-design-space-mixin`, alongside
  `padding: var(--dv-spacing-padding)` (line 14, default 10px).
- `packages/dockview-core/src/theme.scss:1012` — the `.dockview-spaced` utility
  class that applies the mixin, used implicitly by `themeAbyssSpaced` /
  `themeLightSpaced` / all the `*-spaced` theme classes (theme.scss:909, 967,
  389, 518, 681, 765, 861).
- `packages/dockview-core/src/dockview/theme.ts:106-128` — `themeAbyssSpaced` /
  `themeLightSpaced` declarations (gap: 10).
- `packages/dockview-core/src/dockview/dockviewComponent.ts:528,548,3658-3660` —
  the gap value is threaded through `gridview.margin` and into the
  shell/splitview layouts.
- `packages/dockview-core/src/splitview/splitview.ts:790-890` —
  `layoutViews()` correctly accounts for inter-view margins: each visible view's
  rendered width is `view.size - marginReducedSize`, where
  `marginReducedSize = (margin * sashCount) / visibleCount`. This guarantees the
  sum of rendered widths equals the container width. The gap math was never the
  bug.
- `packages/docs/docs/overview/whats-new-v6.mdx:182` — documents `themeReplit`
  removal in v6 (the secondary complaint in the comment thread).

## Recent commits that may have touched this
- `ef9e3f37e` (2025-07-17) "bug: theme overflow" — **the fix**. Adds
  `box-sizing: border-box` to `dockview-design-space-mixin` (still on master)
  and to the now-removed `dockview-design-replit-mixin`.
- `b88b685c6` "fix: add missing edgeGroupCollapsedSize to spaced themes and
  remove unused --dv-gap" — related cleanup.
- `884bd6f98` "feat: migrate spaced themes to CSS variable system and add
  interactive theme builder" — later refactor of the spaced theme architecture;
  preserves `box-sizing: border-box`.

## Verdict
**LIKELY_FIXED** — code suggests the issue is already resolved on master
(dockview-core@6.2.2). The fix has been in place since v4.6.2 and survived the
v6 theme-system refactor. The owner already asked the reporter to re-confirm
back in August 2025; the reporter confirmed both spaced themes are OK but
flagged 2px overflow under `themeReplit` — which has since been removed
entirely. Safe to close.

## Notes / fix sketch
No further action required. If a maintainer wants to be tidy, the issue can be
closed referencing commit `ef9e3f37e` (spaced themes fixed) and the v6 release
notes (`themeReplit` retired with no replacement).

If the `themeReplit` 2px overflow ever resurfaces on a custom replacement
theme, the same pattern applies: ensure any wrapper mixin that adds
`padding` also sets `box-sizing: border-box` so the dockview element's
declared dimensions absorb the padding instead of growing past the container.
