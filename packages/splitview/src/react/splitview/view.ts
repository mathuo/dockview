import { PanelViewInitParameters } from '../../splitview/core/options';
import { PanelView } from '../../splitview/panelView';
import { ReactPortalStore } from '../dockview/dockview';
import { ReactPart } from '../react';
import { ISplitviewPanelProps } from './splitview';

export class ReactPanelView extends PanelView {
    constructor(
        id: string,
        component: string,
        private readonly reactComponent: React.FunctionComponent<
            ISplitviewPanelProps
        >,
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
                ...this.params.params,
                api: this.api,
                containerApi: (this.params as PanelViewInitParameters)
                    .containerApi,
            }
        );
    }
}
