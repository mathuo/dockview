---
name: design-feature
description: Plan a dockview feature or behavioural change before writing code. Use this whenever the work adds or changes a DockviewOptions field, a module/service, a public API method, a tab/group/drag behaviour, serialization, or an enterprise feature, or when the user says "design", "plan", "spec out", "how should we implement", "add a feature", "new option" or asks where a change should live. Also use it when a bug fix would change a default behaviour, because that needs the same free-vs-enterprise, opt-in and back-compat decisions. Produces a design note listing every layer the change touches (core, enterprise, bindings, docs, tests) and the open questions for the maintainer.
---

# Designing a dockview feature

A dockview feature is rarely one file. The same behaviour has to be declared
in core, wired through the module system, forwarded by three framework
bindings, documented for four frameworks, kept serialisable, and kept off by
default. Most review churn on this repo comes from a layer that was forgotten
rather than from the core logic being wrong, so the job of this skill is to
make the full footprint explicit before any code exists.

Read `AGENTS.md` at the repo root and the `AGENTS.md` of every package you
expect to touch. The rules below assume them.

Three principles run through every step:

- **Follow the existing design patterns.** The codebase already has a way to
  add an option, a service, an event, a drop target, a context-menu item, a
  docs page. Find that way and copy it. A feature that introduces a second
  pattern for something the repo already does is wrong even when it works,
  because every later reader has to learn both.
- **Tests come first.** Write the failing specs from the design before the
  implementation: for a bug the failing reproduction is mandatory (see
  `AGENTS.md`), and for a feature the specs are the executable version of the
  design note. A behaviour you cannot write a test for is a behaviour you have
  not finished designing.
- **End-to-end where it matters.** jsdom cannot measure widths, complete a
  native drag, route real focus or open a second document. Decide up front
  which behaviours need a Playwright spec under `e2e/tests` so they are not
  waved through as "manually verified".

## Step 1: classify the change

Answer these four questions first; everything downstream depends on them.

1. **Free or enterprise?** The free feature set lives in `dockview-core`; paid
   features are modules in `packages/dockview-enterprise`. The current split
   is the table in `packages/docs/docs/overview/licence.mdx` and the
   `ENTERPRISE_MODULE_NAMES` set in `packages/dockview-core/src/dockview/modules.ts`.
   This is a commercial decision, not an engineering one: if the feature is
   new and the user has not said which side it belongs on, list it as an open
   question rather than deciding. Default your draft to whichever side the
   closest existing feature is on and say so.
2. **Module or plain change?** Use a module (a service registered with
   `defineModule`) when the behaviour is opt-in, owns state or subscriptions,
   or is enterprise. Core reaches a module through its optional
   `ServiceCollection` slot, so the free package keeps working when the module
   is absent. A small tweak to existing core behaviour, or a new method on an
   existing API object, does not need a module.
3. **Does it persist?** If the state must survive `toJSON()` / `fromJSON()`
   (pinned flags do; hover state does not), serialization and old-layout
   compatibility are part of the design.
4. **Bug fix or feature?** A bug fix corrects the defect and nothing else. If
   the only fix changes a long-standing default (size redistribution on close,
   tab ordering, focus routing), stop: the design must gate the new behaviour
   behind an opt-in option and raise the default change with the maintainer.
   Passing tests are not permission to change a default.

## Step 2: read the nearest neighbour and copy its pattern

Find the existing feature most like the one being designed and read it end to
end before drafting anything. The module system is consistent, so one worked
example teaches the pattern. `references/feature-footprint.md` walks the
pinned tabs feature through every layer of the repo and is the fastest way to
see the shape; use it as the checklist when listing files for the new feature.

Name the neighbour in the design note and keep to its shape: same option
style, same host/service split, same event naming (`onDid*` after the fact,
`onWill*` when cancellable), same CSS class scheme, same docs page layout.
When the neighbour's pattern genuinely does not fit, say why in the note and
propose the smallest deviation, rather than quietly inventing a new one.

Files that define the contracts, in reading order:

- `packages/dockview-core/src/dockview/modules.ts`: `ServiceCollection`,
  `DockviewModule`, `defineModule`, `registerModules`, `ENTERPRISE_MODULE_NAMES`.
- `packages/dockview-core/src/dockview/moduleContracts.ts`: the `IFooHost` and
  `IFooService` interface pairs. The host interface is the whole surface a
  service may see; keep it to the events and options the service needs.
- `packages/dockview-core/src/dockview/options.ts`: `DockviewOptions`, the
  per-feature option types, and `PROPERTY_KEYS_DOCKVIEW`.
- `packages/dockview-core/src/dockview/optionsModules.ts`:
  `OPTION_MODULE_RULES`, which maps an option to the module that must be
  registered for it to do anything.
- The service file for the neighbour (`packages/dockview-enterprise/src/*Service.ts`
  or `packages/dockview-core/src/dockview/*Service.ts`).

## Step 3: design the option surface

Every v8 addition ships as an opt-in `DockviewOptions` field that is off by
default; the migration guide promises users that upgrading needs no code
changes. Keep that promise:

- Model the option as an object with an `enabled` switch (or a mode value whose
  default is the current behaviour), typed in core `options.ts` even when the
  module lives in enterprise. Document every field with a TypeDoc comment:
  the docs site renders those comments through `<DocRef>`.
- Add the key to `PROPERTY_KEYS_DOCKVIEW`. TypeScript fails the build if you
  forget, which is the point: React and Vue forward every listed key
  automatically, but Angular needs an explicit `@Input()` typed as
  `DockviewOptions['key']` in `dockview-angular.component.ts`, or the binding
  raises NG0303 and silently never reaches core.
- Decide whether the option can change at runtime through `updateOptions`.
  If yes, the service listens to the host's `onDidOptionsChange` and
  retrofits existing groups; if no, say so in the option's doc comment.
- For an enterprise module, add an `OPTION_MODULE_RULES` entry (with the
  `when` predicate that means "the user asked for this") and list the option
  in the module's `options` array. `enterpriseModuleNames.spec.ts` fails when
  the two drift. Also add the module name to `ENTERPRISE_MODULE_NAMES` and to
  the `Modules` array in `packages/dockview-enterprise/src/index.ts`.

## Step 4: design the module wiring

- Split the contract: `IFooHost` (what the component exposes), `IFooService`
  (what the component may call), and a slot on `ServiceCollection`. The
  licence slot is the one exception that is declaration-merged from
  enterprise; do not add others.
- Build the module with `defineModule({ name, serviceKey, create, init, dependsOn, options })`.
  `init` runs once after construction and returns the disposable that tears
  the module down; subscribe to host events there, not from component code.
  Declare `dependsOn` for modules whose services you call (for example
  `AdvancedDnDModule` or `LiveRegionModule`).
- Core calls the service through optional chaining
  (`this.services.fooService?.method()`), so the free bundle must behave
  exactly as before when the module is missing. Design the seams so that
  "service absent" and "option disabled" produce the same result.
- Enterprise files import from `dockview`, never from `dockview-core` and
  never from a `dist/` path.

## Step 5: state, serialization and lifecycle

- If the feature persists, extend the serialized types in
  `packages/dockview-core/src/dockview/types.ts`, write the field in the
  panel or group `toJSON()`, read it in `deserializer.ts`, and seed the
  service from `onDidLayoutFromJSON`. A layout saved before the feature
  existed must still load, so every new field defaults when absent.
- Own disposal explicitly: services extend or compose `CompositeDisposable`,
  and listeners on a group are removed when the group goes. Prune per-panel
  bookkeeping on `onDidRemovePanel` so closed panel ids cannot leak.
- Fire events after the state they describe has changed, and keep event
  payloads to plain data.
- Anything that touches `document` or `window` must use the owning window
  of the group, because popout groups live in another document. Features
  that need a genuine second window are only testable with the Playwright
  harness (see the test-feature skill).

## Step 6: the visible surface

- CSS classes use the `dv-` prefix with `--modifier` suffixes
  (`dv-tab--pinned`). SCSS lives only in `dockview-core`; every other package
  copies the compiled CSS.
- Themeable values are `--dv-*` custom properties declared in
  `packages/dockview-core/src/theme.scss`, with a default that keeps the
  current look.
- Assistive-technology strings go through `DockviewMessages` in
  `accessibilityMessages.ts` so they are localisable, and announcements go
  through the live region service rather than ad-hoc `aria-live` nodes.
- A keyboard path or context-menu item is part of the feature when the mouse
  gesture has one; look at how pinned tabs registers its built-in
  `contextMenuItem` and keyboard shortcut.

## Step 7: public API and exports

- Programmatic control belongs on the API objects in
  `packages/dockview-core/src/api/` (`DockviewApi`, `DockviewPanelApi`,
  group APIs), with events exposed as `onDid*`.
- New public symbols are exported from `packages/dockview-core/src/index.ts`
  (types with the `type` keyword). Running `yarn gen` regenerates
  `__generated__/dockview-core-exports.txt`; CI fails when it is stale, so
  treat an export change as part of the design.
- Deprecate instead of removing: keep the old name as an alias and note it in
  the migration guide.

## Step 8: documentation and examples

Plan the docs with the code, because the docs rules shape the public option
names and wording:

- One page under `packages/docs/docs/` (`core/panels/`, `core/groups/`,
  `core/dnd/`, `advanced/`), with `enterprise: true` in the frontmatter and
  `sidebar_custom_props` for enterprise features. The sidebar is
  autogenerated from the folder, so no `sidebars.js` edit is needed.
- A live example: `<CodeRunner id="dockview/<id>" />` backed by
  `packages/docs/templates/dockview/<id>/{react,typescript,vue,angular}`. All
  four variants, and the `LicenseManager` boilerplate only when the feature
  is enterprise. Register the example in `packages/docs/src/pages/examples.tsx`.
- The licence table in `overview/licence.mdx`, the current
  `releases/whats-new/` page, and the hand-maintained `llms.txt` /
  `llms-full.txt` at the repo root all list features; a new one belongs in
  each.
- Public prose never mentions `dockview-core`, modules, `registerModules`, or
  the unlicensed watermark behaviour, and uses British spelling with no
  em dashes. See `packages/docs/AGENTS.md`.

## Step 9: the test plan, written before the code

The specs are the first files the implementation creates, and they start red.
For each behaviour in the design note, decide its layer now:

- **Unit (jsdom; Jest, or Vitest for the Vue binding)**: logic, ordering, option plumbing, module gating,
  events, serialization round trips, disposal. These live next to the
  neighbour's specs (`packages/dockview-core/src/__tests__/...` or
  `packages/dockview-enterprise/src/__tests__/...`) and bindings get their
  own spec when the wrapper does more than forward an option.
- **End-to-end (Playwright, `e2e/tests`)**: anything that depends on measured
  widths, native drag and drop, real focus, pointer capture, or a popout's
  second document. Playwright does not run in CI, so the design note states
  which specs exist and the PR says they were run locally.
- **A pinning test for every preserved default**: if the change touches a
  behaviour users rely on (sizing on close, tab order, focus), add a spec
  that asserts the current behaviour before touching it, so a regression is
  caught by the suite and not by a user.

The `test-feature` skill has the harness details, recipes and the commands to
run one spec. For a bug fix the order is fixed: failing reproduction, then
the fix, then confirm nothing else changed.

## Output: the design note

Write the note into the scratchpad (or straight into the reply when short)
with these sections. Keep each bullet to one line; the value is in
completeness, not prose.

```
# <Feature name>

## Summary
One paragraph: what the user gets and what they do to get it.

## Classification
Free / enterprise, module / plain, persisted / transient, and why.

## Option surface
The `DockviewOptions` field(s), defaults, runtime-update behaviour.

## Behaviour that must not change
Existing defaults this touches and how the design preserves them.

## Files by layer
- core: ...
- enterprise: ...
- bindings (react / vue / angular): ...
- docs + templates: ...
- generated / exports: ...

## Serialization and compatibility
## Accessibility and keyboard
## Test plan
Unit specs by file, and which behaviours need e2e.

## Open questions for the maintainer
```

The note feeds the `test-feature` skill (specs first) and, once the branch is
ready, the `review-feature` skill, which is run on every branch before a pull
request is opened.

Do not start implementing from an incomplete note. If a classification
question is unresolved and the answer changes the file list, ask; if it only
changes a default, draft with the conservative choice (off, free-side
behaviour unchanged) and flag it.
