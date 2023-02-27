import { DockviewApi } from '../api/component.api';
import {
    DockviewPanelApi,
    DockviewPanelApiImpl,
} from '../api/dockviewPanelApi';
import {
    GroupPanelUpdateEvent,
    GroupviewPanelState,
    IGroupPanelInitParameters,
} from '../groupview/types';
import { GroupPanel } from '../groupview/groupviewPanel';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { IPanel, Parameters } from '../panel/types';
import { IGroupPanelView } from './defaultGroupPanelView';
import { DockviewComponent } from './dockviewComponent';

export interface IDockviewPanel extends IDisposable, IPanel {
    readonly view?: IGroupPanelView;
    readonly group: GroupPanel;
    readonly api: DockviewPanelApi;
    readonly title: string;
    readonly params: Record<string, any> | undefined;
    updateParentGroup(group: GroupPanel, isGroupActive: boolean): void;
    init(params: IGroupPanelInitParameters): void;
    toJSON(): GroupviewPanelState;
    update(event: GroupPanelUpdateEvent): void;
}

export class DockviewPanel
    extends CompositeDisposable
    implements IDockviewPanel
{
    readonly api: DockviewPanelApiImpl;
    private _group: GroupPanel;
    private _params?: Parameters;

    private _view?: IGroupPanelView;

    private _title: string;

    get params(): Parameters | undefined {
        return this._params;
    }

    get title(): string {
        return this._title;
    }

    get group(): GroupPanel {
        return this._group;
    }

    get view(): IGroupPanelView | undefined {
        return this._view;
    }

    constructor(
        public readonly id: string,
        accessor: DockviewComponent,
        private readonly containerApi: DockviewApi,
        group: GroupPanel
    ) {
        super();
        this._title = '';
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
        this._view = params.view;

        if (typeof params.title === 'string') {
            this.setTitle(params.title);
        }

        this.view?.init({
            ...params,
            api: this.api,
            containerApi: this.containerApi,
        });
    }

    focus(): void {
        this.api._onFocusEvent.fire();
    }

    public toJSON(): GroupviewPanelState {
        return <GroupviewPanelState>{
            id: this.id,
            view: this.view!.toJSON(),
            params:
                Object.keys(this._params || {}).length > 0
                    ? this._params
                    : undefined,
            title: this.title,
        };
    }

    setTitle(title: string): void {
        const didTitleChange = title !== this._params?.title;

        if (didTitleChange) {
            this._title = title;

            this.view?.update({
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

        if (typeof params.title === 'string') {
            if (params.title !== this.title) {
                this._title = params.title;
                this.api._onDidTitleChange.fire({ title: this.title });
            }
        }

        this.view?.update({
            params: {
                params: this._params,
                title: this.title,
            },
        });
    }

    public updateParentGroup(group: GroupPanel, isGroupActive: boolean): void {
        this._group = group;
        this.api.group = group;

        const isPanelVisible = this._group.model.isPanelActive(this);

        this.api._onDidActiveChange.fire({
            isActive: isGroupActive && isPanelVisible,
        });
        this.api._onDidVisibilityChange.fire({
            isVisible: isPanelVisible,
        });

        this.view?.updateParentGroup(
            this._group,
            this._group.model.isPanelActive(this)
        );
    }

    public layout(width: number, height: number): void {
        // the obtain the correct dimensions of the content panel we must deduct the tab height
        this.api._onDidDimensionChange.fire({
            width,
            height: height - (this.group.model.header.height || 0),
        });

        this.view?.layout(width, height);
    }

    public dispose(): void {
        this.api.dispose();

        this.view?.dispose();
    }
}
