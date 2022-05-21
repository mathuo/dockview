import { IFrameworkPart } from '../panel/types';
import { DockviewComponent } from '../dockview/dockviewComponent';
import {
    GridviewPanelApi,
    GridviewPanelApiImpl,
} from '../api/gridviewPanelApi';
import { Groupview, GroupOptions, IHeader } from './groupview';
import { GridviewPanel, IGridviewPanel } from '../gridview/gridviewPanel';
import { IDockviewPanel } from './groupPanel';

export interface IGroupviewPanel extends IGridviewPanel {
    model: Groupview;
    locked: boolean;
    readonly size: number;
    readonly panels: IDockviewPanel[];
    readonly activePanel: IDockviewPanel | undefined;
}

export type IGroupviewPanelPublic = IGroupviewPanel;

export type GroupviewPanelApi = GridviewPanelApi;

class GroupviewApi extends GridviewPanelApiImpl implements GroupviewPanelApi {}

export class GroupPanel extends GridviewPanel implements IGroupviewPanel {
    private readonly _model: Groupview;

    get panels(): IDockviewPanel[] {
        return this._model.panels;
    }

    get activePanel(): IDockviewPanel | undefined {
        return this._model.activePanel;
    }

    get size(): number {
        return this._model.size;
    }

    get model(): Groupview {
        return this._model;
    }

    get minimumHeight(): number {
        return this._model.minimumHeight;
    }

    get maximumHeight(): number {
        return this._model.maximumHeight;
    }

    get minimumWidth(): number {
        return this._model.minimumWidth;
    }

    get maximumWidth(): number {
        return this._model.maximumWidth;
    }

    get locked(): boolean {
        return this._model.locked;
    }

    set locked(value: boolean) {
        this._model.locked = value;
    }

    get header(): IHeader {
        return this._model.header;
    }

    constructor(
        accessor: DockviewComponent,
        id: string,
        options: GroupOptions
    ) {
        super(id, 'groupview_default', new GroupviewApi(id));

        this._model = new Groupview(this.element, accessor, id, options, this);
    }

    initialize() {
        this._model.initialize();
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
