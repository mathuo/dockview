# AGENTS.md - dockview-angular

Angular bindings for dockview using standalone components and NgModule.

## Overview

- Peer dependencies: `@angular/core >=21.0.6`, `@angular/common >=21.0.6`, `rxjs >=7.0.0`
- Runtime dependency: `dockview-core`
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

- `test` - Jest with `jest-preset-angular`
- Setup file: `__tests__/setup-jest.ts`
- Config: `jest.config.ts` (project name: `dockview-angular`)

## Config Files

- `tsconfig.lib.json` - ng-packagr TypeScript config
- `ng-package.json` - ng-packagr package config
- Self-contained tsconfig (does not extend root `tsconfig.base.json`)
- Uses `experimentalDecorators` and `emitDecoratorMetadata`

## Known Issues

- Angular peer deps (`>=21.0.6`) conflict with root devDependencies (`@angular ^17.0.0`). The peer dep version is set for end-user compatibility, while dev uses v17 for build tooling.

## Dependencies

- Depends on: `dockview-core` (must be built first)
