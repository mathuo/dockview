# AGENTS.md - dockview-react

Thin re-export wrapper providing an alternative package name.

## Overview

- Entire source is one line: `export * from 'dockview'`
- Exists so users can `npm install dockview-react` as an alternative to `npm install dockview`
- No unique source code; all functionality comes from the `dockview` package

## Build

- Build and config mirror the `dockview` package (tsc CJS + ESM, copy-css, rollup bundle)
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Dependencies

- Depends on: `dockview` (not `dockview-core` directly)
- Build chain: `dockview-core` -> `dockview` -> `dockview-react`
