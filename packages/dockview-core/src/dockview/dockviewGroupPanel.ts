import { IFrameworkPart } from '../panel/types';
import { DockviewComponent } from '../dockview/dockviewComponent';
import {
    DockviewGroupPanelModel,
    GroupOptions,
    IDockviewGroupPanelModel,
    IHeader,
    DockviewGroupPanelLocked,
} from './dockviewGroupPanelModel';
import { GridviewPanel, IGridviewPanel } from '../gridview/gridviewPanel';
import { IDockviewPanel } from '../dockview/dockviewPanel';
import {
    DockviewGroupPanelApi,
    DockviewGroupPanelApiImpl,
} from '../api/dockviewGroupPanelApi';

const MINIMUM_DOCKVIEW_GROUP_PANEL_WIDTH = 100;
const MINIMUM_DOCKVIEW_GROUP_PANEL_HEIGHT = 100;

export interface IDockviewGroupPanel
    extends IGridviewPanel<DockviewGroupPanelApi> {
    model: IDockviewGroupPanelModel;
    locked: DockviewGroupPanelLocked;
    readonly size: number;
    readonly panels: IDockviewPanel[];
    readonly activePanel: IDockviewPanel | undefined;
}

export type IDockviewGroupPanelPublic = IDockviewGroupPanel;

export class DockviewGroupPanel
    extends GridviewPanel<DockviewGroupPanelApiImpl>
    implements IDockviewGroupPanel
{
    private readonly _model: DockviewGroupPanelModel;

    get minimumWidth(): number {
        const sizes = this.panels
            .filter((panel) => typeof panel.minimumWidth === 'number')
            .map((panel) => panel.minimumWidth) as number[];

        return sizes.length > 0 ? Math.max(...sizes) : 100;
    }

    get minimumHeight(): number {
        const sizes = this.panels
            .filter((panel) => typeof panel.minimumHeight === 'number')
            .map((panel) => panel.minimumHeight) as number[];

        return sizes.length > 0 ? Math.max(...sizes) : 100;
    }

    get maximumWidth(): number {
        const sizes = this.panels
            .filter((panel) => typeof panel.maximumWidth === 'number')
            .map((panel) => panel.maximumWidth) as number[];

        return sizes.length > 0 ? Math.min(...sizes) : Number.MAX_SAFE_INTEGER;
    }

    get maximumHeight(): number {
        const sizes = this.panels
            .filter((panel) => typeof panel.maximumHeight === 'number')
            .map((panel) => panel.maximumHeight) as number[];

        return sizes.length > 0 ? Math.min(...sizes) : Number.MAX_SAFE_INTEGER;
    }

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

    get locked(): DockviewGroupPanelLocked {
        return this._model.locked;
    }

    set locked(value: DockviewGroupPanelLocked) {
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
        super(
            id,
            'groupview_default',
            {
                minimumHeight:
                    options.constraints?.minimumHeight ??
                    MINIMUM_DOCKVIEW_GROUP_PANEL_HEIGHT,
                minimumWidth:
                    options.constraints?.maximumHeight ??
                    MINIMUM_DOCKVIEW_GROUP_PANEL_WIDTH,
                maximumHeight: options.constraints?.maximumHeight,
                maximumWidth: options.constraints?.maximumWidth,
            },
            new DockviewGroupPanelApiImpl(id, accessor)
        );

        this.api.initialize(this); // cannot use 'this' after after 'super' call

        this._model = new DockviewGroupPanelModel(
            this.element,
            accessor,
            id,
            options,
            this
        );
    }

    override focus(): void {
        if (!this.api.isActive) {
            this.api.setActive();
        }
        super.focus();
    }

    initialize(): void {
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
