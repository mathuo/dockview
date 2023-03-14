import { IDockviewPanelModel } from '../../dockview/dockviewPanelModel';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import {
    GroupPanelPartInitParameters,
    GroupPanelUpdateEvent,
    IContentRenderer,
    ITabRenderer,
} from '../../dockview/types';

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

    dispose(): void {
        //
    }
}
