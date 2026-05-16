# Issue #968 — Dark themes with overflowing content use light scrollbars

- URL: https://github.com/mathuo/dockview/issues/968
- Filed against version: unspecified (issue opened 2025-07-20)
- Investigated: 2026-05-16
- Investigated by: Opus 4.7 (1M context)

## Summary

When using a dark theme (e.g. `dockview-theme-dark`, `dockview-theme-abyss`), any
overflowing content inside a panel renders with the browser's default
**light/system** scrollbar instead of a dark one. The reporter expects dockview
to opt the panel surface into the OS dark scrollbar styling so native scrollbars
match the theme.

## Reproduces on master?

**Yes.** The theme stylesheet at
`packages/dockview-core/src/theme.scss` defines all dark theme classes
(`.dockview-theme-dark`, `.dockview-theme-abyss`, `.dockview-theme-dracula`,
`.dockview-theme-nord`, `.dockview-theme-catppuccin-mocha`, `.dockview-theme-monokai`,
`.dockview-theme-github-dark`, plus the `*-spaced` variants) with only
`--dv-*` CSS custom properties. None of them set:

- `color-scheme: dark;` on the theme root, nor
- explicit `scrollbar-color: <thumb> <track>;` (Firefox / modern Chromium), nor
- `::-webkit-scrollbar*` overrides for the panel content area.

Without `color-scheme`, the UA falls back to the platform default (light) for
scrollbars rendered inside `.dv-groupview` / panel content.

Note: dockview's *custom* overlay scrollbar (`.dv-scrollable .dv-scrollbar` in
`src/scrollbar.scss`) is only attached to dockview-managed scroll containers
(the tab strip etc.). User content that overflows inside a panel uses the
native browser scrollbar, which is exactly the case the issue screenshots.

## Relevant code

- `packages/dockview-core/src/theme.scss`
  - `@mixin dockview-theme-dark-mixin` (lines 57–79) — no `color-scheme` set.
  - `@mixin dockview-theme-abyss-mixin` (lines 184–224) — no `color-scheme` set.
  - All other dark theme mixins (dracula, nord, catppuccin-mocha, monokai, github-dark)
    and their `-spaced` variants — same issue.
  - `@mixin dockview-theme-light-mixin` (lines 81–108) — also misses
    `color-scheme: light`, but the bug is less visible because light is the UA default.
- `packages/dockview-core/src/dockview/theme.ts`
  - `DockviewTheme.colorScheme?: 'light' | 'dark'` declared on the interface (line 17).
  - Every built-in theme object (lines 72–224) sets `colorScheme` correctly
    (`themeDark`, `themeAbyss`, `themeDracula`, … all `'dark'`).
- `packages/dockview-core/src/dockview/dockviewComponent.ts`
  - `updateTheme()` (lines 3650–3706) applies `theme.className`, `theme.gap`,
    `theme.edgeGroupCollapsedSize`, `theme.dndOverlayBorder`,
    `theme.dndOverlayMounting`, and `theme.tabGroupIndicator`.
  - **Critical:** it never reads `theme.colorScheme` and never sets
    `element.style.colorScheme` (or a corresponding class/CSS var).
  - `grep -rn colorScheme packages/dockview-core/src/` outside `theme.ts`
    returns zero matches — the property is dead.
- `packages/docs/docs/core/theming.mdx` (line 104) documents the field
  as if it were live: *"Hint passed to the browser via the `color-scheme` CSS
  property — `'light'` or `'dark'`. Native form controls and scrollbars adapt
  accordingly."* — the doc is aspirational; implementation is missing.

## Recent commits that may have touched this

Commits since 2024-01-01 on `packages/dockview-core/src/theme/` and
`theme.scss` / `theme.ts`:

- `13cbee779` feat: customizable tab group color palette (no scrollbar/color-scheme work)
- `b88b685c6` fix: add missing edgeGroupCollapsedSize to spaced themes
- `884bd6f98` / `c4bcff4ad` feat: migrate spaced themes to CSS variable system + theme builder
- `778aaade9` feat: add tabGroupIndicator theme property
- `29a249231` feat: add dndOverlayBorder theme property
- `56c989da9` feat: move tabAnimation to theme object

`git log -S "colorScheme" -- packages/dockview-core/src/dockview/theme.ts`
shows the property was added in `c4bcff4ad` (the theme-builder migration) and
re-added in `884bd6f98` after the revert. The DOM wiring was never added in
either commit.

## Verdict

**CONFIRMED_BUG.**

The bug still reproduces on master HEAD. The two-part fix is small and well
localised; nothing in the recent history addresses it.

## Notes / fix sketch

Two complementary fixes (either, ideally both):

1. **JS wiring (preferred — uses the existing data):** in
   `dockviewComponent.ts::updateTheme()`, set the CSS property after
   `setClassNames`:
   ```ts
   const cs = theme.colorScheme;
   if (cs) {
       this.element.style.colorScheme = cs;
       this._shellManager?.element.style.setProperty('color-scheme', cs);
   } else {
       this.element.style.colorScheme = '';
       this._shellManager?.element.style.removeProperty('color-scheme');
   }
   ```
   All 19 built-in theme objects already carry the correct `colorScheme`, so
   this single change fixes every built-in theme at once and matches the
   behaviour the docs already promise.

2. **SCSS belt-and-braces:** add `color-scheme: dark;` to every dark theme
   mixin in `theme.scss` (`dockview-theme-dark-mixin`,
   `dockview-theme-abyss-mixin`, `dockview-theme-dracula-mixin`,
   `dockview-theme-nord-mixin`, `dockview-theme-catppuccin-mocha-mixin`,
   `dockview-theme-monokai-mixin`, `dockview-theme-github-dark-mixin`, plus
   the spaced variants `dockview-theme-abyss-spaced`,
   `dockview-theme-nord-spaced`, `dockview-theme-catppuccin-mocha-spaced`,
   `dockview-theme-github-dark-spaced`) and `color-scheme: light;` to the
   light variants (`dockview-theme-light-mixin`, `dockview-theme-light-spaced`,
   `dockview-theme-solarized-light-mixin`, `dockview-theme-solarized-light-spaced`,
   `dockview-theme-github-light-mixin`, `dockview-theme-github-light-spaced`).
   This covers consumers who only ship the CSS without instantiating the
   theme object, and provides the styling even before JS runs.

Edge cases:

- `color-scheme` inherits, so consumers wrapping dockview in their own
  `color-scheme: light` root may still need to scope. Setting it on the
  dockview shell element is the right scope — it cascades into panel
  content but doesn't escape upwards.
- A `dv-scrollable` custom-scrollbar element exists, but it only governs
  dockview-managed scroll surfaces; the user's reported case is native
  panel-content scrollbars, which this fix targets directly.
- Complexity estimate: trivial. One JS hunk + a dozen one-line SCSS additions.
- A potentially nicer alternative would be to also expose `colorScheme` on
  the `DockviewTheme` builder UI in the docs site so custom themes can opt in.
