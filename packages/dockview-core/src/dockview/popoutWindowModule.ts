import { DockviewModule } from './modules';
import {
    PopoutWindowService,
    IPopoutWindowHost,
} from './popoutWindowService';

export const PopoutWindowModule: DockviewModule<IPopoutWindowHost> = {
    moduleName: 'PopoutWindow',
    services: {
        popoutWindowService: (host) => new PopoutWindowService(host),
    },
};
