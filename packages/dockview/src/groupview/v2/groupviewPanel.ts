import { IFrameworkPart } from '../../panel/types';
import { IDockviewComponent } from '../../dockview/dockviewComponent';
import {
    GridviewPanelApi,
    IGridviewPanelApi,
} from '../../api/gridviewPanelApi';
import { GroupComponent, GroupOptions } from './component';
import { GridviewPanel } from '../../gridview/gridviewPanel';

interface IGroupApi extends IGridviewPanelApi {}

class GroupApi extends GridviewPanelApi implements IGroupApi {
    private _value?: GroupComponent;

    set group(value: GroupComponent) {
        this._value = value;
    }

    constructor(id: string) {
        super(id);
    }
}

export class GroupviewPanel extends GridviewPanel {
    private readonly _group: GroupComponent;

    get group(): GroupComponent {
        return this._group;
    }

    constructor(
        accessor: IDockviewComponent,
        id: string,
        options: GroupOptions
    ) {
        super(id, 'groupview_default', new GroupApi(id));

        this._group = new GroupComponent(
            this.element,
            accessor,
            id,
            options,
            this
        );

        (this.api as GroupApi).group = this._group;
        this.group.bootstrap();
    }

    setActive(isActive: boolean): void {
        super.setActive(isActive);
        this.group.setActive(isActive);
    }

    layout(width: number, height: number) {
        super.layout(width, height);
        this.group.layout(width, height);
    }

    getComponent(): IFrameworkPart {
        return this._group;
    }

    toJSON(): any {
        return this.group.toJSON();
    }
}
