import { markDockviewPackageLoaded, registerModules } from 'dockview-core';
import { Modules } from '../index';

/**
 * Mirror what the `dockview` package does at import time: register this
 * package's modules globally so a default `DockviewComponent` constructed in
 * tests has the full feature set, and mark the public package as loaded so the
 * "don't use dockview-core directly" warning stays quiet. Both are idempotent.
 */
registerModules(Modules);
markDockviewPackageLoaded();
