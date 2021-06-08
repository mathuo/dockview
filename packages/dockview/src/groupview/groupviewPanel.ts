import { IFrameworkPart } from '../panel/types';
import { IDockviewComponent } from '../dockview/dockviewComponent';
import { GridviewPanelApiImpl } from '../api/gridviewPanelApi';
import { Groupview, GroupOptions } from './groupview';
import { GridviewPanel } from '../gridview/gridviewPanel';

export class GroupviewPanel extends GridviewPanel {
    private readonly _model: Groupview;

    get model(): Groupview {
        return this._model;
    }

    get minimumHeight() {
        return this._model.minimumHeight;
    }

    get maximumHeight() {
        return this._model.maximumHeight;
    }

    get minimumWidth() {
        return this._model.minimumWidth;
    }

    get maximumWidth() {
        return this._model.maximumWidth;
    }

    constructor(
        accessor: IDockviewComponent,
        id: string,
        options: GroupOptions
    ) {
        super(id, 'groupview_default', new GridviewPanelApiImpl(id));

        this._model = new Groupview(this.element, accessor, id, options, this);
        this.model.initialize();
    }

    setActive(isActive: boolean): void {
        super.setActive(isActive);
        this.model.setActive(isActive);
    }

    layout(width: number, height: number) {
        super.layout(width, height);
        this.model.layout(width, height);
    }

    getComponent(): IFrameworkPart {
        return this._model;
    }

    toJSON(): any {
        return this.model.toJSON();
    }
}
