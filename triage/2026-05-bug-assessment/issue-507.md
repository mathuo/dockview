# Issue #507 — Gridview adds panels in reverse order

- URL: https://github.com/mathuo/dockview/issues/507
- Filed against version: 1.9.2 (Sep 2023)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7, 1M ctx)

## Summary

When the user calls `event.api.addPanel(...)` repeatedly on a `GridviewComponent`
with `orientation: VERTICAL` and no `position`, the first-added panel ends up
at the *bottom* and the last-added panel ends up at the *top*. The reporter
expected the first panel to appear at the top (i.e. they expected an append
semantics). They contrast this with `DockviewComponent`, which appears to
preserve insertion order.

## Reproduces on master?

**Yes (behavior is unchanged since the issue was filed).** Both the published
v6.2.2 and current master HEAD still prepend each new panel at index `[0]` of
the root branch, displacing previous panels by one slot. So:

| addPanel call | Location applied | Resulting layout (top → bottom)              |
|---------------|------------------|-----------------------------------------------|
| panel_1       | `[0]`            | `panel_1`                                     |
| panel_2       | `[0]`            | `panel_2` / `panel_1`                         |
| panel_3       | `[0]`            | `panel_3` / `panel_2` / `panel_1`             |

After three calls, `panel_1` is at the bottom — exactly what the reporter sees.

This is *not* a randomness/race bug — it's deterministic and falls out of two
deliberate choices in `GridviewComponent.addPanel`:

1. When no `position` is provided, `relativeLocation` defaults to `[0]`.
2. `Gridview.addView` interprets the trailing index of `location` as the
   insertion index of `BranchNode.addChild`, so `[0]` always means
   "insert at the start of the root branch".

## Relevant code

- **Default location of `[0]`**:
  `packages/dockview-core/src/gridview/gridviewComponent.ts:327`
  ```ts
  let relativeLocation: number[] = options.location ?? [0];
  ```
  Everything below that branches on `options.position?.referencePanel`. If the
  caller doesn't supply `position` or `location`, we fall through to the bare
  default and every panel lands at the same location.

- **Insertion-at-index in the grid**:
  `packages/dockview-core/src/gridview/gridview.ts:920-939` (`Gridview.addView`):
  the trailing element of `location` is fed straight into
  `parent.addChild(node, size, index)`. Index `0` means prepend.

- **`getRelativeLocation`** at `gridview.ts:158-179` is irrelevant here because
  it's only invoked when `position.referencePanel` is supplied; in the reporter's
  case the default `[0]` is used verbatim.

- **Sandbox the reporter linked**:
  `packages/docs/sandboxes/react/gridview/simple/src/app.tsx` — `panel_1`,
  `panel_2`, `panel_3` are added with no `position`, then later panels use
  `position` referencing earlier panels. Panel_1 is at the bottom of the
  resulting layout, matching the report.

## Compare with `DockviewComponent.addPanel`

In `packages/dockview-core/src/dockview/dockviewComponent.ts:2217-2294`,
when `options.position` is absent dockview falls through to
`referenceGroup = this.activeGroup` (line 2293). With no explicit position, all
subsequent panels are opened *inside* the current active group (as additional
tabs), not as new grid cells. That's why the reporter perceives "dockview is
opposite/correct" — they're seeing tabs in the same group rather than fresh
splits.

So the two components actually have completely different default-insertion
semantics: dockview = "tab into active group", gridview = "split at root
index 0". The user's mental model came from dockview.

## Recent commits that may have touched this

`git log --since="2023-01-01" -- packages/dockview-core/src/gridview/` shows
plenty of activity (constraints, maximize, normalization, fixed-side panels,
sonar fixes, etc.), but a targeted `git log -S 'options.location ?? [0]'`
returns only `882c1353c` (Oct 2023, "chore: fix sonar issues") which did
*not* change the default. The `relativeLocation: number[] = options.location ?? [0]`
line has been there since the original package split (`5f72f5a36`).

No commit fixes or alters this default-insertion behavior between v1.9.2 and
v6.2.2.

## Verdict

**NOT_A_BUG (behaviour-as-coded) / DOCUMENTATION**.

The gridview public contract is: "if you don't tell me where to put the panel,
I'll insert it at root location `[0]`". That's stable and deterministic. The
reporter's expectation (append at the end) is reasonable but doesn't match
the implementation. Two possible follow-ups, both opinionated changes rather
than bug fixes:

- **Doc fix (cheap)**: Call out in `packages/docs/docs/other/gridview/overview.mdx`
  and/or `addPanel` API doc that omitting `position` defaults to `[0]` (prepend
  at root), and recommend supplying `position` with a `referencePanel` whenever
  insertion order matters. This is the minimal-risk option.

- **Behaviour change (breaking)**: change the default from `[0]` to
  `[<rootBranch.children.length>]` (append). This would be intuitive but is a
  silent breaking change for anyone who relies on the current prepend
  semantics — including the linked sandbox itself, which would visually flip.
  Not recommended without a major version bump and migration note.

## Notes / fix sketch

If we choose the doc path, no code changes are required. Update the gridview
overview and the `addPanel` signature reference (`api.mdx`) to spell out the
default. Could also rewrite the simple-gridview sandbox to always pass an
explicit `position` so newcomers see the intended pattern from the start.

If we ever revisit the behaviour, the one-line change is at
`gridviewComponent.ts:327`, but it must come with:
- a regression test covering the new default,
- updates to all gridview sandboxes (`gridview/simple`, etc.),
- a changelog entry flagged as breaking.
