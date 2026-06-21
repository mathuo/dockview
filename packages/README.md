# Project Structure

This mono-repository has a number of packages containing the code for the dockview library and the documentation website [dockview.dev](dockview.dev).

## dockview-core

-   Contains the core logic for the dockview library.
-   Written entirely in vanilla JavaScript/TypeScript.

## dockview

-   The batteries-included vanilla JavaScript / TypeScript package — re-exports the core API and registers the separable feature modules so consumers get the full feature set out of the box.
-   The package framework-agnostic consumers should install (`npm install dockview`).
-   Has no `react` peer dependency; framework bindings live in the `dockview-<framework>` packages.
-   Published as [dockview](https://www.npmjs.com/package/dockview) on npm.

## dockview-react

-   The React bindings package — holds the actual React source (`DockviewReact`, hooks, portal bridge).
-   Depends on `dockview`; peer dependency on `react`.
-   Published as [dockview-react](https://www.npmjs.com/package/dockview-react) on npm — the canonical install name for React.

## docs

-   Code for [dockview.dev](dockview.dev).
