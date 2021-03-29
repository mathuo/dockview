import { DockviewPanelApi, IDockviewPanelApi } from '../api/groupPanelApi';
import { Event } from '../events';
import {
    MutableDisposable,
    CompositeDisposable,
    IDisposable,
} from '../lifecycle';
import { HeaderPartInitParameters } from './types';
import { IPanel, PanelInitParameters, PanelUpdateEvent } from '../panel/types';
import { DockviewApi } from '../api/component.api';
import { GroupviewPanel } from './groupviewPanel';
import { GroupChangeKind } from './groupview';
import { IGroupPanelView } from '../react/dockview/v2/defaultGroupPanelView';

export interface IGroupPanelInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    view: IGroupPanelView;
}

export interface IGroupPanel extends IDisposable, IPanel {
    readonly view?: IGroupPanelView;
    readonly group?: GroupviewPanel;
    readonly api: IDockviewPanelApi;
    updateParentGroup(group: GroupviewPanel, isGroupActive: boolean): void;
    setDirty(isDirty: boolean): void;
    close?(): Promise<boolean>;
    init(params: IGroupPanelInitParameters): void;
    onDidStateChange: Event<void>;
    toJSON(): GroupviewPanelState;
}

export interface GroupviewPanelState {
    id: string;
    view?: any;
    params?: { [key: string]: any };
    title: string;
    suppressClosable?: boolean;
    state?: { [key: string]: any };
}

export class GroupPanel extends CompositeDisposable implements IGroupPanel {
    private readonly mutableDisposable = new MutableDisposable();

    readonly api: DockviewPanelApi;
    private _group: GroupviewPanel | undefined;
    private params?: IGroupPanelInitParameters;

    readonly onDidStateChange: Event<void>;

    private _view?: IGroupPanelView;

    get group(): GroupviewPanel | undefined {
        return this._group;
    }

    get view() {
        return this._view;
    }

    constructor(
        public readonly id: string,
        private readonly containerApi: DockviewApi
    ) {
        super();

        this.api = new DockviewPanelApi(this, this._group);
        this.onDidStateChange = this.api.onDidStateChange;

        this.addDisposables(
            this.api.onActiveChange(() => {
                this.containerApi.setActivePanel(this);
            }),
            this.api.onDidTitleChange((event) => {
                const title = event.title;
                this.update({ params: { title } });
            })
        );
    }

    focus() {
        this.api._onFocusEvent.fire();
    }

    public setDirty(isDirty: boolean) {
        this.api._onDidDirtyChange.fire(isDirty);
    }

    public close(): Promise<boolean> {
        if (this.api.tryClose) {
            return this.api.tryClose();
        }

        return Promise.resolve(true);
    }

    public toJSON(): GroupviewPanelState {
        const params = this.params?.params;
        const state = this.api.getState();

        return {
            id: this.id,
            view: this.view!.toJSON(),
            params:
                params && Object.keys(params).length > 0 ? params : undefined,
            title: this.params?.title as string,
            suppressClosable: this.params?.suppressClosable,
            state: state && Object.keys(state).length > 0 ? state : undefined,
        };
    }

    public update(params: PanelUpdateEvent): void {
        if (this.params) {
            this.params.params = { ...(this.params?.params || {}), ...params };
        }

        this.view?.update(params);
    }

    public init(params: IGroupPanelInitParameters): void {
        this.params = params;
        this._view = params.view;

        if (params.state) {
            this.api.setState(params.state);
        }

        this.view?.init({
            ...params,
            api: this.api,
            containerApi: this.containerApi,
        });
    }

    public updateParentGroup(group: GroupviewPanel, isGroupActive: boolean) {
        this._group = group;
        this.api.group = group;

        this.mutableDisposable.value = this._group.group.onDidGroupChange(
            (ev) => {
                if (ev.kind === GroupChangeKind.GROUP_ACTIVE) {
                    const isVisible = !!this._group?.group.isPanelActive(this);
                    this.api._onDidActiveChange.fire({
                        isActive: isGroupActive && isVisible,
                    });
                    this.api._onDidVisibilityChange.fire({
                        isVisible,
                    });
                }
            }
        );

        const isPanelVisible = this._group.group.isPanelActive(this);

        this.api._onDidActiveChange.fire({
            isActive: isGroupActive && isPanelVisible,
        });
        this.api._onDidVisibilityChange.fire({
            isVisible: isPanelVisible,
        });

        this.view?.updateParentGroup(
            this._group,
            this._group.group.isPanelActive(this)
        );
    }

    public layout(width: number, height: number) {
        // the obtain the correct dimensions of the content panel we must deduct the tab height
        this.api._onDidPanelDimensionChange.fire({
            width,
            height: height - (this.group?.group.tabHeight || 0),
        });

        this.view?.layout(width, height);
    }

    public dispose() {
        this.api.dispose();
        this.mutableDisposable.dispose();

        this.view?.dispose();
    }
}
