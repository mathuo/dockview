# Issue #957 — not able to set up new tabs, space is reserved for the container but nothing is visible inside

- URL: https://github.com/mathuo/dockview/issues/957
- Filed against version: unspecified (filed 2025-07-02, around dockview-vue 3.x)
- Investigated: 2026-05-16
- Investigated by: opus-4-7

## Summary

User sets up `<DockviewVue>` in a clean Vue 3 project using `<script setup>`. They
import their panel SFCs locally and pass them via a `:components="components"`
binding, then call `api.addPanel({ ... component: 'panel_one' })` in `onReady`.
The container renders (space is reserved), but no panels appear — the inspector
shows `panels: Array(0)`. They expect importing `dockview.css` plus rendering
`<DockviewVue>` to be enough.

## Reproduces on master?

Yes — but this is **USER_ERROR**, not a library defect. Two compounding mistakes:

1. `dockview-vue`'s `<DockviewVue>` does **not** accept a `components` prop. Its
   props are `DockviewOptions & VueProps` (see `packages/dockview-vue/src/dockview/types.ts:8-23`):
   `watermarkComponent`, `defaultTabComponent`, `rightHeaderActionsComponent`,
   `leftHeaderActionsComponent`, `prefixHeaderActionsComponent`,
   `tabGroupChipComponent` — all are `string` names, not records. The
   `:components="components"` binding is silently ignored.

2. The library resolves panel components by **name** using `findComponent`
   (`packages/dockview-vue/src/utils.ts:49-70`), which walks `instance.components`
   up the parent chain and finally falls back to
   `appContext.components`. With `<script setup>`, imported components are
   auto-registered only for that file's own template — they are **not** added to
   `instance.components` or `appContext.components`. So `findComponent` cannot
   locate `PanelOne` / `PanelTwo`.

When `addPanel` runs, `createComponent` → `findComponent` throws
`Failed to find Vue Component 'panel_one'`. The exception propagates out of
`addPanel`, which is why the user's call never adds the panel to the model and
`panels` stays empty. The container itself is created fine, hence the
"reserved space, nothing inside" symptom (group exists with the watermark slot
empty because the `watermarkComponent` prop wasn't set).

The supported usage (per `packages/docs/docs/overview/quickstart.mdx:126-150`
and `packages/dockview-vue/README.md:56-78`) is one of:

- **Options API** registration: `defineComponent({ components: { 'panel-one': PanelOne, ... }, ... })`.
- **App-level** registration: `app.component('panel-one', PanelOne)`.
- **Slot template** form shown in the README:
  `<DockviewVue><template #panel_one="{ params }">...</template></DockviewVue>`
  (note: slot-based resolution is **not** actually wired up in `findComponent`;
  the README example only works because `<DockviewVue>` itself is referenced —
  no real panel templates exist via slots in the current code path).

The user's `<script setup>` style needs an explicit registration, e.g.

```ts
import { getCurrentInstance } from 'vue';
const inst = getCurrentInstance()!;
inst.appContext.components['panel_one'] = PanelOne;
inst.appContext.components['panel_two'] = PanelTwo;
```

…or, more idiomatically, register the components at `app.component(...)` level
in `main.ts`. The "components" prop pattern they used is borrowed from React
(`DockviewReact`) and Angular (`dv-dockview [components]`); the Vue binding
deliberately does it differently.

## Relevant code

- `packages/dockview-vue/src/dockview/dockview.vue:175-264` — `onMounted` builds
  `frameworkOptions` whose `createComponent`/`createTabComponent` call
  `findComponent(inst, options.name)`.
- `packages/dockview-vue/src/utils.ts:49-70` — `findComponent` walks
  `instance.components` chain then `appContext.components`; throws if missing.
- `packages/dockview-vue/src/dockview/types.ts:8-23` — `IDockviewVueProps`
  exposes string-name component props, no `components: Record<string, ...>`.
- `packages/docs/docs/overview/quickstart.mdx:126-150` — official Vue quickstart
  uses Options API `components: { 'my-panel': MyPanel }`.

## Recent commits that may have touched this

```
13c99a766 fix: Vue defaultTabComponent and framework prop runtime updates (#1170)
f3a755d74 fix(dockview-vue): forward didDrop and willDrop events from api
17684d957 fix(dockview-vue): preserve full params in header actions after reactive updates
```

No recent commits change the component-name resolution model. The behaviour
described in this issue is unchanged on master.

## Verdict

**NOT_A_BUG** — user error. The reporter assumed React-style
`:components="{...}"` registration; the Vue binding instead resolves panels by
name via Vue's component registry (`instance.components` /
`appContext.components`). The thrown `Failed to find Vue Component 'panel_one'`
error explains the empty `panels` array. A user-visible fix is **documentation
+ DX**, not code.

## Notes / fix sketch

This is a recurring source of new-user friction (mirrors the React API the
user clearly expected). Two low-cost improvements would make the failure
self-explanatory:

1. **Add a `components` prop to `<DockviewVue>`**: accept a
   `Record<string, Component>` and register them in
   `appContext.components` (or a local lookup) on mount. Tiny, additive change
   — no breakage of existing string-name API. Would let the user's exact code
   snippet work as written.

2. **Better error message**: in `findComponent` (`utils.ts:66`), include a hint:
   `"Failed to find Vue Component 'X'. Register it via components: { X: ... } in your parent SFC, app.component('X', ...), or pass it via the <DockviewVue> components prop."` Right now the error fires inside the dockview-core panel-creation path and is easy to miss in the console.

3. **Quickstart**: add a `<script setup>` variant of the Vue example — every
   real-world Vue 3 codebase uses `<script setup>`, but the only documented
   form is Options API.

Closing comment for the reporter: ask them to register their panels via Options
API `components: {...}` or `app.component(...)`, point at the quickstart, and
suggest moving to a feature request for "components prop on `<DockviewVue>`".
