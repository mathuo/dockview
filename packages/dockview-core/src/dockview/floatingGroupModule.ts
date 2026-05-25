import { DockviewModule } from './modules';
import {
    FloatingGroupService,
    IFloatingGroupHost,
} from './floatingGroupService';

export const FloatingGroupModule: DockviewModule<IFloatingGroupHost> = {
    moduleName: 'FloatingGroup',
    services: {
        floatingGroupService: (host) => new FloatingGroupService(host),
    },
};
