# AGENTS.md - dockview-core

Framework-agnostic core layout engine with zero runtime dependencies. All other packages depend on this one.

## Source Structure

- `src/api/` - Public API interfaces for each component type
- `src/dockview/` - Main dockview component (panels, groups, tabs)
- `src/gridview/` - Grid layout strategy
- `src/splitview/` - Split layout strategy
- `src/paneview/` - Pane/accordion layout strategy
- `src/dnd/` - Drag and drop system
- `src/overlay/` - Overlay/floating group support
- `src/panel/` - Base panel abstractions
- `src/theme/` - Theming system and CSS custom properties

## Build

- `build:cjs` - TypeScript compilation to CommonJS (`tsc` via `tsconfig.json`)
- `build:esm` - TypeScript compilation to ESM (`tsc` via `tsconfig.esm.json`)
- `build:css` - SCSS to CSS compilation (`gulp sass`)
- `build` - All three above in sequence
- `build:bundle` - Rollup UMD bundle (`rollup -c`)
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Testing

- `test` - Jest with ts-jest, jsdom environment
- Config: `jest.config.ts` (project name: `dockview-core`)

## Config Files

- `tsconfig.json` - CJS build config
- `tsconfig.esm.json` - ESM build config
- `jest.config.ts` - Jest configuration
- `rollup.config.js` - Rollup bundle configuration
- `gulpfile.js` - Gulp tasks for SCSS compilation

## Important Notes

- Must be built before all other packages (NX handles this via dependency graph)
- SCSS source files are compiled here; other packages copy the resulting CSS via `scripts/copy-css.js`
