import { GridPanelView } from '../../gridview/gridPanelView';
import { ReactPortalStore } from '../dockview/dockview';
import { ReactPart } from '../react';
import { IGridviewComponentProps } from './gridview';

export class ReactGridPanelView extends GridPanelView {
    constructor(
        id: string,
        component: string,
        private readonly reactComponent: React.FunctionComponent<
            IGridviewComponentProps
        >,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        super(id, component);
    }

    getComponent() {
        return new ReactPart(
            this.element,
            this.api,
            this.reactPortalStore.addPortal,
            this.reactComponent,
            this.params.params
        );
    }
}
