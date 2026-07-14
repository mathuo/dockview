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

- `build:cjs` - Type declarations via `tsc` (`emitDeclarationOnly`, `tsconfig.json` → `dist/cjs/**/*.d.ts`). The runtime JS ships as the rollup bundles (`build:bundle`), so this pass emits only the `.d.ts`.
- `build:css` - SCSS to CSS compilation (`gulp sass`)
- `build` - `build:cjs` + `build:css`
- `build:bundle` - Rollup bundles: the CJS/ESM package entries (`dist/package`) and the UMD/CDN bundles (`rollup -c`)
- `clean` - Remove `dist/`, `.build/`, `.rollup.cache/`

## Testing

- `test` - Jest with `@swc/jest`, jsdom environment (not type-checked at run time; types are checked in the build + ESLint)
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
