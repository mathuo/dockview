import { DockviewApi } from '../api/component.api';
import {
    DockviewPanelApi,
    DockviewPanelApiImpl,
} from '../api/dockviewPanelApi';
import {
    GroupPanelUpdateEvent,
    GroupviewPanelState,
    IGroupPanelInitParameters,
} from './types';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { IPanel, Parameters } from '../panel/types';
import { IDockviewPanelModel } from './dockviewPanelModel';
import { IDockviewComponent } from './dockviewComponent';

export interface IDockviewPanel extends IDisposable, IPanel {
    readonly view: IDockviewPanelModel;
    readonly group: DockviewGroupPanel;
    readonly api: DockviewPanelApi;
    readonly title: string | undefined;
    readonly params: Record<string, any> | undefined;
    updateParentGroup(group: DockviewGroupPanel, isGroupActive: boolean): void;
    init(params: IGroupPanelInitParameters): void;
    toJSON(): GroupviewPanelState;
    update(event: GroupPanelUpdateEvent): void;
}

export class DockviewPanel
    extends CompositeDisposable
    implements IDockviewPanel
{
    readonly api: DockviewPanelApiImpl;
    private _group: DockviewGroupPanel;
    private _params?: Parameters;

    private _title: string | undefined;

    get params(): Parameters | undefined {
        return this._params;
    }

    get title(): string | undefined {
        return this._title;
    }

    get group(): DockviewGroupPanel {
        return this._group;
    }

    constructor(
        public readonly id: string,
        accessor: IDockviewComponent,
        private readonly containerApi: DockviewApi,
        group: DockviewGroupPanel,
        readonly view: IDockviewPanelModel
    ) {
        super();
        this._group = group;

        this.api = new DockviewPanelApiImpl(this, this._group);

        this.addDisposables(
            this.api.onActiveChange(() => {
                accessor.setActivePanel(this);
            }),
            this.api.onDidSizeChange((event) => {
                // forward the resize event to the group since if you want to resize a panel
                // you are actually just resizing the panels parent which is the group
                this.group.api.setSize(event);
            })
        );
    }

    public init(params: IGroupPanelInitParameters): void {
        this._params = params.params;

        this.view.init({
            ...params,
            api: this.api,
            containerApi: this.containerApi,
        });

        this.setTitle(params.title);
    }

    focus(): void {
        this.api._onFocusEvent.fire();
    }

    public toJSON(): GroupviewPanelState {
        return <GroupviewPanelState>{
            id: this.id,
            contentComponent: this.view.contentComponent,
            tabComponent: this.view.tabComponent,
            params:
                Object.keys(this._params || {}).length > 0
                    ? this._params
                    : undefined,
            title: this.title,
        };
    }

    setTitle(title: string): void {
        const didTitleChange = title !== this.title;

        if (didTitleChange) {
            this._title = title;

            this.view.update({
                params: {
                    params: this._params,
                    title: this.title,
                },
            });
            this.api._onDidTitleChange.fire({ title });
        }
    }

    public update(event: GroupPanelUpdateEvent): void {
        const params = event.params as IGroupPanelInitParameters;

        this._params = {
            ...(this._params || {}),
            ...event.params.params,
        };

        if (params.title !== this.title) {
            this._title = params.title;
            this.api._onDidTitleChange.fire({ title: params.title });
        }

        this.view.update({
            params: {
                params: this._params,
                title: this.title,
            },
        });
    }

    public updateParentGroup(
        group: DockviewGroupPanel,
        isGroupActive: boolean
    ): void {
        this._group = group;
        this.api.group = group;

        const isPanelVisible = this._group.model.isPanelActive(this);

        this.api._onDidActiveChange.fire({
            isActive: isGroupActive && isPanelVisible,
        });
        this.api._onDidVisibilityChange.fire({
            isVisible: isPanelVisible,
        });

        this.view.updateParentGroup(
            this._group,
            this._group.model.isPanelActive(this)
        );
    }

    public layout(width: number, height: number): void {
        // the obtain the correct dimensions of the content panel we must deduct the tab height
        this.api._onDidDimensionChange.fire({
            width,
            height: height,
        });

        this.view.layout(width, height);
    }

    public dispose(): void {
        this.api.dispose();
        this.view.dispose();
    }
}
