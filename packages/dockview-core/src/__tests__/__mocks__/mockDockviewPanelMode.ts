import { IDockviewPanelModel } from '../../dockview/dockviewPanelModel';
import { GroupPanel } from '../../groupview/groupviewPanel';
import {
    GroupPanelPartInitParameters,
    GroupPanelUpdateEvent,
    IContentRenderer,
    ITabRenderer,
} from '../../groupview/types';

export class DockviewPanelModelMock implements IDockviewPanelModel {
    constructor(
        readonly contentComponent: string,
        readonly content: IContentRenderer,
        readonly tabComponent?: string,
        readonly tab?: ITabRenderer
    ) {
        //
    }

    init(params: GroupPanelPartInitParameters): void {
        //
    }

    update(event: GroupPanelUpdateEvent): void {
        //
    }

    layout(width: number, height: number): void {
        //
    }

    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void {
        //
    }

    dispose(): void {
        //
    }
}
