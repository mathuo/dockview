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
import { KeyboardDockingModule } from './keyboardDockingService';
import { ResponsiveLayoutModule } from './responsiveLayoutService';

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
export {
    KeyboardDockingService,
    KeyboardDockingModule,
} from './keyboardDockingService';
export {
    ResponsiveLayoutService,
    ResponsiveLayoutModule,
} from './responsiveLayoutService';
export { BreakpointResolver } from './responsiveBreakpointResolver';
export { SizeObserver } from './responsiveSizeObserver';

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
    KeyboardDockingModule,
    ResponsiveLayoutModule,
];
