# Issue #1089 — In `themeLightSpaced`, `api.toJSON()` size shifts by 3px after `changeActivePanel`-triggered `onDidLayoutChange`

- URL: https://github.com/mathuo/dockview/issues/1089
- Filed against version: unspecified (filed 2026-02-10)
- Investigated: 2026-05-16
- Investigated by: Claude (opus-4.7, 1M)

## Summary

With `themeLightSpaced` applied, the user logs `api.toJSON()` inside `onDidLayoutChange`. When `changeActivePanel` triggers a second `onDidLayoutChange`, the serialized sibling sizes have shifted by `±3px` (`[454, 1411]` → `[451, 1414]`, both summing to `1865`; orientation HORIZONTAL, width `1875`, gap `10`). The user expects sizes to remain stable when only the active panel changes.

## Reproduces on master?

**Likely yes** (code analysis only). Nothing on master makes the redistribute idempotent for `proportionalLayout`-driven re-layouts, and no commit specifically targets this scenario. The only related fixes in 2026 (#1219 / `5012a663e`, #1245 / `bdf8c49ab`) round inline-style pixel writes and short-circuit no-op `ResizeObserver` cascades — they don't change the `viewItems[i].size` accounting that `serializeBranchNode` reads.

The 3-pixel shift the user observes is consistent with `Splitview.layout()` running once between the two `toJSON()` snapshots and re-rounding view sizes via the saved proportions, then `distributeEmptySpace` redistributing the leftover.

## Relevant code

- `packages/dockview-core/src/gridview/gridview.ts:248-275` — `serializeBranchNode` reads `node.box.height`/`box.width`, which ultimately come from `LeafNode._size`. `_size` is set inside `Splitview.layoutViews()` to `view.size - marginReducedSize` (the "logical" splitview size minus its share of the gap). So whatever drift accumulates in `viewItems[i].size` shows up verbatim in `toJSON`.

- `packages/dockview-core/src/splitview/splitview.ts:674-725` — `Splitview.layout()`. When `proportions` are present (the default for dockview), each pass redistributes:
  ```
  item.size = clamp(Math.round((proportion * size) / total), min, max)
  ```
  followed by `distributeEmptySpace()` which absorbs the rounding remainder onto whichever item it walks first (priority/visibility-driven order, defaulting to the last index).

- `packages/dockview-core/src/splitview/splitview.ts:745-781` — `distributeEmptySpace()`. The leftover `(this.size - contentSize)` is pushed onto a single item, so a 1px rounding miss in one index becomes a 1px adjustment on another. Over a couple of cascades this can shift the split by several pixels even when the outer dimensions are unchanged.

- `packages/dockview-core/src/splitview/splitview.ts:783-789` — `saveProportions()`. Called from `relayout`, `addView` (during `descriptor`), `setViewVisible`, `resizeView`, `addView` no-skip path, and pointer-up sash end. Each time it overwrites `_proportions` with the current `viewItems[i].size / contentSize` — i.e. the post-rounding proportions. So an initial rounding step "locks in" slightly-skewed proportions that the next `Splitview.layout()` then re-quantizes onto a fresh integer grid, producing the next drift.

- `packages/dockview-core/src/gridview/baseComponentGridview.ts:202-211` — `gridview.onDidChange` → `_bufferOnDidLayoutChange.fire()`, and `Event.any(onDidAdd, onDidRemove, onDidActiveChange)` → `_bufferOnDidLayoutChange.fire()`. The second branch is what wires `changeActivePanel` → `onDidLayoutChange`. The event itself does not cause a relayout, but it fires through `AsapEvent` (microtask), giving a `ResizeObserver`/`requestAnimationFrame` callback time to land between the two user-visible events.

- `packages/dockview-core/src/resizable.ts:30-79` — `Resizable.watchElementResize` callback. With `themeLightSpaced` the dockview element receives `padding: 10px` (`packages/dockview-core/src/theme/_space-mixin.scss:14`), so any DOM mutation that changes the inner content size (tab-strip relayout for the newly-active panel, scrollbar appearing/disappearing in the content container, etc.) can produce a `contentRect` 1–2px different from the previous frame, fire a fresh `this.layout(width, height)`, and trigger the proportional re-quantization above. The `_lastWidth`/`_lastHeight` integer dedup added in `5012a663e` (PR #1219) only suppresses identical sizes — not the first non-identical one that follows panel activation.

- `packages/dockview-core/src/dockview/dockviewComponent.ts:1709-1712` — `setActivePanel` → `openPanel(panel)` → `doSetGroupAndPanelActive(group)`. `openPanel` (in `dockviewGroupPanelModel.ts:1328-1377`) calls `contentContainer.renderPanel`, `doSetActivePanel`, and `updateContainer()`. None of these explicitly re-layout the splitview, but they do mutate the DOM inside the group (swap active content), which can perturb the dockview element's content box under `themeLightSpaced`'s padded layout.

## Recent commits that may have touched this

- `5012a663e` (May 2026, #1219) — round `ResizeObserver` contentRect and skip layout on no-change. Reduces the frequency of spurious re-layouts but does not eliminate them when the contentRect genuinely changes by ≥1px.
- `bdf8c49ab` (May 2026, speculative #1245) — round inline pixel writes in `Splitview.layoutViews()`. Affects styling only; `viewItems[i].size` (the value `toJSON` ultimately reports) remains unrounded.
- `49b1c5a17` (Aug 2024) — earlier gap sizing fixes; introduced the current `marginReducedSize` math used in `layoutViews()`.
- `ea9dc1399` / `aed7b97ba` (#613) — original panel-gap styling work.

No commit since #1089 was filed addresses the proportional-redistribute drift in `Splitview.layout()`.

## Verdict

**CONFIRMED_BUG**

The asymmetry is real: dockview re-runs `Splitview.layout()` opportunistically (via `ResizeObserver`, group activation side-effects, etc.), and each pass `Math.round`s the per-item size against the saved proportions before `distributeEmptySpace` mops up the remainder. With `themeLightSpaced`'s `padding: 10px` on the dockview element a panel switch is enough to nudge the observed content box by ≥1px and trigger one of those passes between the two `onDidLayoutChange` events.

A live repro from the reporter (sample widths/heights, exact theme name they pass, whether they're inside a flex container, whether they call `dv.layout()` themselves) would tighten the diagnosis, but the code path is clear enough to act on now.

## Notes / fix sketch

The drift is purely numeric — fix at the splitview layer, not the theme layer.

Two independent levers, either of which would eliminate the visible jitter:

1. **Don't re-quantize when the input size hasn't changed.** In `Splitview.layout(size, orthogonalSize)`, if `size === this._size` and `orthogonalSize === this._orthogonalSize` and no view has flagged a size change since the last `layoutViews()`, skip the whole proportional pass. This is the cheapest fix and matches the spirit of #1219's "dedup no-op resizes" approach. Subtle case: don't skip on the very first `layout()` (when `proportions` were just saved at construction with a different `_size`).

2. **Make the proportional redistribute idempotent.** Instead of `Math.round((proportion * size) / total)` per item and then `distributeEmptySpace`, use a fractional-accumulator pass (largest-remainder method) so that the same `(proportions, size)` input always yields the same integer split. Equivalent in spirit to how `marginReducedSize` is allocated symmetrically across views — only the redistribute step is asymmetric today.

Either fix is local to `packages/dockview-core/src/splitview/splitview.ts` and shippable behind a test that asserts `dv.toJSON()` is stable across `changeActivePanel` when no view has actually changed its preferred size. Existing test infrastructure for this is already present (`repeated expand() does not drift the expanded size (#1241)` at `dockviewComponent.spec.ts:10192`) — the pattern can be reused.

Edge cases to consider:
- Views with `LayoutPriority.High`/`Low` (lever 1 must still re-run if priorities changed; lever 2 must respect priority-aware distribution).
- `cachedVisibleSize` (collapsed views) — both fixes must preserve the invisible-view's stored size verbatim, as today.
- Maximize/restore — these explicitly call `gridview.layout(...)` with a different size; the drift fix must not interfere with intentional re-layouts.
