import { DockviewModule } from 'dockview-core';
import { TabGroupChipsModule } from './tabGroupChipsService';
import { ContextMenuModule } from './contextMenu';
import { AccessibilityModule } from './accessibilityService';
import { LayoutHistoryModule } from './layoutHistoryService';
import { DropGuideModule } from './dropGuideService';
import { SmartGuidesModule } from './smartGuidesService';
import { AutoHideEdgeGroupModule } from './autoHideEdgeGroupService';
import { MultiRowTabsModule } from './multiRowTabsService';
import { PinnedTabsModule } from './pinnedTabsService';

export {
    TabGroupChipsService,
    TabGroupChipsModule,
} from './tabGroupChipsService';
export { ContextMenuController, ContextMenuModule } from './contextMenu';
export {
    AccessibilityService,
    AccessibilityModule,
} from './accessibilityService';
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
export { MultiRowTabsService, MultiRowTabsModule } from './multiRowTabsService';
export {
    PinnedTabsService,
    PinnedTabsModule,
    computePinnedFirstOrder,
} from './pinnedTabsService';
// Advanced keyboard docking is an optional module — exported for explicit
// registration, but not part of the default `Modules` bundle below.
export {
    KeyboardDockingService,
    KeyboardDockingModule,
} from './keyboardDockingService';

/**
 * The set of modules provided by this package. `dockview` registers these via
 * `registerModules(Modules)` so they are available to every component.
 */
export const Modules: DockviewModule<any>[] = [
    TabGroupChipsModule,
    ContextMenuModule,
    AccessibilityModule,
    LayoutHistoryModule,
    DropGuideModule,
    SmartGuidesModule,
    AutoHideEdgeGroupModule,
    MultiRowTabsModule,
    PinnedTabsModule,
];
