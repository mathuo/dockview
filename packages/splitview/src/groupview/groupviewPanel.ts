import { GroupPanelApi, IGroupPanelApi } from '../api/groupPanelApi';
import { Event } from '../events';
import { IGroupview, GroupChangeKind } from './groupview';
import {
    MutableDisposable,
    CompositeDisposable,
    IDisposable,
} from '../lifecycle';
import {
    HeaderPartInitParameters,
    PanelContentPart,
    PanelHeaderPart,
} from './types';
import { IPanel, PanelInitParameters, PanelUpdateEvent } from '../panel/types';
import { DockviewApi } from '../api/component.api';

export interface IGroupPanelInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    headerPart: PanelHeaderPart;
    contentPart: PanelContentPart;
}

export interface IGroupPanel extends IDisposable, IPanel {
    readonly header?: PanelHeaderPart;
    readonly content?: PanelContentPart;
    readonly group: IGroupview;
    readonly api: IGroupPanelApi;
    updateParentGroup(group: IGroupview, isGroupActive: boolean): void;
    setDirty(isDirty: boolean): void;
    close?(): Promise<boolean>;
    init(params: IGroupPanelInitParameters): void;
    onDidStateChange: Event<void>;
}

export class GroupviewPanel extends CompositeDisposable implements IGroupPanel {
    private readonly mutableDisposable = new MutableDisposable();

    readonly api: GroupPanelApi;
    private _group: IGroupview;
    private params?: IGroupPanelInitParameters;

    readonly onDidStateChange: Event<void>;

    private headerPart?: PanelHeaderPart;
    private contentPart?: PanelContentPart;

    get group() {
        return this._group;
    }

    get header() {
        return this.headerPart;
    }

    get content() {
        return this.contentPart;
    }

    constructor(
        public readonly id: string,
        private readonly containerApi: DockviewApi
    ) {
        super();

        this.api = new GroupPanelApi(this, this._group);
        this.onDidStateChange = this.api.onDidStateChange;

        this.addDisposables(
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

    public toJSON(): object {
        return {
            id: this.id,
            contentId: this.contentPart?.id,
            tabId: this.headerPart?.id,
            props: this.params.params,
            title: this.params.title,
            suppressClosable: this.params.suppressClosable,
            state: this.api.getState(),
        };
    }

    public update(params: PanelUpdateEvent): void {
        this.params.params = { ...this.params.params, ...params };

        this.contentPart?.update(params);
        this.headerPart?.update(params);
    }

    public init(params: IGroupPanelInitParameters): void {
        this.params = params;
        this.contentPart = params.contentPart;
        this.headerPart = params.headerPart;

        this.api.setState(this.params.state);

        this.content?.init({
            ...params,
            api: this.api,
            containerApi: this.containerApi,
        });
        this.header?.init({
            ...params,
            api: this.api,
            containerApi: this.containerApi,
        });
    }

    public updateParentGroup(group: IGroupview, isGroupActive: boolean) {
        this._group = group;
        this.api.group = group;

        this.mutableDisposable.value = this._group.onDidGroupChange((ev) => {
            if (ev.kind === GroupChangeKind.GROUP_ACTIVE) {
                const isPanelVisible = this._group.isPanelActive(this);
                this.api._onDidActiveChange.fire({
                    isActive: isGroupActive && isPanelVisible,
                });
                this.api._onDidVisibilityChange.fire({
                    isVisible: isPanelVisible,
                });
            }
        });

        // this.api._onDidChangeFocus.fire({ isFocused: isGroupActive });
        // this.api._onDidGroupPanelVisibleChange.fire({
        //     isVisible: this._group.isPanelActive(this),
        // });

        // this.api._onDidGroupPanelVisibleChange.fire({
        //     isVisible: this._group.isPanelActive(this),
        // });

        const isPanelVisible = this._group.isPanelActive(this);

        this.api._onDidActiveChange.fire({
            isActive: isGroupActive && isPanelVisible,
        });
        this.api._onDidVisibilityChange.fire({
            isVisible: isPanelVisible,
        });

        this.headerPart?.updateParentGroup(
            this._group,
            this._group.isPanelActive(this)
        );
        this.contentPart?.updateParentGroup(
            this._group,
            this._group.isPanelActive(this)
        );
    }

    public layout(width: number, height: number) {
        // the obtain the correct dimensions of the content panel we must deduct the tab height
        this.api._onDidPanelDimensionChange.fire({
            width,
            height: height - (this.group?.tabHeight || 0),
        });
    }

    public dispose() {
        this.api.dispose();
        this.mutableDisposable.dispose();

        this.headerPart?.dispose();
        this.contentPart?.dispose();
    }
}
