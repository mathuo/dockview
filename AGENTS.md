# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dockview is a zero-dependency layout manager supporting tabs, groups, grids and splitviews. It provides framework support for React, Vue, Angular, and vanilla TypeScript. The project is organized as an NX monorepo (package-based approach) with Yarn v1 workspaces.

See per-package `AGENTS.md` files under `packages/` for package-specific guidance.

## Development Commands

### Build

-   `yarn build` - Build all publishable packages via NX (dockview-core, dockview, dockview-vue, dockview-react, dockview-angular)
-   `yarn clean` - Clean all packages
-   `npx nx run <package>:<script>` - Run a specific script for a single package (e.g. `npx nx run dockview-core:build`)

### Build Order

NX handles build ordering automatically via `dependsOn: ["^build"]`. The dependency chain is:

    dockview-core → dockview → dockview-react
    dockview-core → dockview-vue
    dockview-core → dockview-angular

### CSS Flow

-   `dockview-core` compiles SCSS to CSS via Gulp (`gulp sass`)
-   All other packages copy CSS from `dockview-core` using `scripts/copy-css.js`

### Testing

-   `yarn test` - Run Jest tests across all packages via NX
-   `yarn test:cov` - Run tests with coverage (root-level Jest invocation for SonarCloud unified coverage)

### Linting & Formatting

-   `yarn lint` - Run ESLint across all packages via NX
-   `yarn lint:fix` - Run ESLint with automatic fixing
-   `yarn format` - Run Prettier across all packages
-   `yarn format:check` - Check Prettier formatting

### Documentation

-   `yarn docs` - Generate TypeDoc documentation

### Release

-   `yarn release` - NX release (fixed versioning, all packages share same version)
-   `yarn release:version` - Bump version
-   `yarn release:publish` - Publish to npm

## Architecture

### Monorepo Structure

-   **packages/dockview-core** - Core layout engine (TypeScript, framework-agnostic, zero dependencies)
-   **packages/dockview** - React bindings and components
-   **packages/dockview-vue** - Vue 3 bindings and components
-   **packages/dockview-angular** - Angular bindings and components
-   **packages/dockview-react** - Re-export wrapper (`export * from 'dockview'`)
-   **packages/docs** - Documentation website (Docusaurus v3)

### Key Components

#### Core Architecture (dockview-core)

-   **DockviewComponent** - Main container managing panels and groups
-   **DockviewGroupPanel** - Container for related panels with tabs
-   **DockviewPanel** - Individual content panels
-   **Gridview/Splitview/Paneview** - Different layout strategies
-   **API Layer** - Programmatic interfaces for each component type

#### Framework Integration

-   Framework-specific packages provide thin wrappers around core components
-   React package uses HOCs and hooks for component lifecycle management
-   Vue package provides Vue 3 composition API integration
-   All frameworks share the same core serialization/deserialization logic

#### Key Features

-   Drag and drop with customizable drop zones
-   Floating groups and popout windows
-   Serialization/deserialization for state persistence
-   Theming system with CSS custom properties
-   Comprehensive API for programmatic control

### Build System

-   **NX** for monorepo orchestration (package-based, `useInferencePlugins: false`)
-   **Yarn v1** for package management and workspaces
-   **TypeScript** (`tsc`) for CJS + ESM compilation
-   **Gulp** for SCSS processing (dockview-core only)
-   **Rollup** for UMD bundles (dockview-core, dockview, dockview-react)
-   **Vite** for Vue package builds
-   **ng-packagr** for Angular Package Format builds

### Testing Strategy

-   Jest with ts-jest preset for TypeScript support
-   Testing Library for React component testing
-   Coverage reporting with SonarCloud integration
-   Each package has its own jest.config.ts extending root configuration

### Code Quality

-   ESLint configuration extends recommended TypeScript rules
-   Prettier for code formatting
-   Linting targets source files in packages/\*/src/\*\* (excludes tests, docs, node_modules)
-   Current rules focus on TypeScript best practices while allowing some flexibility

## Development Notes

### Working with Packages

-   Use NX commands for cross-package operations (`npx nx run-many -t <target>`)
-   Each package can be built independently via `npx nx run <package>:build`
-   Core package must be built before framework packages (NX handles this automatically)

### Adding New Features

-   Start with core package implementation
-   Add corresponding API methods in api/ directory
-   Create framework-specific wrappers as needed
-   Update TypeDoc documentation
-   Add tests in \_\_tests\_\_ directories
-   Run `yarn lint` to check code quality before committing

### State Management

-   Components use internal state with event-driven updates
-   Serialization provides snapshot-based state persistence
-   APIs provide reactive interfaces with event subscriptions

## Release Management

### Creating Release Notes

Release notes are stored in `packages/docs/blog/` with the naming format `YYYY-MM-DD-dockview-X.Y.Z.md`.

To create release notes for a new version:

1. Check git commits since the last release: `git log --oneline --since="YYYY-MM-DD"`
2. Create a new markdown file following the established format:
   - Front matter with slug, title, and tags
   - Sections for Features, Miscs, and Breaking changes
   - Reference GitHub PR numbers for significant changes
   - Focus on user-facing changes, bug fixes, and new features

Example format:
```markdown
---
slug: dockview-X.Y.Z-release
title: Dockview X.Y.Z
tags: [release]
---

# Release Notes

Please reference docs @ [dockview.dev](https://dockview.dev).

## Features
- Feature description [#PR](link)

## Miscs
- Bug: Fix description [#PR](link)
- Chore: Maintenance description [#PR](link)

## Breaking changes
```
