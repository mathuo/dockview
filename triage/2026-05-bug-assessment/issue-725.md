# Issue #725 — Minimum/Maximum width/height does not work on floating panels

- URL: https://github.com/mathuo/dockview/issues/725
- Filed against version: 1.17.1
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary
User adds a panel with `minimumWidth`, `maximumWidth`, `minimumHeight`, `initialWidth/Height` and a `floating` config. The initial size is honored, but once the floating overlay is grabbed by a resize handle, the user can freely resize beyond those panel constraints — they are completely ignored. A second commenter (2025‑10‑16) reports the same on a more recent version. Expectation: the floating overlay should respect the contained panel's min/max width/height just like a docked group does.

## Reproduces on master?
Yes — the code path that would enforce these constraints does not exist. The `Overlay` class only knows about `minimumInViewportWidth` / `minimumInViewportHeight` (which control how much of the overlay must stay inside the viewport, the `floatingGroupBounds` option), plus its own hard‑coded `MINIMUM_WIDTH = 20` / `MINIMUM_HEIGHT = 20`. It never reads the contained group's `minimumWidth/maximumWidth/minimumHeight/maximumHeight`. The resize handlers in `overlay.ts` (`moveTop/moveBottom/moveLeft/moveRight` inside `setupResize`) clamp only by `Overlay.MINIMUM_WIDTH/HEIGHT` and by container bounds, so any panel‑level constraints are silently ignored. A floating panel can therefore be freely resized in both directions regardless of the values supplied to `addPanel({ minimumWidth, maximumWidth, ... })`.

## Relevant code

- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/overlay/overlay.ts`
  - L41–112 `Overlay` class — constructor only accepts `minimumInViewportWidth/Height`; no panel‑constraint inputs.
  - L50–51 `MINIMUM_HEIGHT = 20`, `MINIMUM_WIDTH = 20` — the only hard lower bounds applied during resize.
  - L404–624 `setupResize` — `moveTop/moveBottom/moveLeft/moveRight` clamp `width/height` using `Overlay.MINIMUM_WIDTH/HEIGHT` and `containerRect.width/height`; never consults the group/panel min/max.
  - L626–638 `getMinimumWidth` / `getMinimumHeight` — exclusively read `options.minimumInViewportWidth/Height`.
- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/dockviewComponent.ts`
  - L1332–1348 — `new Overlay({...})` is constructed with `minimumInViewportWidth/Height` taken from `floatingGroupBounds` only. The group reference (which exposes effective min/max via `group.minimumWidth` etc.) is not passed to the overlay.
  - L1390–1405 — `overlay.onDidChange` simply calls `group.layout(group.width, group.height)`; there is no clamping step on the overlay against `group.minimumWidth/maximumWidth/minimumHeight/maximumHeight`.
- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/dockviewGroupPanel.ts`
  - L43–92 — group min/max getters that already derive correct effective constraints from `activePanel.minimumWidth` etc. These are the values the overlay should be consulting but currently doesn't.
- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/dockviewGroupPanelModel.ts`
  - L1463–1472 `layout(width, height)` — passive: it stores whatever the overlay handed it; no clamp here either.

## Recent commits that may have touched this
`git log --since="2024-01-01" --all -- packages/dockview-core/src/overlay/overlay.ts` shows mostly unrelated changes (ESLint cleanup, negative‑position clamp fix `966137ca4`, popout resize events `bba22fedd`, `setVisible` fixes, z‑index work, pointer event refactors). None of these introduce panel‑constraint enforcement into the overlay or wire group min/max into floating resize. No commits in the wider repo reference issue #725 or a floating min/max fix.

## Verdict
**CONFIRMED_BUG**

## Notes / fix sketch
Two reasonable approaches, both small:

1. (Preferred — single source of truth) Pass an accessor for the contained group's effective constraints into the `Overlay` constructor, e.g.
   ```ts
   getContentConstraints?: () => { minimumWidth: number; maximumWidth: number; minimumHeight: number; maximumHeight: number }
   ```
   then in `setupResize`'s `moveBottom` / `moveRight` use `clamp(y - top, Math.max(minHeight, content.minimumHeight), Math.min(maxHeight, content.maximumHeight))` (and analogously for width and top/left). The `setBounds` path used during initial sizing and `setOptions` updates should also clamp width/height through the same constraints. `DockviewGroupPanel` already exposes the correct values via its `minimumWidth/maximumWidth/minimumHeight/maximumHeight` getters that fall through to the active panel, so the wiring at the `dockviewComponent.ts` call site is one closure.

2. (Lighter‑touch) Have `dockviewComponent.ts` listen to `group.onDidChange` (and active‑panel change) and, instead of just propagating to `overlay.setBounds({ height, width })`, also recompute and update min‑inputs on the overlay. This is harder because the existing `minimumInViewportWidth/Height` semantically means "must remain inside the viewport" not "panel minimum"; conflating them would also affect the off‑viewport clamp behavior. The dedicated‑accessor approach in (1) avoids this.

Edge cases:
- A `maximumWidth/Height` of `Number.POSITIVE_INFINITY` (group default) must be treated as "no upper bound" (no clamp) — match the splitview behaviour.
- Switching the active tab inside a floating group changes the effective constraints; the overlay should reclamp its current size on `group.onDidActivePanelChange` (already plumbed in `dockviewGroupPanelModel`).
- Interaction with `floatingGroupBounds` (issue #817): viewport min and panel min are independent; final min = `Math.max(panelMin, viewportMinComponent)`. Worth keeping both checks explicit in the resize handlers.
- Programmatic `api.setSize` on a floating panel is plumbed through `group.onDidChange -> overlay.setBounds({ height, width })` at `dockviewComponent.ts` L1400–1404; the same clamping should happen in `setBounds` so API‑driven oversize is also rejected.

Complexity: small — ~30 lines, localised to `overlay.ts` (clamp logic) and the one construction site in `dockviewComponent.ts` (wire the accessor). A focused jest test under `packages/dockview-core/src/__tests__/overlay/` plus an integration test under `dockview/dockviewComponent.spec.ts` exercising `addPanel({ floating: ..., minimumWidth, maximumWidth })` would lock the regression down.
