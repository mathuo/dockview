# Issue #914 — Tab overflow dropdown does not reflect updated title set via api.setTitle

- URL: https://github.com/mathuo/dockview/issues/914
- Filed against version: unspecified (filed around Chrome 135 era, ~April 2025)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary
When more tabs exist than fit in the header, an overflow dropdown lists the
hidden panels. If the user calls `api.setTitle(...)` to rename a panel and then
opens the overflow dropdown, the dropdown entry for that panel still shows the
panel's original title rather than the updated one. The user expects the
dropdown to reflect the panel's current title.

## Reproduces on master?
Likely yes (code analysis). The render path for overflow entries snapshots the
panel's init-time parameters and never receives the title update before the
dropdown's freshly-created tab renderer is shown.

## Relevant code

Key path: clicking the overflow dropdown lazily builds the list and asks each
panel's view for a new tab renderer scoped to `'headerOverflow'`.

- `packages/dockview-core/src/dockview/components/titlebar/tabsContainer.ts:434-555`
  — the click handler that builds the popover content; for each overflowed tab
  it calls `panelObject.view.createTabRenderer('headerOverflow')` (line 517)
  and appends the returned element.

- `packages/dockview-core/src/dockview/dockviewPanelModel.ts:48-58`
  — `createTabRenderer` constructs a *new* `DefaultTab` (or user-supplied tab
  component) and calls `cmp.init({ ...this._params, tabLocation })`. The
  problem is that `this._params` is set once in `init` (line 60-65) and is
  **never refreshed when the panel's title changes**. So the freshly-built tab
  is initialised with the stale title.

- `packages/dockview-core/src/dockview/dockviewPanel.ts:170-177`
  — `setTitle` only updates `this._title` and fires
  `api._onDidTitleChange`; it does not push the new title back into the
  view-model's cached `_params`.

- `packages/dockview-core/src/dockview/components/tab/defaultTab.ts:35-57`
  — `DefaultTab.init` reads `params.title` and then subscribes to
  `onDidTitleChange`. The subscription would update the title for *future*
  changes, but at the moment the dropdown is opened the title has already
  been changed in the past, so no event fires after `init` and the tab is
  rendered with the stale `params.title`.

Net effect: every time the dropdown opens it constructs a brand-new tab
renderer, initialises it with the snapshotted (stale) title, and never
receives a `onDidTitleChange` event because the change happened *before* the
renderer was created.

## Recent commits that may have touched this
`git log --since="2025-04-01"` for `tabsContainer.ts`, `dockviewPanelModel.ts`
and `defaultTab.ts` shows a number of tab-overflow related changes, but none
address the title-staleness path:

- 7b04c1ee7 feat: show tab groups in the tab overflow context menu
- 41460b36b fix: tab overflow dropdown inherits correct font size from tab bar
- b1826a8ed fix: overflow dropdown positions correctly in fixed panels
- ba1ecff8e fix: close tab overflow popover on window resize
- 847f4f521 fix: Enable close button functionality in tab overflow dropdown
- c6345e1e1 fix: add scrollbar to tabs overflow dropdown list
- ba4f05b50 fix: render popout-group popovers in the popout window

None of these update `_params.title` on `setTitle` or otherwise pass the
current title through to `createTabRenderer`. The bug code path is unchanged
since the issue was filed.

## Verdict
**CONFIRMED_BUG** — repro still applies, fix needed.

## Notes / fix sketch
Two reasonable fixes; either is small:

1. **Pass live title into `createTabRenderer`** — in
   `DockviewPanelModel.createTabRenderer`, look up the current title from the
   owning panel (or from the API) instead of relying on the cached
   `_params.title`. Concretely, replace
   `cmp.init({ ...this._params, tabLocation })` with something that overlays
   the current `panel.title` (e.g. accessor-side: have the caller in
   `tabsContainer.ts` pass `tab.panel.title`, or wire the panel reference
   into the model).

2. **Keep `_params.title` in sync** — in `DockviewPanel.setTitle`, after
   updating `_title`, also update the view's cached params so future
   `createTabRenderer` calls see the new title. This is the smaller diff but
   couples the panel to the view's internal cache.

Edge case to cover with a test:
1. add enough panels to overflow,
2. call `api.setTitle` on a hidden panel,
3. open the overflow dropdown,
4. assert the dropdown entry's text matches the new title.

A unit test can hook into `DockviewPanelModel.createTabRenderer` to verify it
receives the new title in its init params after `setTitle` is called.

Custom-tab-component users (those who supply their own tab renderer via
`createTabComponent`) are also affected: their tab's `init(params)` will see
the stale `params.title` too, although their renderer's subscription to
`api.onDidTitleChange` would self-correct on the next change. The fix should
make the initial snapshot correct for them as well.
