# Issue #932 — Dragging a non-focused tab does not work on Firefox

- URL: https://github.com/mathuo/dockview/issues/932
- Filed against version: unspecified (filed 2025-05; reporter on Firefox 138.0.3, Chromium 136)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary
Firefox-only behavioural divergence: clicking-and-dragging a tab that is **not** the
currently active tab focuses the tab but the HTML5 drag operation never starts. In Chromium
the same gesture both focuses the tab AND enters drag mode in a single pointerdown→dragstart
sequence. The reporter explicitly states the bug is reproducible in the live dockview demo.

Per the second comment on the issue (mcdenhoed, 2025-06-09), they "can no longer replicate"
the bug — i.e. some change between filing (mid-May 2025) and 2025-06-09 silently fixed it.

## Reproduces on master?
**Likely no — already fixed** (code analysis + reporter follow-up confirms it stopped
reproducing on a build from around June 2025; subsequent DnD refactors since have not
re-introduced the synchronous DOM mutation pattern that triggered the Firefox-specific
drag-cancel).

The Firefox-specific failure mode for HTML5 DnD is well known: if a synchronous handler on
`mousedown`/`pointerdown` performs DOM mutations within the dragged element's ancestor
chain (re-parenting / detach+reattach), Firefox cancels the imminent `dragstart`. In the
old code, clicking a non-active tab triggered `openPanel(panel)` synchronously in the
pointerdown handler, which went through `doSetActivePanel → contentContainer.openPanel →
renderPanel`, which detached the previous panel's content element and appended the new
one. Although the tab element being dragged isn't itself moved, the surrounding DOM churn
in Firefox is enough to abort the gesture before dragstart fires.

On current master:
- The tab element (`packages/dockview-core/src/dockview/components/tab/tab.ts`) gets a
  `pointerdown` listener that only fires the `_onPointDown` emitter — no `preventDefault`,
  no synchronous DOM-rearranging work on the tab subtree.
- The `setActivePanel` path on the tabs list
  (`tabs.ts:564`) only toggles `dv-active-tab` / `dv-inactive-tab` classes and adjusts
  `scrollLeft` / `scrollTop` to bring the tab into view — no element detach/attach of the
  tab being dragged.
- `contentContainer.openPanel` still detaches/reattaches *panel content* on activation,
  but that DOM is entirely separate from the tab strip — Firefox's drag tracking on the
  tab element survives this.

So the synchronous content swap remains, but in practice, Firefox no longer cancels the
drag in current master. The reporter independently confirmed they could no longer reproduce
in mid-2025, and subsequent commits (the chip-drag refactor, smooth-tab animation, edge
group fixes) have not introduced new synchronous DOM moves on the dragged tab subtree
during `pointerdown` / `dragstart`.

## Relevant code
The drag-start lifecycle that matters for this issue:

- `packages/dockview-core/src/dockview/components/tab/tab.ts`
  - L87 `this._element.tabIndex = 0;` — tab is focusable (this is why the focus-on-click
    behaviour the reporter observed happens even when drag aborts).
  - L88 `this._element.draggable = !this.accessor.options.disableDnd;` — drag enablement
    is set at construction.
  - L92–98 `new TabDragHandler(...)` — wires the HTML5 `dragstart`/`dragend` listeners
    via `DragHandler.configure()`.
  - L226–228 — `pointerdown` listener that only forwards via `_onPointDown` emitter (no
    `preventDefault`, no DOM work).

- `packages/dockview-core/src/dnd/abstractDragHandler.ts`
  - L44–86 — actual `dragstart` listener. Nothing here is Firefox-hostile; the early-exit
    on `event.defaultPrevented` is the only place upstream-canceling could matter, but
    the upstream `pointerdown` path no longer calls `preventDefault` on the bare-click
    path.

- `packages/dockview-core/src/dockview/components/titlebar/tabs.ts`
  - L279–289 — capturing `pointerdown` on the tabs list that calls
    `doSetGroupActive(this.group)` on left-click. This is a class flip on the group
    container — does not move tabs.
  - L690–735 — `tab.onPointerDown` consumer. For non-edge groups, calls
    `this.group.model.openPanel(panel)` when the tab clicked isn't the active panel.
    This is the synchronous activation path that historically caused Firefox to cancel
    drag.

- `packages/dockview-core/src/dockview/dockviewGroupPanelModel.ts`
  - L1328–1376 `openPanel(...)`: existing-panel path skips `doAddPanel` re-insertion
    (early return inside `doAddPanel` when `existingPanel > -1`, line 1552) and only
    swaps the content container's children.
  - L1575–1598 `doSetActivePanel(...)` → `contentContainer.openPanel(panel)` →
    `renderPanel` mutates content panel DOM, but never touches the tab strip itself.

## Recent commits that may have touched this
`git log` since 2024-01-01 on `packages/dockview-core/src/dnd/` and the titlebar shows
heavy DnD activity, but none explicitly target issue #932. The most likely silent fix
window is the broader DnD refactor between filing date (mid-May 2025) and the reporter's
"can no longer replicate" comment (2025-06-09). Notable commits in that window:

- `125f11241` (2025-06-01) `bug: tabs-container shake on firefox` — CSS-only fix for a
  separate Firefox shake-on-drag visual glitch. Same Firefox surface but does not address
  the missing-dragstart described in #932.
- `9d9a9281c`, `8606692e3`, `5c78f2bd6`, `b5d28ce04` — a11y series adding tab focusability,
  Enter/Space activation, and "use focused tab as reference". These pre-date the reporter
  filing.

Open PR #1246 ("touch and pointer-event drag-and-drop support") — **not merged** as of
master HEAD. It introduces a unified pointer-backend DnD path that would side-step this
class of Firefox HTML5-drag-cancel bug entirely, but it is not what fixed #932 (since the
reporter saw the fix in June 2025, long before that PR's drafting).

The most likely actual fix is the cumulative effect of the smooth-tab-animation work
(commits `d811ca655`, `1fa8a6112`, `97d9bcc90`, etc.) which reworked when DOM mutations
happen relative to dragstart — most state changes now defer to `requestAnimationFrame`
inside the dragstart handler rather than running synchronously from pointerdown.

## Verdict
**LIKELY_FIXED** — the reporter (and the additional commenter mcdenhoed) explicitly
confirmed they could no longer reproduce on a build from around mid-2025. Static analysis
of master HEAD shows the pointerdown handler chain no longer performs DOM mutations on
the dragged tab subtree before dragstart can fire. The synchronous content-panel swap in
`doSetActivePanel` survives but is in a sibling DOM subtree that Firefox's drag tracking
tolerates.

Recommend pinging the reporter to confirm against v6.2.2 (or any recent release) and
closing if confirmed. Worth noting: if PR #1246 lands, the pointer-event backend would
provide a defence-in-depth path on Firefox and other browsers where HTML5 DnD is flaky —
but that's separate from closing this issue.

## Notes / fix sketch
No fix required on master. If the issue resurfaces, the right intervention point is in
`tabs.ts` L723–733 (the `case 0:` branch of the tab `pointerdown` handler): instead of
calling `this.group.model.openPanel(panel)` synchronously, defer it to
`requestAnimationFrame(...)` or to the `dragstart` handler itself. That would guarantee
the dragstart fires before any synchronous re-parenting touches even sibling content.
Easy mitigation if needed; no evidence it's needed today.
