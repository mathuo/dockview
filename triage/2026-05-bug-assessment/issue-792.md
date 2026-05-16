# Issue #792 — Popout Window: react-map-gl interaction breaking

- URL: https://github.com/mathuo/dockview/issues/792
- Filed against version: unspecified (Chrome 131, ~Dec 2024)
- Investigated: 2026-05-16
- Investigated by: opus-4-7

## Summary
Reporter has a panel containing a `react-map-gl` (mapbox-gl / maplibre-gl) WebGL map. While the panel lives in the main window, pan/drag/zoom work. After popping the panel out via `addPopoutGroup`, the map renders correctly in the popout window but pointer interactions are broken (drag/pan does nothing; briefly "ticks" only when the mouse crosses back over the main window). A second reporter (#thezboe) confirms the same root cause affects other libraries that attach listeners to `document`/`window` (tooltips, framework teleports, other canvas widgets).

## Reproduces on master?
**Likely yes (code analysis only).** No commit since the issue was filed has changed how panel content is transferred between windows. `addPopoutGroup` still re-parents the existing `group.element` (and via `OverlayRenderContainer.attach`, the panel's `contentElement`) into the popout window's `document` with a plain `appendChild`. The React component instance is not unmounted/remounted, so any `useEffect` that did `window.addEventListener` or `document.addEventListener` ran once against the original window and is never re-run against the popout window.

## Relevant code

Popout setup (DOM re-parent only, no re-mount, no notification to panel renderers):

- `packages/dockview-core/src/dockview/dockviewComponent.ts:838` — `addPopoutGroup(...)`
  - line 968-973: creates a fresh `OverlayRenderContainer` rooted in the popout's `gready` div, swaps `group.model.renderContainer`.
  - line 1019-1021: `popoutContainer.appendChild(gready)` and `popoutContainer.appendChild(group.element)` — these are the only DOM moves. No event re-binding hook is exposed to consumers.
  - line 1049-1053: location is flipped to `{ type: 'popout', getWindow: () => _window.window! }` but no event is fired to tell panel renderers that their owning window changed.
- `packages/dockview-core/src/overlay/overlayRenderContainer.ts:127-164` — `attach()` calls `focusContainer.appendChild(contentElement)`. From React's perspective the component is still mounted; only the parent DOM node changed. `useEffect` cleanup does not run, so mapbox-gl's internal `window.addEventListener('mousemove'/'mouseup'/...)` calls still target the *original* `window`.
- `packages/dockview-core/src/popoutWindow.ts:151-193` — only `addStyles` (stylesheet cloning) is performed against the popout document. No listener-rebinding plumbing.

The mapbox-gl source-of-truth: `Map`'s `HandlerManager` registers global pointer listeners on `window` at construction time (`window.addEventListener('mousemove', ...)`). Once the canvas is moved into another document, those listeners still fire on the original window and the new window's events go unhandled. This is library behaviour, not something dockview can monkey-patch from the outside.

There is also a *secondary* DOM leak visible in the reporter's screenshot: mapbox-gl appends helper divs (controls, popups) directly to `document.body` of whichever document hosted it at construction time. Those orphans remain in the main-window DOM after popout. Same root cause: third-party code captured a `document` reference at mount time.

## Recent commits that may have touched this

`git log --since=2024-01-01 -- packages/dockview-core/src/dockview/dockviewComponent.ts packages/dockview-core/src/popoutWindow.ts packages/dockview-core/src/overlay/overlayRenderContainer.ts` shows ample popout activity:

- `ba4f05b50` — fix: render popout-group popovers in the popout window (popover service now bound to popout `Window` — see line 1037-1040). Conceptually the **closest** dockview has come to "rebind global listeners for the popout"; the fix was scoped to the internal `PopupService` only, not to consumer panel content.
- `eda3afa3b`, `d8916778c`, `05196fd86`, `45ae88245` — popout drag/ghost/blank/position fixes.
- `f640e5bb4` — same-origin URL validation.
- `91b21d32d` — CSP nonce forwarding to popout styles.
- `7ddb63383` — close popout window if unloaded.
- `b76e41bd9`, `3ce6d87d0` — popup-blocked recovery + `onDidBlockPopout`.

None of them re-mount panel content into the popout window or expose a "window changed" hook to panel renderers.

## Verdict
**NOT_A_BUG** (third-party / architectural limitation).

The behaviour the reporter wants — that mapbox-gl's pointer handlers automatically rebind to the popout window — is fundamentally not achievable from inside dockview. Mapbox-gl (and any library that calls `window.addEventListener` once at construction) captures the window/document reference at mount time. Dockview transfers panel content across windows by `appendChild` rather than unmount/remount because React (and all the other framework adapters) lose state on remount. Forcing a remount on popout would break far more users than it fixes.

## Notes / fix sketch

While this can't be "fixed" generically inside dockview, two things could materially help affected users:

1. **Expose `onWindowChange` (or similar) on the panel API.** Fire it from `addPopoutGroup` right after `group.model.location = { type: 'popout', ... }` (line 1049), and again on pop-in (the disposable around line 1128+). Consumers wrapping mapbox-gl could then tear down and re-create the `Map` on that event — costly, but explicit and within their control. The data is already there: `panel.api.location.type === 'popout'` and `getWindow()` are queryable today (`api/dockviewGroupPanelApi.ts:184` area). They just aren't exposed as an event.

2. **Document the limitation.** A docs section under the popout guide explaining "libraries that bind to `window`/`document` at mount time (mapbox-gl, leaflet, some chart libs, framework portals/teleports) will not work across popout boundaries without a remount" would save every future user from rediscovering this. Currently the popout docs don't mention it.

Both are docs/API additions, not core bug fixes. The underlying cross-window event problem is not within dockview's authority to solve for arbitrary third-party libraries.

Related: #793 (react-portals-cache stale ref — same family, also marked NOT_A_BUG). The thezboe comment generalises this to "anything using `document` references across the popout boundary" and is correct.
