import { registerModules } from 'dockview-core';
import { Modules } from '../index';

/**
 * Mirror what the `dockview` package does at import time: register this
 * package's modules globally so a default `DockviewComponent` constructed in
 * tests has the full feature set. `registerModules` is idempotent.
 */
registerModules(Modules);
