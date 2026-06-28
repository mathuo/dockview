import { DockviewModule } from 'dockview-core';
import { TabGroupChipsModule } from './tabGroupChipsService';
import { ContextMenuModule } from './contextMenu';
import { AdvancedDnDModule } from './advancedDnDService';
import { AccessibilityModule } from './accessibilityService';
import { LayoutHistoryModule } from './layoutHistoryService';
import { DropGuideModule } from './dropGuideService';
import { AutoHideEdgeGroupModule } from './autoHideEdgeGroupService';

export {
    TabGroupChipsService,
    TabGroupChipsModule,
} from './tabGroupChipsService';
export { ContextMenuController, ContextMenuModule } from './contextMenu';
export { AdvancedDnDService, AdvancedDnDModule } from './advancedDnDService';
export {
    AccessibilityService,
    AccessibilityModule,
} from './accessibilityService';
export {
    LayoutHistoryService,
    LayoutHistoryModule,
} from './layoutHistoryService';
export { DropGuideService, DropGuideModule } from './dropGuideService';
export {
    AutoHideEdgeGroupService,
    AutoHideEdgeGroupModule,
} from './autoHideEdgeGroupService';
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
    AdvancedDnDModule,
    AccessibilityModule,
    LayoutHistoryModule,
    DropGuideModule,
    AutoHideEdgeGroupModule,
];
