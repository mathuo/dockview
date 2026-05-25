import { DockviewModule } from './modules';
import { FloatingGroupModule } from './floatingGroupService';
import { PopoutWindowModule } from './popoutWindowService';

/**
 * Internal list of all built-in modules. Registered automatically by
 * DockviewComponent at construction time; not exported from the package.
 */
export const AllModules: DockviewModule<any>[] = [
    FloatingGroupModule,
    PopoutWindowModule,
];
