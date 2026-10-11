# AGENTS.md - dockview-react

The **React bindings** package (`npm install dockview-react`). Contains the actual React
source — `DockviewReact` and the gridview/splitview/paneview React components, portal
bridge, hooks. All documentation, READMEs, and examples point at this package for React.

> History: prior to v7 this source lived in the `dockview` package and `dockview-react`
> was a thin re-export of it. From v7 the source lives here, and `dockview` is the
> vanilla re-export of `dockview-core`.

## Overview

- Re-exports everything from `dockview` (which re-exports `dockview-core`) plus React-specific components
- Peer dependency: `react ^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`
- Runtime dependency: `dockview` (not `dockview-core` directly)

## Source Structure

- `src/dockview/` - React components for dockview (DockviewReact, etc.)
- `src/gridview/` - React components for gridview
- `src/splitview/` - React components for splitview
- `src/paneview/` - React components for paneview
- `src/react.ts` - React utilities (HOCs, hooks, portal bridge)
- `src/svg.tsx`, `src/types.ts` - Shared icons and prop types
- `src/index.ts` - Main entry point, re-exports `dockview` + React components
- Options: `IDockviewReactProps extends DockviewOptions` and the component forwards every `PROPERTY_KEYS_DOCKVIEW` key, so a new core option needs no React change unless it introduces a renderer

## Build

- `build:cjs` - Type declarations via `tsc` (`emitDeclarationOnly` → `dist/cjs/**/*.d.ts`); runtime JS ships as the rolldown bundles
- `build:css` - Copies CSS from `dockview-core` (`node scripts/copy-css.js`)
- `build` - `build:cjs` + `build:css`
- `build:bundle` - rolldown bundles: the CJS/ESM package entries (`dist/package`) and the UMD/CDN bundle (self-contained for CDN; externalizes `react` and `react-dom`)
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Testing

- `test` - Jest with `@swc/jest`, jsdom environment, Testing Library (`render` / `act` / `waitFor`)
- Uses `moduleNameMapper` to resolve `dockview` and `dockview-core` from source
- `lint` / `format` - Biome over `src`
- Config: `jest.config.ts` (project name: `dockview-react`)

## Dependencies

- Depends on: `dockview` (build chain: `dockview-core` -> `dockview` -> `dockview-react`)
