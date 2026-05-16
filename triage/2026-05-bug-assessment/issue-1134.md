# Issue #1134 — When api.fromJSON() is invoked to transfer the result returned by toJSON, an error is reported

- URL: https://github.com/mathuo/dockview/issues/1134
- Filed against version: dockview-vue 5.1.0 (filed 2026-03-19 by @gcokee)
- Investigated: 2026-05-16
- Investigated by: Claude (Opus 4.7)

## Summary
A Vue 3 user calls `dockview.toJSON()` to snapshot the layout and then later
`dockview.fromJSON(layout)` to restore it. The restore call throws
`Uncaught (in promise) TypeError: Cannot read properties of null (reading 'emitsOptions')`.
The reporter expects the save/restore round-trip to succeed. No reproduction
sandbox or stack trace was attached — only the snippet above and a vague step
list ("Click on '....'").

## Reproduces on master?
**Cannot reproduce from code analysis alone.** The error message
`Cannot read properties of null (reading 'emitsOptions')` is a *Vue-internal*
diagnostic — `emitsOptions` is a property on Vue's `ComponentInternalInstance`
that is read inside `createVNode` / `render` during component mount. None of
dockview-core or dockview-vue's source mentions `emitsOptions` (verified via
`grep -r emitsOptions`).

The error therefore originates from the Vue runtime when it is asked to mount
the user's panel components after `fromJSON` re-creates panels. Without the
user's panel component implementations and the full stack trace we cannot
verify which Vue-side condition is being hit (most likely candidates: a stale
`ComponentInternalInstance` reference, a user component imported as `null`,
or a `defineAsyncComponent` factory that has resolved to `null`).

Importantly, the core round-trip is exercised by Jest tests on master and
passes — `dockview.fromJSON(dockview.toJSON())` is asserted to work for both
the in-grid case and the popout case (see "Relevant code" below). The
serialization format is symmetric: every field `toJSON()` writes is consumed by
`fromJSON()`.

## Relevant code

### Round-trip is symmetric on the core side

`packages/dockview-core/src/dockview/dockviewComponent.ts`:

- `toJSON()` at lines **1764–1827**. Writes `grid`, `panels`, `activeGroup`, and
  conditionally `floatingGroups` (line 1804), `popoutGroups` (1808), and
  `edgeGroups` (1812).
- `fromJSON()` at lines **1829–2182**. Reads back every one of those fields:
  panels via `_deserializer.fromJSON` (1937, 2027), float positions (2069–2083),
  popouts (2085–2115 — gated behind `DESERIALIZATION_POPOUT_DELAY_MS` and
  surfaced via `_popoutRestorationPromise`), edge groups (1995–2067), and
  `activeGroup` (2126–2131).
- Tab groups inside a group are also round-tripped (`tabGroups` is restored at
  lines 1971–1973 and 2044–2052).
- Group serialization (`group.toJSON()` → `restoreTabGroups` /
  `createGroup({ id, locked, hideHeader, headerPosition })`) covers
  `locked`, `hideHeader`, `headerPosition`, `views`, `activeView`, and
  `tabGroups` (see `createGroupFromSerializedState` at lines 1892–1985).

So on the core/serialization side the round-trip is sound — no field is
written by `toJSON` that `fromJSON` cannot consume.

### Existing round-trip tests on master

`packages/dockview-core/src/__tests__/dockview/dockviewComponent.spec.ts`:

- Line **2343**: `dockview.fromJSON(dockview.toJSON())` inside the
  always-renderer positioning test (basic in-grid case).
- Lines **7270–7329**: `popout single panel -> save layout -> load layout`
  exercises a real popout group through the round-trip and asserts panel /
  group counts and visibility.

There is **no** Vue-specific round-trip test in
`packages/dockview-vue/src/__tests__/` (only `paneview.spec.ts` references
`toJSON`, and only on the splitview side). So a Vue-mount-on-restore regression
could exist undetected.

### Vue mount path during `fromJSON`

When `fromJSON` recreates a panel it calls `createComponent`, which in
dockview-vue routes to `VueRenderer` and `mountVueComponent`:

- `packages/dockview-vue/src/dockview/dockview.vue:185-188` —
  `createComponent` returns `new VueRenderer(component!, inst)` where `inst` is
  the parent `ComponentInternalInstance` captured at `onMounted` time.
- `packages/dockview-vue/src/utils.ts:76-103` — `mountVueComponent` builds a
  `VNode` via `createVNode(component, Object.freeze(props))`, then sets
  `vNode.appContext = parent.appContext` and mutates `appContext.provides`
  before calling Vue's `render`.

If `component` (the resolved user panel) or `parent` ever resolves to `null`
here, Vue's render pipeline will trip on `null.emitsOptions`. `findComponent`
(`utils.ts:49-70`) explicitly throws when nothing is resolved, so the null is
not coming from the lookup function itself. The most likely real-world
triggers (which we cannot verify without the reporter's code) are:

1. The user passing a `null`/`undefined` component via global registration
   shadowing (e.g. an async component that resolved to `null`).
2. The host Vue app having been torn down (e.g. component unmount) between
   `toJSON` and `fromJSON`, leaving `inst` as a stale `ComponentInternalInstance`
   whose internal pointers are nulled.
3. A Vue major-version mismatch between the app and dockview-vue's peer dep.

## Recent commits that may have touched this

`git log --since="2024-01-01"` for the relevant files shows the round-trip /
serialization path has been actively maintained, but no commit specifically
addresses a `null.emitsOptions` error:

- `669148530` fix: attach "always" renderer panels to DOM during fromJSON
- `e098b5cbd` feat: add headerPosition serialization and tests
- `48ed91977` fix: remove unnecessary as-any cast in fromJSON; add removeEdgeGroup tests; add edge groups docs page
- `ac909780a` feat: fixed panels — collapse event, serialization fix, and options filter
- `bfed9b0a2` fix: stop toJSON from firing onDidMaximizedNodeChange
- `8766a5fd4` fix: address PR review issues — terminology, leaks, deserialization, types
- `f3a755d74` fix(dockview-vue): forward didDrop and willDrop events from api
- `17684d957` fix(dockview-vue): preserve full params in header actions after reactive updates

None target a `null` Vue component instance during deserialization.

## Verdict
**CANNOT_REPRODUCE** — the user's report does not contain a working repro,
their snippet has typos (`@click-` instead of `@click=`, untyped `let layout: string`
holding what is actually an object, missing `addPanel` body), and the failing
field (`emitsOptions`) is Vue-internal rather than dockview. The core
round-trip is exercised by tests and is symmetric. We need a live repro from
the reporter (CodeSandbox or full repo) before any fix can land.

## Notes / fix sketch

### What to ask the reporter for
1. The full panel component definitions (especially whether any are
   `defineAsyncComponent` / dynamic imports).
2. Browser console stack trace from the moment the error fires (specifically
   the frame inside `runtime-core.esm-bundler.js`).
3. Versions: `vue` exact version, `dockview-vue` exact version, plus
   confirmation they are running master/6.2.2 rather than the originally
   filed 5.1.0.
4. Whether the error reproduces on the official Vue starter sandbox in
   `packages/docs/sandboxes/` (note: there are currently **no** Vue sandboxes —
   only React — so this is a gap worth closing).

### Hardening regardless of repro
- Add a Vue-side regression test that exercises `fromJSON(toJSON())` against
  a tiny `<App>` with real Vue panel components. Today
  `packages/dockview-vue/src/__tests__/` only round-trips the splitview/paneview
  paths, never `DockviewComponent`.
- Consider defensive null checks in `mountVueComponent` (`utils.ts:76-103`)
  to throw a clear dockview-prefixed error rather than letting Vue surface
  `Cannot read properties of null (reading 'emitsOptions')` — currently the
  error gives users zero clue that the source is their component being null.
