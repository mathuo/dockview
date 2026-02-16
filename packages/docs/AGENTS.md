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

### Legacy Content

- `sandboxes/` - Legacy directory that we would rather delete than update
- Always ask before making changes to sandbox content as deletion is preferred

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
