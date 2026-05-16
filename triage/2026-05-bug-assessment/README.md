# Open-Issue Bug Triage — May 2026

Started: 2026-05-16
Baseline: master HEAD (dockview-core@6.2.2 = latest published)

## Goal

For each open issue suspected to be a bug:

1. Confirm it is in fact a bug (not a feature request / question / dup).
2. Determine whether it still reproduces on master HEAD (v6.2.2) or has been silently fixed.
3. Locate the relevant code path so a fix is one step closer.
4. Assign a triage verdict.

## Report file format

One file per issue: `issue-<number>.md`.

Each file MUST contain:

```markdown
# Issue #<n> — <title>

- URL: https://github.com/mathuo/dockview/issues/<n>
- Filed against version: <e.g. 4.7.1, or "unspecified">
- Investigated: 2026-05-16
- Investigated by: <agent>

## Summary
<2-3 sentences: what the user reports, what they expect.>

## Reproduces on master?
<Yes / No / Likely yes (code analysis only) / Likely no — and why.>

## Relevant code
<File paths with line numbers, key functions, the suspected location of the bug.>

## Recent commits that may have touched this
<git log on relevant files — anything since the issue was filed?>

## Verdict
One of:
- **CONFIRMED_BUG** — repro still applies, fix needed.
- **LIKELY_FIXED** — code suggests the issue is already resolved; ask reporter to re-test.
- **CANNOT_REPRODUCE** — code looks correct; need a live repro from reporter.
- **NOT_A_BUG** — actually a feature request, question, or expected behavior.
- **DUPLICATE** — covered by another open issue or PR (give the number).

## Notes / fix sketch
<Optional: rough idea of where a fix would land, complexity estimate, edge cases.>
```

## Index

| Issue | Title | Verdict | Report |
|------:|-------|---------|--------|
| #547 | `singleTabMode="fullwidth"` not restored after DnD | LIKELY_FIXED (PR #811) | [issue-547.md](issue-547.md) |
| #781 | Ghost group after popping out last group | CONFIRMED_BUG | [issue-781.md](issue-781.md) |
| #914 | Tab overflow dropdown ignores `api.setTitle` | CONFIRMED_BUG | [issue-914.md](issue-914.md) |
| #851 | Duplicate popouts on page refresh | CONFIRMED_BUG | [issue-851.md](issue-851.md) |
| #989 | Panel blank after pop-in via `moveTo` | LIKELY_FIXED (commit 9b12ca88d) | [issue-989.md](issue-989.md) |
| #1019 | `setVisible` shrinks other splitview panels | CONFIRMED_BUG | [issue-1019.md](issue-1019.md) |
| #1030 | Min-widths push panels off-screen | FEATURE_REQUEST (intended behaviour; docs need a clarification, enforcement would be a new feature) | [issue-1030.md](issue-1030.md) |
| #954 | `onDidActivePanelChange` fires during `fromJSON` | CONFIRMED_BUG (missing `movingLock` wrapper) | [issue-954.md](issue-954.md) |
| #981 | `onlyWhenVisible` doesn't unmount React panels | CLOSED — by-design; "destroy-on-hide" would be a separate feature | [issue-981.md](issue-981.md) |
| #1134 | `fromJSON(toJSON())` throws | CANNOT_REPRODUCE (Vue-internal error) | [issue-1134.md](issue-1134.md) |
| #444 | Modified panel size not persisted on edge drop | CONFIRMED_BUG (no `size` threaded through edge-drop paths; related: #708) | [issue-444.md](issue-444.md) |
| #1025 | Panel-floating fires different events than group-floating | CONFIRMED_BUG (`movingLock` suppresses all events; `_onDidMovePanel` never fires) | [issue-1025.md](issue-1025.md) |
| #817 | Floating groups resize past viewport | LIKELY_FIXED (commit 966137ca4) | [issue-817.md](issue-817.md) |
| #725 | Min/Max width/height ignored on floating panels | FEATURE_REQUEST (never built — `Overlay` resize was designed against viewport bounds only; wiring group constraints in is a new feature) | [issue-725.md](issue-725.md) |
| #674 | `group.api.maximize()` silently no-ops on floating groups | FEATURE_REQUEST (by design — maximize-while-floating was never built; minor wart: silent no-op could become a `console.warn`) | [issue-674.md](issue-674.md) |
| #1012 | Titlebar buttons not keyboard-focusable | CONFIRMED_BUG (no tabindex/role; unmerged PR #701 had a partial fix) | [issue-1012.md](issue-1012.md) |
| #708 | Group size preservation only works within own splitview | CONFIRMED_BUG (distinct root cause from #444; `moveGroup` size derivation breaks cross-orientation / cross-nesting moves) | [issue-708.md](issue-708.md) |
| #1089 | `themeLightSpaced`: `toJSON` sizes drift 3px after `changeActivePanel` | CONFIRMED_BUG (splitview proportional re-quantization is non-idempotent) | [issue-1089.md](issue-1089.md) |
| #968 | Dark themes use light scrollbars | CONFIRMED_BUG (theme.colorScheme declared but `updateTheme` never applies it) | [issue-968.md](issue-968.md) |
| #957 | Empty group container with tabs unrendered | NOT_A_BUG (user error — Vue SFCs not registered with the app) | [issue-957.md](issue-957.md) |
| #680 | Hide all groups in a branch then show one — original sizes lost | CONFIRMED_BUG (same root cause family as #1019; `distributeEmptySpace` is memoryless and `_cachedVisibleSize` is captured post-redistribution) | [issue-680.md](issue-680.md) |
| #793 | `react-portals-cache` ref issue | NOT_A_BUG (third-party; nested-layout portal unmount caches stale ref) | [issue-793.md](issue-793.md) |
| #507 | Gridview adds panels in reverse order | NOT_A_BUG (default `[0]` prepends — documentation gap, behaviour unchanged since 2023) | [issue-507.md](issue-507.md) |
| #932 | Firefox: non-focused tab drag doesn't activate | LIKELY_FIXED (silently, by the smooth-tab-animation RAF rework; reporter re-confirmed no repro Jun 2025) | [issue-932.md](issue-932.md) |
| #956 | Resize separator obscures panel content | CONFIRMED_BUG (1px `::before` pseudo overlays panel; `layoutViews` doesn't subtract a separator allowance) | [issue-956.md](issue-956.md) |
| #934 | Themes with gap overflow at the edge | LIKELY_FIXED (commit `ef9e3f37e` added `box-sizing: border-box`; `themeReplit` retired in v6) | [issue-934.md](issue-934.md) |
| #792 | `react-map-gl` interaction breaks in popout | NOT_A_BUG (mapbox captures `window` once at ctor; dockview can't rebind it. Mitigation: opt-in `onWindowChange` event) | [issue-792.md](issue-792.md) |
| #734 | Firefox: drop overlay sticks when crossing scrollbar | CONFIRMED_BUG (FF scrollbar breaks `target === e.target` in `dragleave`; cheap fix: add `clientX/Y` bounds check in `Droptarget.onDragOver`) | [issue-734.md](issue-734.md) |
| #158 | No resize on window restore inside flexbox parent | NOT_A_BUG (classic flexbox feedback loop with overflowing content; reporter confirmed `overflow: hidden` fixes it) | [issue-158.md](issue-158.md) |
| #1066 | `setSize()` / `initialWidth` examples broken | CONFIRMED_BUG (docs: missing typescript template at `templates/dockview/resize/`; behaviour: `initialWidth/Height` silently no-op on first/only panel — splitview has nothing to redistribute against) | [issue-1066.md](issue-1066.md) |
