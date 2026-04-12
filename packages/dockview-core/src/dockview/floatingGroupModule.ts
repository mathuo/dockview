import { DockviewModule } from './modules';
import {
    FloatingGroupService,
    IFloatingGroupHost,
} from './floatingGroupService';

/**
 * Module that enables floating (detached) group panels.
 *
 * When registered, groups can be detached from the grid and floated
 * as draggable/resizable overlays within the dockview container.
 *
 * This is auto-registered when no explicit `modules` option is provided,
 * preserving backward compatibility. To disable floating groups, either
 * set `disableFloatingGroups: true` or provide an explicit `modules`
 * array that does not include this module.
 */
export const FloatingGroupModule: DockviewModule = {
    moduleName: 'FloatingGroup',
    services: {
        floatingGroupService: (host: IFloatingGroupHost) =>
            new FloatingGroupService(host),
    },
};
