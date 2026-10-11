# AGENTS.md - dockview-angular

Angular bindings for dockview using standalone components and NgModule.

## Overview

- Peer dependencies: `@angular/core >=21.0.6`, `@angular/common >=21.0.6`, `rxjs >=7.0.0`
- Runtime dependency: `dockview` (re-exports `dockview-core`)
- Entry point: `src/public-api.ts` (ng-packagr entry)

## Source Structure

- `src/public-api.ts` - Public API surface (ng-packagr entry point)
- `src/lib/` - Angular components and services
- `src/index.ts` - Re-exports

## Build

- `build:angular` - Angular Package Format build via `ng-packagr` (`ng-packagr -c tsconfig.lib.json -p ng-package.json`)
- `build:css` - Copies CSS from `dockview-core` (`node scripts/copy-css.js`)
- `build` - Both above in sequence
- No `build:bundle` script (removed due to known OOM issue on limited-heap machines)
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Testing

- `test` - Jest with `jest-preset-angular` (TestBed)
- Setup file: `src/__tests__/setup-jest.ts`
- Config: `jest.config.ts` (project name: `dockview-angular`)
- `dockview-angular.component.spec.ts` asserts that every `PROPERTY_KEYS_DOCKVIEW` key has an `@Input()`: a new core option needs `@Input() <key>?: DockviewOptions['<key>'];` in `dockview-angular.component.ts`, or `[key]` bindings raise NG0303 and never reach core

## Config Files

- `tsconfig.lib.json` - ng-packagr TypeScript config
- `tsconfig.spec.json` / `tsconfig.test.json` - Jest configs
- `ng-package.json` - ng-packagr package config
- Self-contained tsconfig (does not extend root `tsconfig.base.json`)
- Uses `experimentalDecorators` and `emitDecoratorMetadata`

## Dependencies

- Depends on: `dockview` (must be built first; build chain: dockview-core -> dockview -> this)
