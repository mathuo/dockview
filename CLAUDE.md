# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dockview is a zero-dependency layout manager supporting tabs, groups, grids and splitviews. It provides framework support for React, Vue, and vanilla TypeScript. The project is organized as a Lerna monorepo with multiple packages.

## Development Commands

### Build

-   `npm run build` - Build core packages (dockview-core, dockview, dockview-vue, dockview-react)
-   `npm run clean` - Clean all packages

### Testing

-   `npm test` - Run Jest tests across all packages
-   `npm run test:cov` - Run tests with coverage reporting

### Linting

-   `npm run lint` - Run ESLint on TypeScript/JavaScript source files across packages
-   `npm run lint:fix` - Run ESLint with automatic fixing of fixable issues

### Documentation

-   `npm run docs` - Generate documentation using custom script

### Package Management

-   `npm run version` - Version packages using Lerna
-   `npm run build:bundle` - Package build artifacts
-   `npm run generate-docs` - Package documentation

## Architecture

### Monorepo Structure

-   **packages/dockview-core** - Core layout engine (TypeScript, framework-agnostic)
-   **packages/dockview** - React bindings and components
-   **packages/dockview-vue** - Vue bindings and components
-   **packages/dockview-angular** - Angular bindings and components
-   **packages/dockview-react** - Additional React utilities
-   **packages/docs** - Documentation website (Docusaurus)

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

### Testing Strategy

-   Jest with ts-jest preset for TypeScript support
-   Testing Library for React component testing
-   Coverage reporting with SonarCloud integration
-   Each package has its own jest.config.ts extending root configuration

### Build System

-   Lerna for monorepo management
-   Rollup for package bundling
-   TypeScript for type checking and compilation
-   Gulp for additional build tasks (SCSS processing)

### Code Quality

-   ESLint configuration extends recommended TypeScript rules
-   Linting targets source files in packages/\*/src/\*\* (excludes tests, docs, node_modules)
-   Configuration centralized in .eslintrc.js with ignore patterns
-   Current rules focus on TypeScript best practices while allowing some flexibility
-   Most linting issues require manual fixes (type specifications, unused variables, null assertions)

## Development Notes

### Working with Packages

-   Use Lerna commands for cross-package operations
-   Each package can be built independently
-   Core package must be built before framework packages
-   Use workspaces for dependency management

### Adding New Features

-   Start with core package implementation
-   Add corresponding API methods in api/ directory
-   Create framework-specific wrappers as needed
-   Update TypeDoc documentation
-   Add tests in **tests** directories
-   Run `npm run lint` to check code quality before committing

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
   - Sections for Features (🚀), Miscs (🛠), and Breaking changes (🔥)
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

## 🚀 Features
- Feature description [#PR](link)

## 🛠 Miscs
- Bug: Fix description [#PR](link)
- Chore: Maintenance description [#PR](link)

## 🔥 Breaking changes
```
