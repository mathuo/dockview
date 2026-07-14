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

- `build:cjs` - Type declarations via `tsc` (`emitDeclarationOnly`, `tsconfig.json` → `dist/cjs/**/*.d.ts`). The runtime JS ships as the rolldown bundles (`build:bundle`), so this pass emits only the `.d.ts`.
- `build:css` - SCSS to CSS compilation (`node scripts/build-css.js`, using `sass-embedded`)
- `build` - `build:cjs` + `build:css`
- `build:bundle` - rolldown bundles: the CJS/ESM package entries (`dist/package`) and the UMD/CDN bundles (`rolldown -c rolldown.config.mjs`)
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Testing

- `test` - Jest with `@swc/jest`, jsdom environment (not type-checked at run time; types are checked in the build via `tsc`)
- Config: `jest.config.ts` (project name: `dockview-core`)

## Config Files

- `tsconfig.json` - CJS build config
- `tsconfig.esm.json` - ESM build config
- `jest.config.ts` - Jest configuration
- `rolldown.config.mjs` - rolldown bundle configuration
- `scripts/build-css.js` - Compiles + concatenates SCSS to `dist/styles/dockview.css` (`sass-embedded`)

## Important Notes

- Must be built before all other packages (NX handles this via dependency graph)
- SCSS source files are compiled here; other packages copy the resulting CSS via `scripts/copy-css.js`
