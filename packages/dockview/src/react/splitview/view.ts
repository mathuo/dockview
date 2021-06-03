import { PanelViewInitParameters } from '../../splitview/core/options';
import { SplitviewPanel } from '../../splitview/splitviewPanel';
import { ReactPart, ReactPortalStore } from '../react';
import { ISplitviewPanelProps } from './splitview';

export class ReactPanelView extends SplitviewPanel {
    constructor(
        id: string,
        component: string,
        private readonly reactComponent: React.FunctionComponent<ISplitviewPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        super(id, component);
    }

    getComponent() {
        return new ReactPart(
            this.element,
            this.reactPortalStore,
            this.reactComponent,
            {
                params: this.params?.params || {},
                api: this.api,
                containerApi: (this.params as PanelViewInitParameters)
                    .containerApi,
            }
        );
    }
}
