import { PanelView } from '../../splitview/panelView';
import { ReactLayout } from '../dockview/dockview';
import { ReactPart } from '../react';
import { ISplitviewPanelProps } from './splitview';

export class ReactPanelView extends PanelView {
    constructor(
        id: string,
        component: string,
        private readonly reactComponent: React.FunctionComponent<
            ISplitviewPanelProps
        >,
        private readonly parent: ReactLayout
    ) {
        super(id, component);
    }

    getComponent() {
        return new ReactPart(
            this.element,
            this.api,
            this.parent.addPortal,
            this.reactComponent,
            this.params.params
        );
    }
}
