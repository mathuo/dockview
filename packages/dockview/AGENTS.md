# AGENTS.md - dockview

The canonical **vanilla JavaScript / TypeScript** package — a thin re-export of
[`dockview-core`](../dockview-core/AGENTS.md). This is the package framework-agnostic
consumers should install (`npm install dockview`). Framework bindings live in the
`dockview-<framework>` packages, all of which depend on this package.

> History: prior to v7 this package contained the React bindings. Those now live in
> [`dockview-react`](../dockview-react/AGENTS.md). See the repo-root README / docs for
> the v7 migration notes.

## Overview

- `src/index.ts` is one line: `export * from 'dockview-core'`
- No unique source; functionality lives in `dockview-core`
- Runtime dependency: `dockview-core`
- No `react` peer dependency

## Build

- `build:cjs` - TypeScript compilation to CommonJS
- `build:esm` - TypeScript compilation to ESM
- `build:css` - Copies CSS from `dockview-core` (`node scripts/copy-css.js`)
- `build` - All three above in sequence
- `build:bundle` - Rollup bundle (UMD bundle is self-contained for CDN; the npm package bundle externalizes `dockview-core`)
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Testing

- `test` - Jest with ts-jest, jsdom environment (smoke test asserting the core re-export)
- Uses `moduleNameMapper` to resolve `dockview-core` from source
- Config: `jest.config.ts` (project name: `dockview`)

## Dependencies

- Depends on: `dockview-core` (must be built first)
