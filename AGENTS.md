# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dockview is a zero-dependency layout manager supporting tabs, groups, grids and splitviews. It provides framework support for React, Vue, Angular, and JavaScript. The project is organized as an NX monorepo (package-based approach) with Yarn v1 workspaces.

See per-package `AGENTS.md` files under `packages/` for package-specific guidance.

`AGENTS.md` is the single source of agent guidance at every level. Each
`CLAUDE.md` (repo root and every package) is a **symlink to its sibling
`AGENTS.md`**, never a copy or a stub: a copy drifts the moment one side is
edited. When adding a package, create `CLAUDE.md` with `ln -s AGENTS.md CLAUDE.md`;
when editing guidance, edit `AGENTS.md` only.

## Development Commands

> **Use Yarn, not npm.** This repo is a **Yarn v1** workspaces monorepo. Install
> dependencies with `yarn install` (or just `yarn`) and run every script through
> `yarn <script>`. Do **not** run `npm install`/`npm ci`/`pnpm install` at the
> repo root — they ignore the workspace protocol and `yarn.lock`, and will
> corrupt the linked local packages. The `npm install dockview`/`dockview-react`
> lines elsewhere in this file are end-user consumer instructions for the
> published packages, not commands for developing in this repo.

### Build

-   `yarn build` - Build all publishable packages via NX (dockview-core, dockview-enterprise, dockview, dockview-vue, dockview-react, dockview-angular): type declarations + CSS
-   `yarn build:bundle` - Build the rolldown bundles (CJS/ESM package entries and UMD/CDN bundles) for the same packages; the e2e fixtures and the Tauri demo load these
-   `yarn clean` - Clean all packages
-   `npx nx run <package>:<script>` - Run a specific script for a single package (e.g. `npx nx run dockview-core:build`)

### Build Order

NX handles build ordering automatically via `dependsOn: ["^build"]`. The dependency chain is:

    dockview-core → dockview → dockview-enterprise
    dockview-core → dockview → dockview-react
    dockview-core → dockview → dockview-vue
    dockview-core → dockview → dockview-angular

### CSS Flow

-   `dockview-core` compiles SCSS to CSS with `scripts/build-css.js` (`sass-embedded`) into `dist/styles/dockview.css`
-   All other packages copy that CSS from `dockview-core` using their `scripts/copy-css.js` (`copy-css.cjs` in `dockview-vue`)

### Testing

-   `yarn test` - Run the unit tests across all packages via NX (Jest for dockview-core, dockview, dockview-react, dockview-angular and dockview-enterprise; Vitest for dockview-vue)
-   `yarn test:cov` - Run tests with coverage (root-level Jest invocation plus the Vue Vitest coverage, merged by SonarCloud)
-   `npx jest <path>` - Run a single Jest spec from the repo root; `npx jest --selectProjects <package>` runs one package
-   `yarn test:e2e` - Playwright specs under `e2e/` in a real browser (popouts, measured layout, native drag). Needs the bundles first: `yarn nx run-many -t build:bundle -p dockview-core dockview dockview-enterprise`. **Not run in CI**; say in the PR when you ran them. See `e2e/README.md`.
-   `yarn bench` - Performance harness (`scripts/bench`) that drives the built `dockview-core` UMD bundle in headless Chromium; run `npx nx run dockview-core:build:bundle` first

### Linting & Formatting

Linting and formatting are **Biome** (`biome.json` at the root). There is no ESLint or Prettier.

-   `yarn lint` - Run Biome lint across all packages via NX (`biome lint src` per package)
-   `yarn lint:fix` - Biome lint with automatic fixing
-   `yarn format` - Biome format across all packages (`packages/docs` is deliberately excluded)
-   `yarn format:check` - Check formatting (the CI `format` job)
-   `yarn types:check` - Validate each package's published type resolution with `attw` (the CI `bundle` job); needs `build` and `build:bundle` first

### Generated Files

-   `yarn gen` - Regenerate `__generated__/dockview-core-exports.txt`, the sorted list of `dockview-core`'s public exports
-   `yarn gen:check` - Fail if the generated file is stale (the CI `gen` job). Run `yarn gen` and commit whenever a public export is added, removed or renamed

### Documentation

-   `yarn docs` - Generate TypeDoc documentation, writing the docs site's API
    reference to `packages/docs/src/generated/api.output.json`
-   **Build first.** Run `yarn build` before `yarn docs`: typedoc resolves
    cross-package types through each package's built `dist/cjs/*.d.ts`, so on an
    unbuilt tree the generator quietly degrades - references collapse to
    `unknown` / `any` and some declarations drop out of the reference entirely.

### Release

-   `yarn release` - NX release (fixed versioning, all packages share same version)
-   `yarn release:version` - Bump version
-   `yarn release:publish` - Publish to npm

## Architecture

### Monorepo Structure

-   **packages/dockview-core** - Internal core layout engine (TypeScript, framework-agnostic, zero dependencies). Not a documented install target — consumers use `dockview` or a framework binding.
-   **packages/dockview** - Canonical JavaScript package (`npm install dockview`). A pure re-export of `dockview-core` with no side effects. No `react` peer dependency.
-   **packages/dockview-enterprise** - The separately-licensed enterprise package: the paid feature modules plus the licence gate. Depends on and re-exports `dockview`, and registers its modules on import. See its `AGENTS.md`.
-   **packages/dockview-react** - Canonical React bindings package — what docs, READMEs, and examples point users at (`npm install dockview-react`). Holds the actual React source and depends on `dockview`.
-   **packages/dockview-vue** - Vue 3 bindings and components
-   **packages/dockview-angular** - Angular bindings and components
-   **packages/dockview-tauri-demo** - Private Tauri desktop shell hosting dockview. A testbed for host-environment behaviour (popouts in a native webview, native window isolation, cross-process layout sync); not published, and not built by CI.
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
-   Edge groups (pinned to layout edges with collapse/expand)
-   Tab groups (colored chip-based visual tab organization)
-   Serialization/deserialization for state persistence
-   Theming system with CSS custom properties
-   Comprehensive API for programmatic control

### Build System

-   **NX** for monorepo orchestration (package-based, `useInferencePlugins: false`)
-   **Yarn v1** for package management and workspaces
-   **TypeScript** (`tsc`, `emitDeclarationOnly`) for the `.d.ts` output; the runtime JS ships from the bundles
-   **rolldown** for the CJS/ESM package entries and UMD/CDN bundles (dockview-core, dockview, dockview-enterprise, dockview-react)
-   **sass-embedded** via `scripts/build-css.js` for SCSS (dockview-core only)
-   **Vite** for Vue package builds
-   **ng-packagr** for Angular Package Format builds
-   **Biome** for lint and format

### Testing Strategy

-   Jest with `@swc/jest` (jsdom) for dockview-core, dockview, dockview-react and dockview-enterprise; `jest-preset-angular` for dockview-angular; **Vitest** (jsdom) for dockview-vue, configured in its `vite.config.ts`
-   Testing Library for React component testing, `@vue/test-utils` for Vue, TestBed for Angular
-   Playwright for cross-window and measured-layout behaviour under `e2e/` (local only, not in CI)
-   Coverage reporting with SonarCloud integration
-   Every Jest package has its own `jest.config.ts`, listed as a project by the root `jest.config.ts`; the root `jest-setup.ts` resets the `PointerDragController` singleton after each test
-   Tests are written before the implementation: a failing reproduction for a bug, the specs from the design note for a feature (see the `test-feature` skill)

### Code Quality

-   **Bug fixes must not change expected behaviour.** A fix corrects the
    defect and nothing else — it must not alter behaviours that are working as
    intended, even when a broader "improvement" is tempting and tests still
    pass. If the only way to fix a bug is to change a long-standing, relied-upon
    behaviour (e.g. the even size redistribution when a panel/group closes), do
    **not** silently change the default: stop and raise it with the maintainer,
    and prefer gating any behavioural change behind an opt-in option. Passing
    tests are necessary but not sufficient here — the absence of a test
    asserting the old behaviour is not permission to change it.
-   Biome lint rules are in `biome.json` (recommended set plus the listed a11y, complexity, correctness, style and suspicious rules, mostly at `warn`)
-   Biome formatter: 4-space indent, 80 columns, single quotes, semicolons, ES5 trailing commas
-   Lint and format target `packages/*/src/**` (`.ts`, `.tsx`, `.js`, `.jsx`, `.vue`), excluding `dist/`, `packages/docs/` and `__mocks__/`. Tests under `__tests__` are linted but excluded from Sonar
-   **SonarCloud must introduce no new issues.** Every PR runs a SonarCloud
    analysis (the `sonar` check). A PR is not ready to merge while it reports
    any new issues, even if the Quality Gate still passes — treat "New issues:
    0" as the bar, not just a green gate. Before pushing, self-review the diff
    for the smells Sonar flags (redundant `?? {}` / `|| {}` in a spread,
    unused code, needless casts, cognitive-complexity spikes) and fix them in
    the same PR. If Sonar reports a new issue, fix it (or, if genuinely a false
    positive, mark it Won't Fix / Accepted in SonarCloud with a justification)
    before merging. Fetch the exact findings from
    `https://sonarcloud.io/api/issues/search?componentKeys=dockview_dockview&pullRequest=<PR>&issueStatuses=OPEN,CONFIRMED&resolved=false`
    rather than trusting the summary comment, which can lag a commit behind.

## Development Notes

### Working with Packages

-   Use NX commands for cross-package operations (`npx nx run-many -t <target>`)
-   Each package can be built independently via `npx nx run <package>:build`
-   Core package must be built before framework packages (NX handles this automatically)

### Adding New Features

-   Run the `design-feature` skill first: it classifies the change (free or enterprise, module or plain, persisted or not), names the existing feature to pattern on, and lists every layer to touch
-   Write the specs before the implementation (`test-feature` skill)
-   Start with the core package implementation; option types and module contracts live in `dockview-core` even for enterprise modules
-   Add corresponding API methods in `api/`, with TypeDoc comments (the docs site renders them)
-   Add the option key to `PROPERTY_KEYS_DOCKVIEW` and an Angular `@Input()`; React and Vue forward automatically
-   Export new public symbols from `packages/dockview-core/src/index.ts` and run `yarn gen`
-   Add the docs page and the four template variants (`packages/docs/AGENTS.md`)
-   Run the `review-feature` skill before opening the pull request; it runs `yarn lint`, `yarn format:check`, `yarn gen:check` and the affected tests

### State Management

-   Components use internal state with event-driven updates
-   Serialization provides snapshot-based state persistence
-   APIs provide reactive interfaces with event subscriptions

### Coding Conventions

-   When fixing a bug, write a failing test that reproduces it first, then make it pass.
-   Code comments describe the current state of the code, not its history. Don't reference the fix, PR, or what changed unless that context is critical to understanding the code as it stands.
-   Keep comments brief and concise.

### Public Documentation

-   **Refrain from mentioning `dockview-core` in public-facing documentation.** It is
    an internal module, not a supported install target. This covers the root README,
    the docs site, blog posts, release notes, and the published package READMEs.
-   Point consumers at `dockview` or a framework binding (`dockview-react`,
    `dockview-vue`, `dockview-angular`) instead. Where a dependency graph or build
    order would otherwise name it, describe the chain from `dockview` onwards.
-   Only refer to `dockview-core` where its internal nature is itself the point (for
    example, contributor-facing notes in this file), and say that it is internal when
    you do.
-   **The module system is an internal concept — don't mention it in public-facing
    documentation.** Avoid "modules", "feature modules" and `registerModules` in the
    surfaces listed above. Describe what the user gets and what they do ("importing
    the package enables the enterprise features"), not how registration works
    internally. Angular's `DockviewAngularModule` is an unrelated Angular NgModule
    and is fine to name.
-   **Don't enumerate the enterprise features** in READMEs or package docs. The
    canonical list lives on <https://dockview.dev/enterprise>; link to it instead.
    An inline list duplicates that page and drifts out of date as the feature set
    changes.
-   **Don't document the unlicensed behaviour.** Public docs should not say that
    dockview keeps working without a valid licence key, or describe the watermark.
    State that enterprise features are governed by a licence key and link to the
    enterprise page; don't present the key as optional.

## Project skills

Three repo-specific skills live under `.claude/skills/` and encode the
workflow above for agents. Invoke them by name (`/design-feature`,
`/test-feature`, `/review-feature`); they also trigger on matching requests.

-   **`design-feature`** - run before implementing any feature, new option,
    module or behavioural change. Produces a design note that follows the
    nearest existing pattern, lists every layer the change touches (core,
    enterprise, bindings, docs, generated files) and writes the test plan,
    including which behaviours need e2e. Tests are written before the code.
-   **`test-feature`** - where specs live per package, how to run one, the
    jsdom recipes (mocks, geometry, popouts, leak checks), the failing-test-
    first rule for bug fixes, and when a behaviour needs a Playwright spec.
-   **`review-feature`** - **run on every branch before opening a pull
    request**, and again on each CI or review event. It is iterative: review,
    fix, re-run the checks, re-read the new diff, and stop only when a full
    pass finds nothing. Covers preserved defaults, option and module plumbing,
    serialization compatibility, Sonar smells, docs rules and test coverage.

## Linear issue workflow

When the work maps to a Linear issue (the user names an issue identifier such as
`ABC-123`, or the task/branch references one), keep the issue's state in sync via
the Linear MCP tools. Linear's native GitHub integration is the source of truth
for status transitions; these steps make Claude's updates align with it and cover
the in-session gaps.

1.  **Starting work** — set the issue to **In Progress** (Linear `save_issue`
    with `state: "In Progress"`) before making changes. Skip if it's already
    In Progress / Done.
2.  **Opening a PR — link the issue(s).** How to link depends on how many
    issues the PR resolves:
    -   **Exactly one issue** — put the identifier in the **branch name** and
        the **PR title** (e.g. branch `matthew/dv-52-maximum-width`, title
        `fix(DV-52): maximumWidth axis swap`). Prefer the branch name Linear
        generates for the issue ("Copy git branch name") so linking is
        automatic on push. If the branch name can't carry the identifier — most
        often an agent branch assigned as `claude/...`, which Linear does not
        auto-link — fall back to a `Fixes <ID>` magic word in the description.
    -   **More than one issue** — a branch name/title can only carry one
        identifier, so instead add a Linear magic word for **every** issue in
        the PR **description**, one per line: `Fixes <ID>` / `Closes <ID>`
        (e.g. `Fixes ABC-123`).

    Magic words (`Fixes` / `Closes` / `Resolves`) are what auto-complete the
    issue on merge; a bare identifier in the title/branch links the PR but
    relies on the integration's PR-merged→Done status mapping to close it. When
    in doubt, include the magic word.
3.  **On merge** — when a watched PR merges (the merge webhook arrives during a
    session), set each resolved issue to **Done** (Linear `save_issue` with
    `state: "Done"`) as a backup in case the native integration's status
    mapping isn't configured. Idempotent — skip if already Done.

Do not change Linear state for issues the user hasn't asked you to work on, and
don't reopen or duplicate issues.
