# Issue #981 — defaultRenderer='onlyWhenVisible' does not unmount react component on non-selected tabs

- URL: https://github.com/mathuo/dockview/issues/981
- Filed against version: unspecified (reported 2025-07, before v6.x)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary
With `defaultRenderer='onlyWhenVisible'`, the user reports that inactive panel React components remain "alive": their `useEffect` callbacks keep running and intervals keep firing even though the panel's DOM is not visible. The reporter expected the React component to unmount when the panel becomes inactive (so component lifecycle teardown — `useEffect` cleanups — runs), and remount when re-selected.

## Reproduces on master?
Yes — Likely yes (code analysis). The behaviour is unchanged from the original report. `onlyWhenVisible` only removes the panel's content `<div>` from the visible DOM tree on tab switch; it does not unmount the React subtree that lives inside it.

## Relevant code

Decision site / DOM detach for `onlyWhenVisible`:
- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/components/panel/content.ts:108-159` — `ContentContainer.renderPanel`. When a new panel is opened in a group, the previous panel's `view.content.element` is removed via `this._element.removeChild(this.panel.view.content.element)` (lines 117-125) and the new panel's element is appended (lines 132-143).
- `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/components/panel/content.ts:188-198` — `closePanel` also calls `removeChild` and fires `onHide` for `onlyWhenVisible` panels.
- Default value: `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/dockviewComponent.ts:495-496` — `defaultRenderer ?? 'onlyWhenVisible'`.

React-side renderer (the actual missing piece):
- `/Users/matthewoconnor/Development/dockview/packages/dockview/src/dockview/reactContentPart.ts:12-67` — `ReactPanelContentPart` implements `IContentRenderer`. It creates a `ReactPart` in `init()` and only tears it down in `dispose()`. It does **not** implement the optional `onShow` / `onHide` hooks (added in commit `bdbfaab6a`) declared in `/Users/matthewoconnor/Development/dockview/packages/dockview-core/src/dockview/types.ts:57-58`.
- `/Users/matthewoconnor/Development/dockview/packages/dockview/src/react.ts:110-161` — `ReactPart.createPortal` creates a `ReactDOM.createPortal` rooted at the renderer's `parent` `<div>` and registers it with `portalStore` (kept alive by `usePortalsLifecycle` in `DockviewReact`). The portal lifetime is tied to `ReactPart.dispose()` (called only when the panel is fully removed), not to whether the parent element is currently attached to the visible DOM.

Why the bug manifests: `removeChild` of the content element detaches the panel `<div>` from the document, but React keeps the portal subtree mounted because (a) the portal's `container` element still exists in memory, and (b) the portal is still present in the `portals` state of `DockviewReact` (`usePortalsLifecycle`). React only unmounts portal children when the portal is removed from the render output or the component instance is unmounted. Therefore, `useEffect` cleanups never run, intervals/timers keep firing, and any side effects continue in the background.

## Recent commits that may have touched this

```
bdbfaab6a feat: add onShow/onHide lifecycle hooks to IContentRenderer       (core)
5f338b388 Merge PR #1158 (feat/content-renderer-visibility-hooks)
2aa5fd474 fix: address review bugs — negative index, transition leaks, Angular view detach
7160f7435 fix(dockview-core): use visibility:hidden instead of display:none for always renderer
a9a23cb85 fix(dockview-core): keep dv-render-overlay hidden when visibility flips mid-rAF
19d7430f6 fix: avoid disposal-order crash in Angular renderer teardown (#1220)
ce02eea24 fix(dockview): avoid same-ms useState bailout in ReactComponentBridge
```

`bdbfaab6a` introduced `onShow`/`onHide` on `IContentRenderer` and wires them in `content.ts` for `onlyWhenVisible`, but the React (and likely Vue/Angular) `*ContentPart` classes were not updated to actually use these hooks to unmount/remount their framework subtree. No commits to `packages/dockview/src/dockview/reactContentPart.ts` or `packages/dockview/src/react.ts` address the reported behaviour.

## Verdict
**CONFIRMED_BUG** — at least as the issue is worded by the reporter. There is, however, a reasonable argument that the current behaviour is *by design* for `onlyWhenVisible` (which historically just meant "do not render off-screen via the overlay container") and that full unmount-on-hide is a new mode. The first commenter on the issue raises exactly this — the docs imply current behaviour is intentional, and the reporter then re-frames the ask as "could we have a third renderer mode that fully unmounts?".

Recommend treating this as a **feature request** with a confirmed underlying observation: *components are not unmounted when their tab is not selected*. A useful resolution is one of:

1. Document the current behaviour clearly (panel React component stays mounted; use `api.onDidVisibilityChange` to pause work).
2. Add a third renderer value (e.g. `'destroyWhenHidden'` / `'mountOnDemand'`) that, on `onHide`, calls `ReactPart.dispose()` and recreates the portal on `onShow`.

## Notes / fix sketch

The plumbing for option (2) already exists thanks to `bdbfaab6a`:

- Extend `DockviewPanelRenderer` (`packages/dockview-core/src/overlay/overlayRenderContainer.ts:54`) with a new literal (e.g. `'destroyWhenHidden'`).
- In `ContentContainer.renderPanel` (`content.ts:131`) treat the new value like `onlyWhenVisible` for DOM attach/detach, but also call a new framework-level destroy hook (or simply rely on `onHide` semantics: framework adapters can choose to dispose their subtree there and reinitialise in `onShow`).
- Update `ReactPanelContentPart` to implement `onHide` (dispose the `ReactPart`, null `this.part`) and `onShow` (recreate the `ReactPart` using cached `init` parameters). The same change applies to `dockview-vue` and `dockview-angular` content parts.
- Add Jest coverage analogous to `content.spec.ts:138` for the new mode plus an integration test verifying React `useEffect` cleanup runs on hide.

Complexity: low-medium in core (renderer enum + branching), small in each framework adapter (cache init params, re-init on show). The hardest edge case is preserving framework-side state across remount — by design we are throwing it away, so this is mostly a documentation/UX concern: the reporter explicitly accepts losing state ("I have many expensive components").

Edge cases to watch:
- Floating / popout groups (`renderContainer.attach` path) — new mode should also detach there.
- `asActive: false` deferred render path (`dockviewGroupPanelModel.ts:1223, 1549`) — must not mount until the panel first becomes visible.
- Drag-and-drop reparenting must not trigger a spurious onHide/onShow that destroys then recreates the component mid-drag.
