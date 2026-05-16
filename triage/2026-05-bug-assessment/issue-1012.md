# Issue #1012 — Titlebar buttons are not keyboard focusable

- URL: https://github.com/mathuo/dockview/issues/1012
- Filed against version: unspecified (reported on dockview.dev/demo, abyss theme)
- Investigated: 2026-05-16
- Investigated by: claude-opus-4-7

## Summary
On the live demo, pressing Tab moves focus across tabs (the tab elements have `tabIndex = 0`), but focus skips over the right-aligned titlebar buttons: the per-tab close `X`, the favorite/star icon, and the maximize/popout custom actions. None of those controls respond to Enter/Space either. The user expects keyboard-only users to be able to reach and activate every visible button in the titlebar.

## Reproduces on master?
**Yes — code analysis confirms.** Master HEAD = dockview-core@6.2.2. The relevant elements are rendered as plain `<div>`s with `onclick`/`pointerdown` listeners and no `tabindex`, no `role="button"`, no keydown handler. Tab itself is focusable, but the close icon inside the tab and the user-supplied right/left/prefix header action components are not.

## Relevant code

### 1. Per-tab close button (the `X`) — the framework-owned action
`/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/components/tab/defaultTab.ts`

- Lines 25-27: `this.action = document.createElement('div'); this.action.className = 'dv-default-tab-action'; this.action.appendChild(createCloseButton());`
- No `tabIndex`, no `role`, no `aria-label`, no keydown handler.
- Only `pointerdown` (line 43) and `click` (line 46) listeners are attached, so Enter/Space on the focused parent tab won't close it.

### 2. The close SVG glyph itself
`/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/svg.ts` lines 1-26

- `createSvgElementFromPath` explicitly sets `focusable="false"` on the SVG (line 12) — fine for screen-reader role, but reinforces that nothing here participates in tab order.

### 3. User-supplied header actions (star/favorite, maximize, popout)
`/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/components/titlebar/tabsContainer.ts` lines 170-191

- Dockview just creates `<div class="dv-right-actions-container">`, `dv-left-actions-container`, `dv-pre-actions-container` and lets the consumer mount whatever they want inside.
- Core never enforces any a11y. So the reproduction in the live demo is on the consumer's `Icon` wrapper, not core — see below.

### 4. Demo `Icon` wrapper used in the live demo
`/Users/matthewoconnor/Development/dockview/packages/docs/sandboxes/react/dockview/demo-dockview/src/controls.tsx`

- Lines 5-20: `Icon` is `<div className="action" onClick={...}>...</div>` — no `role="button"`, no `tabIndex`, no key handler. That is why the star/maximize/popout buttons in the demo aren't reachable.

### 5. Tabs (for context — these *are* focusable)
`/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/components/tab/tab.ts` line 87: `this._element.tabIndex = 0;`
This is consistent with the user's observation that Tab keys onto the tabs but skips past their close icons.

## Recent commits that may have touched this

`git log -- packages/dockview-core/src/dockview/components/tab/defaultTab.ts packages/dockview-core/src/svg.ts`:

- `9d9a9281c ♿️ access: remove id options, focus tab on select, close button` — landed on master (made the tab itself focusable).
- `cef78168f ♿️ access: allow Enter/Space to trigger tab close` — **NOT in master.** This commit on PR branch `tab-accessibility` (#701, merge commit `9c04db809`) would have converted the action element to `<button type="button">` and added an Enter/Space keydown handler, but it was never merged into master. The HEAD `defaultTab.ts` is still the older `<div>` form.

Broader sweep `git log --grep="a11y\|accessib\|focus\|keyboard\|tabindex" --since="2024-01-01"`:
- `88dc78419 fix: context menu correctness, accessibility, and test coverage…` — context menu only, unrelated.
- `b1c0bdf93 docs: audit improvements — SEO, accessibility, and theming polish` — docs only.
- `c0ed837cb test: add keyboard close tests for PopupService (Escape, Enter)` — PopupService, unrelated.
- Nothing in the period touches the per-tab close button or the header-action containers.

## Verdict
**CONFIRMED_BUG** — a real, concrete a11y bug.

The close `X` on every tab is unreachable and unactivatable by keyboard on master, and the framework provides zero accessibility scaffolding for user-supplied left/right/prefix header action components (so even diligent consumers will, like the demo, ship inaccessible buttons by default). A previously-authored fix (`cef78168f`) exists but never landed.

## Notes / fix sketch

1. **Close button (in-tree fix).** In `defaultTab.ts` either:
   - Adopt the unmerged commit `cef78168f` essentially as-is: change `this.action` to `document.createElement('button')`, set `type='button'`, `ariaLabel = 'Close "<title>" tab'`, and add a `keydown` handler for `Enter`/`Space`. The fix is ~15 lines and has the bonus of fixing screen-reader labelling at the same time.
   - Or, if avoiding `<button>` defaults inside `<div role="tab">` markup, add `tabIndex = 0`, `role = 'button'`, `aria-label`, and a `keydown` handler. The `<button>` approach is cleaner and matches the existing PR.
2. **Custom header actions.** Two options:
   - Document the expectation that consumer-supplied header action components must render real `<button>`s / focusable elements (docs-only change, no code change).
   - Or have core wrap each user-supplied action component in a focusable shell — riskier, since consumers may already render their own `<button>` and you'd get nested interactive elements.
   - Demo-side: update `controls.tsx` `Icon` to render `<button type="button" aria-label={title} onClick={onClick}>` so the live demo passes a keyboard smoke test. This alone closes the user's reproduction path; the in-tree fix in (1) closes the framework-owned half.
3. **Tests.** Add jest coverage in `__tests__/dockview/components/tab/defaultTab.spec.ts` (file already exists in the test suite layout) asserting the close action is a `<button>` with `tabIndex >= 0` and that Enter/Space fire `api.close`.

Complexity: low. The fix has already been written once; reapplying or rewriting it is well under an hour. The accompanying demo update is trivial.
