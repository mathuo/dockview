import { IFrameworkPart } from '../panel/types';
import { IDockviewComponent } from '../dockview/dockviewComponent';
import { GridviewPanelApi, IGridviewPanelApi } from '../api/gridviewPanelApi';
import { Groupview, GroupOptions } from './groupview';
import { GridviewPanel } from '../gridview/gridviewPanel';

interface IGroupApi extends IGridviewPanelApi {}

class GroupApi extends GridviewPanelApi implements IGroupApi {
    private _value?: Groupview;

    set group(value: Groupview) {
        this._value = value;
    }

    constructor(id: string) {
        super(id);
    }
}

export class GroupviewPanel extends GridviewPanel {
    private readonly _group: Groupview;

    get group(): Groupview {
        return this._group;
    }

    get minimumHeight() {
        return this._group.minimumHeight;
    }

    get maximumHeight() {
        return this._group.maximumHeight;
    }

    get minimumWidth() {
        return this._group.minimumWidth;
    }

    get maximumWidth() {
        return this._group.maximumWidth;
    }

    constructor(
        accessor: IDockviewComponent,
        id: string,
        options: GroupOptions
    ) {
        super(id, 'groupview_default', new GroupApi(id));

        this._group = new Groupview(this.element, accessor, id, options, this);

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
