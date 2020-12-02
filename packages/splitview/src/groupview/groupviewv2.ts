import { GridviewPanel } from '../react';
import { IFrameworkPart, Parameters } from '../panel/types';
import { addClasses } from '../dom';
import { IDockviewComponent } from '../dockview/dockviewComponent';
import { GroupOptions, IGroupview } from './groupview';
import { GridPanelApi, IGridPanelApi } from '../api/gridPanelApi';
import { IGroupPanel } from './groupviewPanel';

interface IGroupApi extends IGridPanelApi {}

class GroupApi extends GridPanelApi implements IGroupApi {
    private _value: GroupComponent;

    set group(value: GroupComponent) {
        this._value = value;
    }

    constructor(id: string) {
        super(id);
    }
}

class GroupComponent implements IFrameworkPart {
    constructor(
        private readonly container: HTMLElement,
        private readonly accessor: IDockviewComponent,
        private group: IGroupview
    ) {
        addClasses(this.container, 'groupview');
    }

    update(params: Parameters): void {
        //
    }
    dispose(): void {
        //
    }
}

export class Groupview extends GridviewPanel {
    private group: GroupComponent;

    constructor(
        private accessor: IDockviewComponent,
        public id: string,
        options: GroupOptions
    ) {
        super(id, 'groupview_default', new GroupApi(id));

        this.group = new GroupComponent(this.element, this.accessor, null);
        (this.api as GroupApi).group = this.group;
    }

    getComponent(): IFrameworkPart {
        return this.group;
    }
}
