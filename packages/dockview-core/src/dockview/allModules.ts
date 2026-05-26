import { DockviewModule } from './modules';
import { FloatingGroupModule } from './floatingGroupService';
import { PopoutWindowModule } from './popoutWindowService';
import { WatermarkModule } from './watermarkService';
import { EdgeGroupModule } from './edgeGroupService';
import { TabGroupChipsModule } from './tabGroupChipsService';
import { ContextMenuModule } from './contextMenu';
import { RootDropTargetModule } from './rootDropTargetService';
import { HeaderActionsModule } from './headerActionsService';

/**
 * Internal list of all built-in modules. Registered automatically by
 * DockviewComponent at construction time; not exported from the package.
 */
export const AllModules: DockviewModule<any>[] = [
    FloatingGroupModule,
    PopoutWindowModule,
    WatermarkModule,
    EdgeGroupModule,
    TabGroupChipsModule,
    ContextMenuModule,
    RootDropTargetModule,
    HeaderActionsModule,
];
