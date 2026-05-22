# AGENTS.md - dockview-react

Canonical React bindings package — the public install name users should reach for (`npm install dockview-react`). All documentation, READMEs, and examples point at this package.

## Overview

- Entire source is one line: `export * from 'dockview'`
- Re-exports the implementation from the `dockview` package, which is kept as a legacy alias for backwards compatibility
- No unique source code in this package; functionality lives in the `dockview` package

## Build

- Build and config mirror the `dockview` package (tsc CJS + ESM, copy-css, rollup bundle)
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Dependencies

- Depends on: `dockview` (not `dockview-core` directly)
- Build chain: `dockview-core` -> `dockview` -> `dockview-react`
