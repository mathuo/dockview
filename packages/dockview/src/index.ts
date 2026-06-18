import { registerModules } from 'dockview-core';
import { Modules } from 'dockview-modules';

export * from 'dockview-core';

/**
 * `dockview` is the batteries-included entry point: it re-exports the core API
 * and registers the separable feature modules so every component gets the full
 * feature set out of the box. Consumers who want only the core can depend on
 * `dockview-core` directly.
 */
registerModules(Modules);
