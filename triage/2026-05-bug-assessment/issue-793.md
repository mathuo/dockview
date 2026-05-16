# Issue #793 — react-portals-cache issue when using ref's

- URL: https://github.com/mathuo/dockview/issues/793
- Filed against version: unspecified (filed 2024-12-20)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary

User has a root `DockviewReact` with two child `DockviewReact` "layouts", each rendering a shared panel component that wraps `BryntumGrid` (a third-party imperative grid library that uses an external `ref` to manage its own DOM). Switching from Layout 1 to Layout 2 leaves the BryntumGrid panel content empty — the visible DOM shows an empty `react-portals-cache` element. Closing and re-adding the panel fixes it. A sibling `BryntumGantt` panel using the same pattern works fine. The user expects shared panel components to keep rendering across layouts.

## Reproduces on master?

**Likely no** — for a dockview-only repro. The reported symptom (`react-portals-cache` empty element) belongs to the user's third-party stack (Bryntum / a separate `react-portals-cache` library), not dockview. The dockview owner already confirmed in the thread that this string does not appear anywhere in the dockview source, and `grep -rn react-portals-cache packages/` on master HEAD still returns zero hits. The underlying behavior is consistent with how dockview's React adapter is *supposed* to work: when a panel is unmounted from one `DockviewReact` instance and (eventually) mounted in another, the React portal is disposed and a brand new portal/`createPortal` call is made for the new mount. An imperative library that captured the previous DOM node via a ref will not re-attach itself to the new parent — that is library-specific behavior (BryntumGrid evidently caches; BryntumGantt evidently re-renders, which explains the reporter's own observation that one works and the other doesn't).

## Relevant code

- `packages/dockview/src/react.ts:31-60` — `ReactComponentBridge`: forwards the user's component through a `ReactDOM.createPortal` mount. Refs *are* forwarded transparently because the bridge just calls `React.createElement(props.component, _props.current)` — there is no interception of refs.
- `packages/dockview/src/react.ts:75-167` — `ReactPart`: constructs a `ReactDOM.createPortal(node, this.parent, uniqueKey)` and registers it via `portalStore.addPortal`. On `dispose()` the portal is removed via `disposable.dispose()`. This is the lifecycle hook: when a panel is removed from its `DockviewReact` instance, this is unconditionally called and the portal is unmounted.
- `packages/dockview/src/react.ts:179-199` — `usePortalsLifecycle`: each `DockviewReact` has its own portal array. Two nested DockviewReact instances are completely independent portal stores — there is no portal sharing between them, so any panel that "moves" from Layout 1 to Layout 2 is in fact unmounted and re-mounted in React's tree, NOT physically moved.
- `packages/dockview/src/dockview/reactContentPart.ts:41-66` — `ReactPanelContentPart.init/dispose`: per panel, creates a single `ReactPart` for the lifetime of that panel within ONE dockview instance. There is no notion of carrying a single mount across DockviewReact roots.
- `packages/dockview-core/src/dockview/dockviewGroupPanelModel.ts:1548-1550` — `defaultRenderer='always'` only keeps the panel rendered inside its own group/dockview; it does not span dockview instances. (User confirmed `'always'` did not help, consistent with this.)
- `packages/docs/sandboxes/react/dockview/demo-dockview/` — the dockview demo path the user said they followed; reviewing it shows components are registered per `DockviewReact`, identical to the pattern in this report.

## Recent commits that may have touched this

```
$ git log --since="2024-12-01" --oneline -- packages/dockview/src/react.ts packages/dockview/src/dockview/reactContentPart.ts
ce02eea24 fix(dockview): avoid same-ms `useState` bailout in ReactComponentBridge
586b770ce nx: format
b3ce3e036 feat: rename class
```

`ce02eea24` (the monotonic-counter fix for `useState`) hardens the bridge's update path but is unrelated to ref forwarding or to portal teardown across instances. No commit since the issue was filed changes the per-instance portal model that underlies this report. `packages/dockview-react/` is a one-line re-export and has no other source.

## Verdict

**NOT_A_BUG** (tangential to dockview / third-party-library interaction).

## Notes / fix sketch

- The `react-portals-cache` element the user screenshots belongs to a separate library (likely `react-portals-cache` on npm or an internal Bryntum helper). It is NOT dockview's portal container — dockview attaches portals directly to the panel's content `div` (`dv-react-part`).
- Root cause is almost certainly: BryntumGrid is instantiated once against the DOM node attached to Layout 1's portal target. When Layout 1's `DockviewReact` is hidden / a different one is shown, that portal target is removed and React unmounts the panel. The user's `gridRef` still holds the previous BryntumGrid instance, which is now divorced from any visible DOM. When the panel "re-mounts" in Layout 2, the user's `XGrid` functional component runs again but passes the SAME stale `gridRef` to a new `<BryntumGrid>`, which inside Bryntum may short-circuit because it sees the ref is already populated, producing an empty content area. The Gantt component must do a fuller re-bind, hence it works.
- Recommended response to the reporter:
  1. Confirm `react-portals-cache` is not from dockview.
  2. Suggest the panel component own its own ref via `useRef` instead of receiving one from the parent across DockviewReact instances; if the parent needs access, expose it imperatively after mount.
  3. Alternatively, instead of two nested `DockviewReact` "layouts", use ONE `DockviewReact` and toggle visible panels via `panel.api.setVisible(false)` / `setVisible(true)` — that keeps the mount stable and lets `defaultRenderer='always'` actually preserve the DOM.
- No dockview code change is warranted; close as `not-a-bug` or `question` once the reporter confirms (or after a stale-bot window).
