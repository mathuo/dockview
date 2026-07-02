import { markDockviewPackageLoaded } from 'dockview-core';

export * from 'dockview-core';

/**
 * `dockview` is the recommended free entry point: a thin re-export of
 * `dockview-core`. The separable enterprise feature modules now live in the
 * separately-published `dockview-enterprise` package (which depends on and
 * re-exports `dockview`); install that to opt into them.
 */

// Mark the public package as loaded so `dockview-core` doesn't warn about
// direct usage. Purely drives that developer warning — no functional effect.
markDockviewPackageLoaded();
