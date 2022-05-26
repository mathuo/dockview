import { DefaultTab } from '../../../dockview/components/tab/defaultTab';
import {
    DockviewRenderFunctions,
    ViewFactoryData,
} from '../../../dockview/options';
import { ReactPortalStore } from '../../react';
import { DefaultGroupPanelView } from '../../../dockview/defaultGroupPanelView';
import { ReactContentRenderer } from './reactContentRenderer';

export class ReactGroupPanelView extends DefaultGroupPanelView {
    constructor(
        id: string,
        options: DockviewRenderFunctions,
        private readonly data: ViewFactoryData,
        reactPortalStore: ReactPortalStore
    ) {
        super({
            content: new ReactContentRenderer(
                id,
                options.frameworkComponents![data.content],
                reactPortalStore
            ),
            tab: new DefaultTab(),
        });
    }

    // toJSON() {
    //     return { ...this.data };
    // }
}
