# Project Structure

This mono-repository has a number of packages containing the code for the [dockview](https://www.npmjs.com/package/dockview) library and the documentation website [dockview.dev](dockview.dev).

## dockview-core

-   Contains the core logic for the dockview library.
-   Written entirely in vanilla JavaScript/TypeScript.

## dockview

-   Depends on `dockview-core`.
-   Exports a `React` wrapper.
-   Published as [dockview](https://www.npmjs.com/package/dockview) on npm.

## docs

-   Code for [dockview.dev](dockview.dev).
