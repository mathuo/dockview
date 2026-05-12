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

### Sandboxes

- `sandboxes/` - Legacy code-sandbox sources. Most are stale, but several are still load-bearing: MDX pages and `src/` components import directly from `@site/sandboxes/<name>/src/app` (e.g. `rendering-dockview`, `externaldnd-dockview`, `demo-dockview`, `dockview-app`, `nativeapp-dockview`, `iframe-dockview`, `keyboard-dockview`, `fullwidthtab-dockview`). Removing or renaming files inside these sandboxes will break the docs build.
- Their dependencies (`ag-grid-community`, `ag-grid-react`, `react-dnd`, `@minoru/react-dnd-treeview`, etc.) are pulled in via `packages/docs/package.json` — don't delete them without first removing the corresponding sandbox import.
- Long-term preference is still to migrate these examples out of `sandboxes/` and delete the directory. Until then, ask before changing sandbox content.

### Framework Examples

Any page that includes examples should provide implementations for:
- Vanilla TypeScript
- React
- Vue
- Angular

Use the React component `FrameworkSpecific` to organize and display framework-specific examples on documentation pages.

## Supported Frameworks

The project supports the following frameworks:
- React
- Vue
- Angular
- Vanilla TypeScript (framework-agnostic)
