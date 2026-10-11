# AGENTS.md - dockview-vue

Vue 3 bindings for dockview.

## Overview

- Uses Vue SFCs (`.vue` files) and composition API
- Peer dependency: `vue ^3.4.0`
- Runtime dependency: `dockview` (re-exports `dockview-core`)

## Build

- `build:js` - Vite build (produces ES, UMD, and CJS outputs)
- `build:types` - Type declarations via `vue-tsc` (`tsconfig.build-types.json`)
- `build:css` - Copies CSS from `dockview-core` (`node scripts/copy-css.cjs`)
- `build` - All three above in sequence
- `build:bundle` - No-op (`echo 'noop'`), Vite already produces all needed formats
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Testing

- `test` - **Vitest** (`vitest run`, jsdom), not Jest: use `vi.fn()` / `vi.spyOn()`, and `mount` from `@vue/test-utils`
- Config: the `test` block in `vite.config.ts`. It aliases `dockview`, `dockview-core` and `dockview-enterprise` to their source and loads `src/__tests__/__mocks__/resizeObserver.vitest.ts`
- `test:cov` - Vitest coverage (`lcovonly`), then `scripts/fix-lcov-paths.cjs` rewrites the paths to repo-root-relative so SonarCloud can merge them with the Jest coverage
- The root `yarn test` / `yarn test:cov` include this package; running it alone: `cd packages/dockview-vue && npx vitest run [spec]`

## Config Files

- `tsconfig.json` - Project references
- `tsconfig.app.json` - App/source config
- `tsconfig.build-types.json` - Declaration-only build config
- `tsconfig.config.json` - Config-file (Vite) type checking
- `tsconfig.typedoc.json` - TypeDoc input
- `vite.config.ts` - Vite build and Vitest configuration

## Dependencies

- Depends on: `dockview` (must be built first; build chain: dockview-core -> dockview -> this)
