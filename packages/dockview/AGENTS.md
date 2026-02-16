# AGENTS.md - dockview

Primary React bindings package. This is what most React users install (`npm install dockview`).

## Overview

- Re-exports everything from `dockview-core` plus React-specific components
- Peer dependency: `react ^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`
- Runtime dependency: `dockview-core`

## Source Structure

- `src/dockview/` - React components for dockview (DockviewReact, etc.)
- `src/gridview/` - React components for gridview
- `src/splitview/` - React components for splitview
- `src/paneview/` - React components for paneview
- `src/react.ts` - React utilities (HOCs, hooks)
- `src/index.ts` - Main entry point, re-exports core + React components

## Build

- `build:cjs` - TypeScript compilation to CommonJS
- `build:esm` - TypeScript compilation to ESM
- `build:css` - Copies CSS from `dockview-core` (`node scripts/copy-css.js`)
- `build` - All three above in sequence
- `build:bundle` - Rollup UMD bundle (externalizes `react` and `react-dom`)
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Testing

- `test` - Jest with ts-jest, jsdom environment
- Uses `moduleNameMapper` to resolve `dockview-core` from source
- Config: `jest.config.ts` (project name: `dockview`)

## Dependencies

- Depends on: `dockview-core` (must be built first)
