import { IDockviewPanelModel } from '../../dockview/dockviewPanelModel';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
} from '../../dockview/types';
import { PanelUpdateEvent } from '../../panel/types';

export class DockviewPanelModelMock implements IDockviewPanelModel {
    constructor(
        readonly contentComponent: string,
        readonly content: IContentRenderer,
        readonly tabComponent: string,
        readonly tab: ITabRenderer
    ) {
        //
    }


    init(params: GroupPanelPartInitParameters): void {
        //
    }

    updateParentGroup(
        group: DockviewGroupPanel,
        isPanelVisible: boolean
    ): void {
        //
    }

    update(event: PanelUpdateEvent): void {
        //
    }

    layout(width: number, height: number): void {
        //
    }

    dispose(): void {
        //
    }
}
