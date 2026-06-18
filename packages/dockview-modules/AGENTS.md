# AGENTS.md - dockview-modules

A separately-published home for a subset of dockview's feature modules. Depends
on `dockview-core`; consumed by `dockview` (which registers these modules so the
batteries-included entry point keeps its full feature set).

> Neutral alias — keep commercial/tier language out of this package, its code,
> and commit messages.

## Modules hosted here

- `TabGroupChipsModule` (`tabGroupChipsService.ts`)
- `ContextMenuModule` (`contextMenu.ts`)
- `AdvancedDnDModule` (`advancedDnDService.ts`)
- `AccessibilityModule` (`accessibilityService.ts`) — `dependsOn` AdvancedDnD
  (here) and LiveRegion (stays in core)

`src/index.ts` exports each module plus a `Modules` bundle array.

## How it fits the module system

- Core owns the contracts: the `ServiceCollection` slots and the `IFooService`
  / `IFooHost` interfaces in `dockview-core` (`dockview/moduleContracts.ts`).
  Core code only ever touches `services.fooService?.` — never an implementation
  here. Option types also stay in core (`dockview/options.ts`).
- These files import what they need from the `dockview-core` **main entry**
  (`'dockview-core'`); the few internals they require (`defineModule`, the
  contracts, `resolveMessages`, `findRelativeZIndexParent`, `IDragGhostSpec`,
  `LiveRegionModule`) are exported from core's public index. No `dist/` deep
  imports.
- Registration is global: `dockview` calls `registerModules(Modules)` at import
  time. `DockviewComponent` appends globally-registered modules to its built-in
  set at construction.

## Build / Test

- `build` - tsc CJS + ESM (no CSS; styles live in core)
- `build:bundle` - rollup; externalizes `dockview-core`
- `test` - Jest (jsdom). `src/__tests__/registerModules.ts` registers `Modules`
  globally so a default `DockviewComponent` in tests has the full feature set;
  ResizeObserver/PointerEvent jsdom mocks are reused from core.

## Dependencies

- Depends on: `dockview-core` (build chain: `dockview-core` -> `dockview-modules` -> `dockview`)
