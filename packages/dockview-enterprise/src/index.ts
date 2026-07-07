import { DockviewModule, registerModules } from 'dockview';
import { TabGroupChipsModule } from './tabGroupChipsService';
import { ContextMenuModule } from './contextMenu';
import { KeyboardNavigationModule } from './keyboardNavigationService';
import { LayoutHistoryModule } from './layoutHistoryService';
import { DropGuideModule } from './dropGuideService';
import { SmartGuidesModule } from './smartGuidesService';
import { AutoHideEdgeGroupModule } from './autoHideEdgeGroupService';
import { AutoEdgeGroupModule } from './autoEdgeGroupService';
import { MultiRowTabsModule } from './multiRowTabsService';
import { PinnedTabsModule } from './pinnedTabsService';
import { KeyboardDockingModule } from './keyboardDockingService';
import { LicenseModule } from './licenseService';

// Re-export the full dockview (free) API so `dockview-enterprise` is a drop-in
// superset of `dockview`. Also runs dockview's own load-time side effects
// (e.g. markDockviewPackageLoaded) via the re-exported module.
export * from 'dockview';

export {
    TabGroupChipsService,
    TabGroupChipsModule,
} from './tabGroupChipsService';
export { ContextMenuController, ContextMenuModule } from './contextMenu';
export {
    KeyboardNavigationService,
    KeyboardNavigationModule,
} from './keyboardNavigationService';
export {
    LayoutHistoryService,
    LayoutHistoryModule,
} from './layoutHistoryService';
export { DropGuideService, DropGuideModule } from './dropGuideService';
export { SmartGuidesService, SmartGuidesModule } from './smartGuidesService';
export {
    AutoHideEdgeGroupService,
    AutoHideEdgeGroupModule,
} from './autoHideEdgeGroupService';
export {
    AutoEdgeGroupService,
    AutoEdgeGroupModule,
} from './autoEdgeGroupService';
export { MultiRowTabsService, MultiRowTabsModule } from './multiRowTabsService';
export {
    PinnedTabsService,
    PinnedTabsModule,
    computePinnedFirstOrder,
} from './pinnedTabsService';
export {
    KeyboardDockingService,
    KeyboardDockingModule,
} from './keyboardDockingService';
export { LicenseService, LicenseModule } from './licenseService';
export { LicenseManager } from './licenseRegistry';
export type {
    ILicenseService,
    ILicenseHost,
    LicenseServiceOptions,
} from './licenseService';
export type { LicenseState } from './licenseValidator';

/**
 * The enterprise feature modules, including the license gate. Registered
 * automatically on import (below), so merely importing `dockview-enterprise`
 * activates these modules — and the license watermark-unless-licensed check —
 * for every component in the process.
 */
export const Modules: DockviewModule<any>[] = [
    TabGroupChipsModule,
    ContextMenuModule,
    KeyboardNavigationModule,
    LayoutHistoryModule,
    DropGuideModule,
    SmartGuidesModule,
    AutoHideEdgeGroupModule,
    AutoEdgeGroupModule,
    MultiRowTabsModule,
    PinnedTabsModule,
    KeyboardDockingModule,
    LicenseModule,
];

// Self-register on import (a side effect — hence `sideEffects: true` in
// package.json). This makes the package batteries-included: no explicit
// registerModules() call is required of the consumer.
registerModules(Modules);
