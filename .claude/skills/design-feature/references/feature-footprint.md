# Feature footprint: pinned tabs as the worked example

Pinned tabs (`pinnedTabs` option, `PinnedTabsModule`, enterprise) is the most
complete recent feature and touches every layer a dockview feature can touch.
Use this file as the checklist when listing the files a new feature needs:
walk each layer and ask "what is this feature's equivalent?". A free feature
skips the enterprise rows; a non-persisted feature skips serialization.

## Core: contracts and options

| Layer | Pinned tabs file | What to look for |
| --- | --- | --- |
| Option type | `packages/dockview-core/src/dockview/options.ts` (`PinnedTabsOptions`, `DockviewOptions.pinnedTabs`) | Object option with `enabled`, defaults documented in TypeDoc comments, listed in `PROPERTY_KEYS_DOCKVIEW`. |
| Option to module rule | `packages/dockview-core/src/dockview/optionsModules.ts` (`OPTION_MODULE_RULES`) | `when: (o) => o.pinnedTabs?.enabled === true`; the reason string is what the missing-module message prints. |
| Enterprise name | `packages/dockview-core/src/dockview/modules.ts` (`ENTERPRISE_MODULE_NAMES`) | Core never imports the module; it holds the name so the diagnostic can name the package. |
| Contract | `packages/dockview-core/src/dockview/moduleContracts.ts` (`IPinnedTabsHost`, `IPinnedTabsService`) | Host exposes `id`, `options`, the events the service subscribes to; service exposes the few calls core makes (`enforceOrder`, `isExcludedFromOverflow`, `resolveDropIndex`). |
| Service slot | `packages/dockview-core/src/dockview/modules.ts` (`ServiceCollection.pinnedTabsService`) | Optional; core calls through `?.`. |
| Exports | `packages/dockview-core/src/index.ts`, then `yarn gen` → `__generated__/dockview-core-exports.txt` | Types exported with `type`; CI fails on a stale generated file. |

## Core: behaviour seams

| Layer | Pinned tabs file | What to look for |
| --- | --- | --- |
| Component host events | `packages/dockview-core/src/dockview/dockviewComponent.ts` | `onDidOptionsChange`, `onDidPanelPinnedChange`, `onDidLayoutFromJSON`; the gated `setPanelPinned` mutation. |
| Panel state | `packages/dockview-core/src/dockview/dockviewPanel.ts` (`isPinned`) | State lives on the panel; the service only orders and gates. |
| Group model | `packages/dockview-core/src/dockview/dockviewGroupPanelModel.ts` | Where the group consults the service. |
| Tab strip | `packages/dockview-core/src/dockview/components/titlebar/tabs.ts`, `tabsContainer.ts`, `components/tab/tab.ts` | Overflow exclusion predicate, drop index resolution, the `dv-tab--pinned` class. |
| Context menu | `packages/dockview-core/src/dockview/contextMenuService.ts` | Built-in `'pin'` item, gated on the option's `contextMenuItem`. |
| Keyboard / a11y | `packages/dockview-core/src/dockview/accessibilityMessages.ts`, `liveRegionService.ts` | Localisable strings and announcements. |
| Styles | `packages/dockview-core/src/dockview/components/titlebar/tabs.scss`, `packages/dockview-core/src/theme.scss` | `dv-tab--pinned`, `dv-tab--pinned-compact`; `--dv-*` variables for anything themeable. |

## Core: public API and persistence

| Layer | Pinned tabs file | What to look for |
| --- | --- | --- |
| Panel API | `packages/dockview-core/src/api/dockviewPanelApi.ts` | `setPinned`, `onDidChangePinned`. |
| Component API | `packages/dockview-core/src/api/component.api.ts` | Any component-level entry point. |
| Serialized shape | `packages/dockview-core/src/dockview/types.ts` | Field on the serialized panel; absent means `false` so old layouts load. |
| Deserializer | `packages/dockview-core/src/dockview/deserializer.ts` | Reads the field back; the service re-seeds on `onDidLayoutFromJSON`. |

## Enterprise

| Layer | Pinned tabs file | What to look for |
| --- | --- | --- |
| Service + module | `packages/dockview-enterprise/src/pinnedTabsService.ts` | `defineModule({ name: 'PinnedTabs', serviceKey: 'pinnedTabsService', create, init, options: ['pinnedTabs'] })`; imports from `dockview`, never `dockview-core`. |
| Registration | `packages/dockview-enterprise/src/index.ts` (`Modules` array) | Order matters only for `dependsOn`. |
| Sync test | `packages/dockview-enterprise/src/__tests__/enterpriseModuleNames.spec.ts` | Fails if `options`, `OPTION_MODULE_RULES` and `ENTERPRISE_MODULE_NAMES` disagree. |

## Framework bindings

| Binding | File | Work needed |
| --- | --- | --- |
| React | `packages/dockview-react/src/dockview/dockview.tsx` | None for a plain option: `IDockviewReactProps extends DockviewOptions` and the effect iterates `PROPERTY_KEYS_DOCKVIEW`. Only new renderers (tab, header action, chip, ghost parts) need React code. |
| Vue | `packages/dockview-vue/src/dockview/dockview.vue`, `types.ts` | Same: props come from `PROPERTY_KEYS_DOCKVIEW`. Slots and scoped renderers need Vue code. |
| Angular | `packages/dockview-angular/src/lib/dockview/dockview-angular.component.ts` | An explicit `@Input() pinnedTabs?: DockviewOptions['pinnedTabs'];` for every new option key. Without it `[pinnedTabs]` raises NG0303. |

## Tests

| Layer | Pinned tabs file |
| --- | --- |
| Enterprise behaviour | `packages/dockview-enterprise/src/__tests__/pinnedTabs.spec.ts` |
| Core seams | `packages/dockview-core/src/__tests__/dockview/components/titlebar/tabsPinnedOverflow.spec.ts`, `tabsContainer.spec.ts`, `contextMenu.spec.ts`, `optionsModules.spec.ts` |
| Keyboard | `packages/dockview-enterprise/src/__tests__/keyboardDocking.spec.ts` |
| Real browser | `e2e/fixtures/index.html` exposes `window.__dv.setupPinned(...)`; `e2e/tests/tab-overflow-dropdown.spec.ts` covers measured overflow. |

## Docs and examples

| Surface | Pinned tabs file |
| --- | --- |
| Feature page | `packages/docs/docs/core/panels/pinnedTabs.mdx` (frontmatter `enterprise: true`, `sidebar_custom_props.enterprise: true`, `<CodeRunner id="dockview/pinned-tabs" />`, `<DocRef declaration="PinnedTabsOptions" />` per framework) |
| Live example | `packages/docs/templates/dockview/pinned-tabs/{react,typescript,vue,angular}/` (enterprise: includes the `LicenseManager` boilerplate; free features must not) |
| Example registry | `packages/docs/src/pages/examples.tsx` (`{ name: 'pinned-tabs', frameworks: [...], enterprise: true }`) |
| Licence table | `packages/docs/docs/overview/licence.mdx` |
| Release notes | `packages/docs/docs/releases/whats-new/whats-new-v8.mdx`; breaking or behavioural changes go in `releases/migrating/` |
| Keyboard reference | `packages/docs/docs/advanced/keyboard.mdx` |
| Model-facing summaries | `llms.txt`, `llms-full.txt` at the repo root (hand-maintained, copied into the docs build) |
| Package READMEs | Only if the README enumerates the feature already; never add an enterprise feature list to a README. |

## Quick self-check for a new feature's note

- [ ] Option typed in core, in `PROPERTY_KEYS_DOCKVIEW`, Angular `@Input()` added
- [ ] Module: contract pair, `ServiceCollection` slot, `defineModule`, `Modules` array, `dependsOn`
- [ ] Enterprise only: `OPTION_MODULE_RULES`, `ENTERPRISE_MODULE_NAMES`, module `options`
- [ ] Exports + `yarn gen`
- [ ] Serialization + old-layout default
- [ ] Disposal and per-window safety
- [ ] `--dv-*` theme variables, `dv-` classes
- [ ] Messages / live region / keyboard / context menu parity
- [ ] Docs page, four templates, `examples.tsx`, licence table, whats-new, `llms*.txt`
- [ ] Specs listed per behaviour, e2e where jsdom cannot reach
