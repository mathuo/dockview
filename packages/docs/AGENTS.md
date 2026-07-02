# AGENTS.md - docs

Documentation website built with Docusaurus v3.

## Build Commands

- `build` - Build templates then build Docusaurus site
- `start` - Start dev server (Docusaurus + ESM server via concurrently)
- `build-templates` - Generate framework example templates from source
- `build-templates:local` - Generate templates using local package references
- `typecheck` - Run TypeScript type checking

## Documentation Structure

### Auto-Generated Content

- `static/templates/` - Auto-generated from `templates/` source directory. Do not edit manually.
- Templates contain examples for plain TypeScript plus the supported frameworks: React, Vue, and Angular

### Release Notes

- Release notes are stored in `blog/` with the naming format `YYYY-MM-DD-dockview-X.Y.Z.md`
- See root AGENTS.md for release note format details

### Live Examples (`<CodeRunner>` + `templates/`)

**This is where docs examples live.** A page embeds a live example with `<CodeRunner id="dockview/<id>" />`. That renders an iframe pointing at `/templates/dockview/<id>/<framework>/index.html`, generated from `templates/` by `scripts/buildTemplates.mjs`. So:

- The example SOURCE for `id` lives in `templates/dockview/<id>/{react,typescript,vue,angular}/` (each a small standalone app: `react/{package.json,tsconfig.json,src/index.tsx,src/app.tsx}`, `typescript/src/index.ts`, etc.). Copy an existing complete example (e.g. `templates/dockview/tab-overflow/` or `templates/dockview/layout-history/`) as the skeleton and only change the dockview options + panel setup.
- **New examples go in `templates/`, NOT `sandboxes/`.** `sandboxes/react/dockview/<id>/` folders are NOT what `CodeRunner` renders.
- The docs framework switcher's **"JavaScript" tab maps to the `typescript/` folder** — a `typescript/` variant is required for the default view to render. A missing framework folder 404s that tab (`buildTemplates.mjs` `continue`s past absent frameworks), so provide all four for full parity.

### Sandboxes (legacy)

- `sandboxes/` - Legacy code-sandbox sources, NOT used by `<CodeRunner>` (see above). In practice the demo (`demo-dockview`) is the main actively-used one; the rest are stale. A handful remain load-bearing because MDX pages / `src/` components import directly from `@site/sandboxes/<name>/src/app` (e.g. `rendering-dockview`, `externaldnd-dockview`, `demo-dockview`, `dockview-app`, `nativeapp-dockview`, `iframe-dockview`, `keyboard-dockview`, `fullwidthtab-dockview`). Removing or renaming files inside those will break the docs build.
- Their dependencies (`ag-grid-community`, `ag-grid-react`, `react-dnd`, `@minoru/react-dnd-treeview`, etc.) are pulled in via `packages/docs/package.json` — don't delete them without first removing the corresponding sandbox import.
- Long-term preference is still to migrate these examples out of `sandboxes/` and delete the directory. Until then, ask before changing sandbox content, and do NOT add new per-feature example sandboxes here — add a `templates/` example instead.

### Framework Examples

Any page that includes examples should provide implementations for:

- Vanilla TypeScript
- React
- Vue
- Angular

Use the React component `FrameworkSpecific` to organize and display framework-specific examples on documentation pages. Use `<CodeRunner id="dockview/<id>" />` for the runnable embed (sourced from `templates/`, per above).

## Supported Frameworks

The project supports the following frameworks:

- React
- Vue
- Angular
- Vanilla TypeScript (framework-agnostic)
