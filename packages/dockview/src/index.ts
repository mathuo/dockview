export * from 'dockview-core';

/**
 * `dockview` is the recommended free entry point: a thin re-export of
 * `dockview-core`. The separable enterprise feature modules now live in the
 * separately-published `dockview-enterprise` package (which depends on and
 * re-exports `dockview`); install that to opt into them.
 *
 * This module has no side effects — it is a pure re-export — so bundlers can
 * fully tree-shake unused exports out of consumer builds.
 */
