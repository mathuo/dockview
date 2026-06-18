import { DockviewModule } from 'dockview-core';
import { TabGroupChipsModule } from './tabGroupChipsService';
import { ContextMenuModule } from './contextMenu';
import { AdvancedDnDModule } from './advancedDnDService';
import { AccessibilityModule } from './accessibilityService';

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

/**
 * The set of modules provided by this package. `dockview` registers these via
 * `registerModules(Modules)` so they are available to every component.
 */
export const Modules: DockviewModule<any>[] = [
    TabGroupChipsModule,
    ContextMenuModule,
    AdvancedDnDModule,
    AccessibilityModule,
];
