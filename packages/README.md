# Project Structure

This mono-repository has a number of packages containing the code for the dockview library and the documentation website [dockview.dev](dockview.dev).

## dockview-core

-   Contains the core logic for the dockview library.
-   Written entirely in vanilla JavaScript/TypeScript.

## dockview-react

-   Depends on `dockview-core` (via the `dockview` package).
-   Exports a `React` wrapper.
-   Published as [dockview-react](https://www.npmjs.com/package/dockview-react) on npm — the canonical install name.

## dockview

-   Legacy alias of `dockview-react`, kept for backwards compatibility.
-   Still holds the underlying React source that `dockview-react` re-exports.
-   Published as [dockview](https://www.npmjs.com/package/dockview) on npm.

## docs

-   Code for [dockview.dev](dockview.dev).
