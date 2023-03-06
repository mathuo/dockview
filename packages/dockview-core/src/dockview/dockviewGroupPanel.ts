import { IFrameworkPart } from '../panel/types';
import { DockviewComponent } from '../dockview/dockviewComponent';
import { GridviewPanelApi } from '../api/gridviewPanelApi';
import {
    DockviewGroupPanelModel,
    GroupOptions,
    IHeader,
} from './dockviewGroupPanelModel';
import { GridviewPanel, IGridviewPanel } from '../gridview/gridviewPanel';
import { IDockviewPanel } from '../dockview/dockviewPanel';

export interface IDockviewGroupPanel extends IGridviewPanel {
    model: DockviewGroupPanelModel;
    locked: boolean;
    readonly size: number;
    readonly panels: IDockviewPanel[];
    readonly activePanel: IDockviewPanel | undefined;
}

export type IDockviewGroupPanelPublic = IDockviewGroupPanel;

export type DockviewGroupPanelApi = GridviewPanelApi;

export class DockviewGroupPanel
    extends GridviewPanel
    implements IDockviewGroupPanel
{
    private readonly _model: DockviewGroupPanelModel;

    get panels(): IDockviewPanel[] {
        return this._model.panels;
    }

    get activePanel(): IDockviewPanel | undefined {
        return this._model.activePanel;
    }

    get size(): number {
        return this._model.size;
    }

    get model(): DockviewGroupPanelModel {
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
        super(id, 'groupview_default');

        this._model = new DockviewGroupPanelModel(
            this.element,
            accessor,
            id,
            options,
            this
        );
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
