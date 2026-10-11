---
name: test-feature
description: Write, place and run tests for dockview. Use this whenever the work involves a spec file, a failing reproduction for a bug, verifying a feature or fix, a serialization round trip, a module or option gating test, a React/Vue/Angular binding test, or a Playwright e2e spec for popout, cross-window, drag-and-drop or measured-layout behaviour. Also use it when deciding which package or layer a test belongs in, how to run a single spec, or why a spec that passes alone fails in the suite. Tests are written before the implementation in this repo, so reach for this skill at the start of a change, not the end.
---

# Testing a dockview change

The repo's rule is tests first: a bug fix starts with a failing reproduction,
and a feature starts with the specs the design note promised. This skill
covers where those specs live, how to drive the layout engine under jsdom,
and when jsdom is the wrong tool.

## Where tests live and how to run them

| Package | Runner | Specs | Setup worth knowing |
| --- | --- | --- | --- |
| `dockview-core` | Jest (`@swc/jest`, jsdom) | `packages/dockview-core/src/__tests__/**/*.spec.ts` | Mocks in `__tests__/__mocks__`, helpers in `__tests__/__test_utils__`. |
| `dockview-enterprise` | Jest (jsdom) | `packages/dockview-enterprise/src/__tests__/*.spec.ts` | `registerModules.ts` registers every enterprise module and seeds a valid licence, so a plain `new DockviewComponent(...)` has the full feature set and no watermark. |
| `dockview-react` | Jest + Testing Library | `packages/dockview-react/src/__tests__/**/*.spec.tsx` | `render` / `act` / `waitFor` from `@testing-library/react`. |
| `dockview-angular` | Jest (`jest-preset-angular`) | `packages/dockview-angular/src/__tests__/*.spec.ts` | TestBed-based; see `dockview-angular.component.spec.ts`. |
| `dockview-vue` | **Vitest** (jsdom) | `packages/dockview-vue/src/__tests__/*.spec.ts` | `mount` from `@vue/test-utils`; config is the `test` block in `vite.config.ts`. Not Jest, so `vi.fn()` not `jest.fn()`. |
| `dockview` | Jest | one smoke spec | Asserts the re-export. |
| e2e | Playwright (real Chromium) | `e2e/tests/*.spec.ts` | Static fixtures under `e2e/fixtures`, driven through `window.__dv`. |

Commands (run from the repo root; the root `jest.config.ts` lists every
package as a project):

```bash
npx jest packages/dockview-core/src/__tests__/dockview/dockviewComponent.spec.ts   # one spec
npx jest --selectProjects dockview-enterprise -t 'pinned'                           # by project and name
npx nx run dockview-core:test                                                       # one package
yarn test                                                                           # everything CI runs
cd packages/dockview-vue && npx vitest run src/__tests__/dockview.spec.ts           # vue
```

Jest is not type-checked at run time (swc strips types), and the lint job
only covers `src/**` outside `__tests__`. A spec with a type error still
passes, so keep specs honest by reading them as code, not just by running
them.

Two things leak between spec files and cause "passes alone, fails in the
suite": the global `PointerDragController` singleton (reset by `jest-setup.ts`
after every test) and the global module registry (`registerModules` is
idempotent and never unregisters). Always run the whole affected project
before pushing, not only the file you edited.

## Pick the right layer

- **Behaviour of the engine** (ordering, sizing, events, option gating,
  serialization, disposal): a core or enterprise Jest spec driving a real
  `DockviewComponent`. Prefer this to mocking a service: the enterprise
  suite is explicitly written against "the shipped wiring, not mocks"
  (see `v8ReviewTriage.spec.ts`).
- **The binding does something beyond forwarding an option**: a binding
  spec. Option forwarding itself is covered by `PROPERTY_KEYS_DOCKVIEW`; a
  binding spec earns its place for renderers, slots, lifecycle, change
  detection, and the "no enterprise warning on mount" guard.
- **Anything jsdom cannot model**: a Playwright spec. jsdom has no layout
  (every width is 0 unless mocked), no native drag and drop, no real focus
  routing, and the popout mock (`setupMockWindow`) reuses the main document.
  Measured overflow, drop position from pointer coordinates, popout focus and
  per-window live regions are e2e.

## Bug fixes: the failing test first

1. Write the spec that encodes the correct behaviour, run it, and watch it
   fail against the current code. Paste the failing assertion into the PR
   description if it is not obvious from the test name.
2. Make it pass with the smallest change.
3. Run the whole project. If an existing spec now fails, that spec is telling
   you the fix changed a behaviour users rely on. Do not edit the old
   assertion to match: either narrow the fix or stop and raise the default
   change with the maintainer, as `AGENTS.md` requires.

The spec asserts the defect and nothing else. Incidental assertions about
unrelated state make the next refactor harder for no safety gain.

## Features: specs from the design note

Write one `describe` per behaviour in the design note, starting with:

- **Off by default**: with the option unset, the DOM and behaviour are
  identical to before. Snapshot the relevant class list or order rather than
  the whole tree.
- **Opt-in works**: the happy path with `{ enabled: true }`.
- **Module gating**: for an enterprise option, `optionsModules.spec.ts` style
  coverage that the missing-module diagnostic names the right module, and
  `enterpriseModuleNames.spec.ts` stays green.
- **Runtime update**: `updateOptions({...})` applies to existing groups, if
  the design says it should.
- **Serialization round trip**: `toJSON()` → new component → `fromJSON()` →
  assert; and a layout without the new field still loads.
- **Disposal**: `dispose()` removes listeners and DOM; closing a panel prunes
  per-panel state.
- **Preserved defaults**: a spec pinning any existing behaviour the change
  sits next to, written before touching it.

## Driving the engine under jsdom

`references/jest-recipes.md` has copy-ready snippets. The essentials:

- Build a component with a `createComponent` factory returning a minimal
  `IContentRenderer`, call `dockview.layout(width, height)`, then
  `addPanel`. Pass options directly in the constructor.
- `ResizeObserver` and `PointerEvent` do not exist in jsdom; the package
  Jest configs load mocks from `packages/dockview-core/src/__tests__/__mocks__`
  (`resizeObserver.js`, `pointerEvent.js`). The Vue config has its own
  `resizeObserver.vitest.ts`.
- Geometry is mocked, not measured: `mockGetBoundingClientRect(...)` from
  `__test_utils__/utils.ts` on a `jest.spyOn(element, 'getBoundingClientRect')`.
- Async settling: `exhaustMicrotaskQueue()` and `exhaustAnimationFrame()`
  from the same utils; `jest.useFakeTimers()` for debounce and timeout paths.
- Partial objects: `fromPartial<T>(...)` from `@total-typescript/shoehorn`
  instead of `as any` casts.
- DOM events: `fireEvent` from `@testing-library/dom`;
  `createOffsetDragOverEvent` for drag-over with coordinates.
- Popouts: `setupMockWindow()` and `setupDeferredMockWindow()` from
  `__mocks__/mockWindow.ts`. The deferred variant lets a test control when
  `load` fires so two popouts can be staggered. Remember it is the same
  document, so cross-document assertions belong in e2e.
- Enterprise specs import from `dockview` (mapped to source by
  `moduleNameMapper`), not from `dockview-core`.

## End-to-end specs

Read `e2e/README.md` first. Build the bundles the fixtures load, then run:

```bash
yarn nx run-many -t build:bundle -p dockview-core dockview dockview-enterprise
yarn nx run dockview-vue:build:js       # only for the vue fixtures
yarn test:e2e                            # or: npx playwright test e2e/tests/<name>.spec.ts
```

Conventions:

- Drive the layout through `window.__dv` in `e2e/fixtures/index.html`
  (`addPanel`, `setupPinned`, `popoutActiveGroup`, ...). Add a named helper to
  the fixture rather than building layouts inline in the spec, so the next
  spec can reuse it.
- Wait on `window.__ready` before interacting; capture a popout with
  `context.waitForEvent('page')` and assert against that `Page`.
- Each spec opens with a comment stating why it is real-browser only
  (measured widths, native drop, second document). If you cannot write that
  sentence, it belongs in Jest.
- Playwright is **not** part of the CI workflow. Say in the PR that the e2e
  specs were run locally and which ones. WebKit is opt-in via
  `PLAYWRIGHT_WEBKIT=1` for engine-specific selection or drag behaviour.

## Framework binding specs

- React: `render(<DockviewReact components={...} onReady={...} />)`, capture
  the `DockviewApi` from `onReady`, wrap API calls that cause React updates
  in `act`. Portal-rendered panels appear in `document.body`, not only in the
  container.
- Vue: `mount(DockviewVue, { props: { components, ... } })`, then
  `await flushPromises()` / `nextTick()` after API calls. Use `vi` for spies.
- Angular: `TestBed.configureTestingModule` with the standalone component,
  `fixture.detectChanges()` after input changes. The binding tests also cover
  that every `PROPERTY_KEYS_DOCKVIEW` key has an `@Input()`; keep that spec
  green when adding an option.
- All three have a `noEnterpriseWarningOnMount` guard: mounting the free
  binding with no enterprise options must not log the missing-module
  message. A new option with a wrong `when` predicate in
  `OPTION_MODULE_RULES` breaks it.

## Before you push

- The failing-then-passing spec exists for every bug fix.
- The whole affected Jest project passes, not just your file, and the Vue
  suite if you touched core or the Vue binding.
- `yarn lint`, `yarn format` and `yarn gen` are clean. Tests are excluded
  from Sonar, so lint smells in specs are reviewed by people, not tools.
- e2e specs named in the PR with a note that they ran locally.
