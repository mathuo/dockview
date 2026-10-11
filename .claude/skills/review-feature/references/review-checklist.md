# Review checklist by layer

Each item names where to look. Tick the rows the diff touches; a row that
does not apply is skipped, not assumed fine. The rule sources are the root
`AGENTS.md`, the per-package `AGENTS.md` files, and the patterns in the
code itself.

## Behaviour and defaults

- [ ] Bug fix: diff changes only what the defect needed. Compare against the
      issue text; anything else is a separate change or a maintainer question.
- [ ] No default changed: size redistribution on close, tab order, active
      panel selection, focus routing, overlay timing, drop zones.
- [ ] New behaviour is opt-in and off by default; the option's doc comment
      states the default.
- [ ] Free bundle unchanged with the module absent: calls go through
      `this.services.<x>?.`, and no core code imports an enterprise module.
- [ ] Events fire after state changes; `onWill*` events are cancellable and
      honoured; `onDid*` are after the fact.
- [ ] Public API additions live on the `api/` objects and are documented;
      removals are replaced by deprecated aliases plus a migration note.

## Options and module plumbing

- [ ] `packages/dockview-core/src/dockview/options.ts`: option typed, TypeDoc
      on every field, key added to `PROPERTY_KEYS_DOCKVIEW`.
- [ ] `packages/dockview-angular/src/lib/dockview/dockview-angular.component.ts`:
      `@Input() <key>?: DockviewOptions['<key>'];` (React and Vue forward
      automatically).
- [ ] Enterprise option: `OPTION_MODULE_RULES` entry whose `when` is true only
      when the user actually asked for the feature (so the free binding's
      `noEnterpriseWarningOnMount` specs stay green); module `options: [...]`;
      `ENTERPRISE_MODULE_NAMES`; `Modules` array in
      `packages/dockview-enterprise/src/index.ts`; `enterpriseModuleNames.spec.ts` green.
- [ ] `moduleContracts.ts`: `IFooHost` exposes only what the service reads;
      `IFooService` only what core calls. `ServiceCollection` slot is optional.
- [ ] `defineModule` has `dependsOn` for every other service it uses; `init`
      returns the disposable.
- [ ] Runtime `updateOptions` either applies (service listens to
      `onDidOptionsChange`) or the doc comment says it is construction-only.
- [ ] Enterprise files import from `dockview`; no `dockview-core`, no `dist/`.

## Exports and generated files

- [ ] New public symbol exported from `packages/dockview-core/src/index.ts`
      (types with `type`).
- [ ] `yarn gen` run; `__generated__/dockview-core-exports.txt` committed.
- [ ] Bindings re-export what they should (`dockview-react` re-exports
      `dockview`; the binding's own index exports new components).
- [ ] Package entry points unchanged, or `types:check` (attw) still passes.

## Serialization and compatibility

- [ ] New serialized field is optional in `types.ts`; absent means the old
      behaviour.
- [ ] `deserializer.ts` honours the field only when the feature is enabled, so
      a layout saved with it on restores cleanly with it off.
- [ ] Round-trip spec: `toJSON` → `fromJSON` preserves the state; back-compat
      spec loads a layout without the field.
- [ ] `onDidLayoutFromJSON` re-seeds service state after restore.

## Lifecycle and multi-window

- [ ] Emitters, listeners, timers and DOM nodes owned by a
      `CompositeDisposable` or the module `init` disposable.
- [ ] Per-panel / per-group bookkeeping pruned on `onDidRemovePanel` /
      `onDidRemoveGroup`.
- [ ] `document` / `window` resolved from the group's element (popouts live in
      another document); listeners attached per window.
- [ ] No module-level mutable state outside the documented singletons.
- [ ] Leak spec (`Emitter.setLeakageMonitorEnabled`) still passes when the
      change adds emitters.

## UI, theming, accessibility

- [ ] Classes use the `dv-` prefix and `--modifier` suffixes; SCSS in
      `dockview-core` only.
- [ ] Themeable values are `--dv-*` custom properties with defaults that keep
      the current look; every shipped theme still renders (check `theme.scss`
      variants).
- [ ] Strings spoken to assistive technology go through `DockviewMessages`;
      announcements through the live region service.
- [ ] Keyboard and context-menu parity for new pointer gestures, documented
      in `packages/docs/docs/advanced/keyboard.mdx` when applicable.
- [ ] `prefersReducedMotion` respected for new animation.

## Code quality (Sonar: new issues must be 0)

- [ ] No `?? {}` / `|| {}` inside a spread; no unused imports, params,
      private members; no needless casts or non-null assertions where a guard
      exists; no `any` where a type is available.
- [ ] Cognitive complexity: long `if` chains or nested loops extracted.
- [ ] Comments describe current state; no "fix", "now", "previously", PR or
      issue numbers unless essential to understanding the code.
- [ ] Follows the neighbour's pattern; no second way of doing an existing
      thing.
- [ ] `yarn lint`, `yarn format:check` clean (docs package is excluded; never
      format it).

## Tests

- [ ] Bug fix has a spec that fails on the base branch.
- [ ] Feature specs: off by default, opt-in, gating, runtime update, round
      trip, disposal, preserved defaults.
- [ ] Specs assert the behaviour, not incidental state; no snapshot of a
      whole DOM tree.
- [ ] Whole affected project run (`--selectProjects`), Vue via Vitest when
      core changed.
- [ ] e2e spec for measured-width, native drop, focus or second-document
      behaviour; PR states it ran locally (Playwright is not in CI).
- [ ] `noEnterpriseWarningOnMount` specs in React, Vue and Angular green.

## Docs and examples

- [ ] Page under `packages/docs/docs/...` with `enterprise: true` frontmatter
      and `sidebar_custom_props` for enterprise features; `<DocRef>` per
      framework for the option.
- [ ] `<CodeRunner id="dockview/<id>" />` backed by all four template
      variants in `packages/docs/templates/dockview/<id>/`; `LicenseManager`
      boilerplate only for enterprise features; entry in
      `packages/docs/src/pages/examples.tsx`.
- [ ] `overview/licence.mdx` table, `releases/whats-new/` and, for behaviour
      changes, `releases/migrating/` updated.
- [ ] `llms.txt` / `llms-full.txt` mention the feature.
- [ ] No `dockview-core`, modules, `registerModules`, inline enterprise list,
      or unlicensed/watermark behaviour in public prose. British spelling, no
      em dashes, no filler words.
- [ ] Package READMEs untouched unless the change is to installation or
      quickstart.

## Pull request

- [ ] Body follows `.github/pull_request_template.md`: description, type,
      affected packages, how to test, checklist.
- [ ] Linked issue (`Fixes <ID>` for Linear, `Fixes #n` for GitHub) when one
      exists.
- [ ] Commit messages are conventional (`fix(scope): ...`, `feat(scope): ...`)
      and describe the behaviour, not the process.
