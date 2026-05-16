# Issue #547 — singleTabMode="fullwidth" does not update correctly with drag-n-drop

- URL: https://github.com/mathuo/dockview/issues/547
- Filed against version: unspecified (filed 2024-03-11)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary
With `singleTabMode="fullwidth"`, the reporter sees the full-width styling stop updating
correctly when tabs are moved via drag-and-drop: removing the second tab by DnD leaves the
sole remaining tab non-full-width, and dragging a tab *into* a single-tab (full-width) group
leaves both tabs sharing the full width. Closing via the X button works correctly. Expected
behaviour is that the full-width state of the group always reflects whether it currently has
exactly one tab, irrespective of how panels were added/removed.

## Reproduces on master?
**Likely no — already fixed** (code analysis). The class-toggling logic was rewritten to
be invoked synchronously from inside the add/remove paths rather than through
`onDidAddPanel` / `onDidRemovePanel` listeners scoped to `e.api.group === this.group`. The
old listener-based approach missed DnD because moving a panel between groups did not fire
those events in a way that toggled the class on both source and target tabs containers; the
new approach calls `updateClassnames()` directly from `delete()` / `openPanel()`, which are
invoked for every code path (close, DnD source removal, DnD target insertion, move).

## Relevant code
- `packages/dockview-core/src/dockview/components/titlebar/tabsContainer.ts`
  - L164–168: at construction, `dv-full-width-single-tab` is set once based on
    `accessor.options.singleTabMode === 'fullwidth'`.
  - L365–368 `delete(id)`: calls `this.tabs.delete(id)` then `this.updateClassnames()`.
  - L374–377 `openPanel(...)`: calls `this.tabs.openPanel(...)` then `this.updateClassnames()`.
  - L383–385 `updateClassnames()`: `toggleClass(this._element, 'dv-single-tab', this.size === 1)`.
- `packages/dockview-core/src/dockview/components/titlebar/tabsContainer.scss` L9–26:
  styling is gated on both `.dv-single-tab` AND `.dv-full-width-single-tab` being present.
- `packages/dockview-core/src/dockview/dockviewGroupPanelModel.ts`
  - L1474–1502 `_removePanel`: the single removal funnel for both close and DnD-source.
  - L1504–1529 `doRemovePanel`: calls `tabsContainer.delete(panel.id)` (which now updates
    the classname), used by every removal path including DnD.
  - L1531+ `doAddPanel` / L1544 calls `tabsContainer.openPanel(panel, index)`, which now
    updates the classname for DnD-target inserts as well.
- Existing regression test:
  `packages/dockview-core/src/__tests__/dockview/components/titlebar/tabsContainer.spec.ts`
  L911–943 — covers `dv-single-tab` toggling on add/remove.

## Recent commits that may have touched this
- `cc5037d20` (2024-12-27) `bug: fix classname enablement` — PR #811, closing keyword
  references issue #784 ("class dv-single-tab not updated on drag drop of tabs"). This is
  the same root cause as #547. The diff removes the `onDidAddPanel` / `onDidRemovePanel`
  listeners that did the toggling and replaces them with direct `updateClassnames()` calls
  inside `delete()` and `addTab()`/`openPanel()`. Also adds the test cited above.
- `759dcc7b0` (2025-03-14) `bug: fix full-width css` — PR #880, addressing issue #878
  ("fullwidth tabs are not rendered full-width in 4.0"). Adjusts the SCSS — orthogonal CSS
  regression, but in the same area.

## Verdict
**LIKELY_FIXED** — repro should no longer occur on master HEAD (v6.2.2). PR #811 (Dec 2024)
replaced the event-listener-based class toggling with synchronous calls from inside the
tabs container's `delete()`/`openPanel()` methods, which are hit on every removal/insertion
path (close button, DnD source, DnD target, programmatic move). Issue #547 predates that
fix (filed Mar 2024) by ~9 months and almost certainly describes the same bug as the
closed #784. Recommend asking the reporter to retest on the latest release and closing as
fixed if confirmed; consider closing as duplicate of #784 if no response.

## Notes / fix sketch
No fix required. If the maintainer wants a defence-in-depth measure, the `delete()` and
`openPanel()` entry points are the chokepoints — any future refactor must ensure
`updateClassnames()` continues to be called from there (the previous bug was caused by
relying on `onDidAdd/RemovePanel` events filtered by `e.api.group === this.group`, which
did not fire correctly for cross-group DnD). The existing spec at
`tabsContainer.spec.ts:911` guards the basic case; an additional spec exercising DnD-style
move (`moveTab` / cross-group transfer) on both source and target groups would lock the
behaviour in further.
